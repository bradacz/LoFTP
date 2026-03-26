use crate::models::file_item::FileItem;
use ssh2::Session;
use std::fs::File;
use std::io::{BufReader, BufWriter, Read, Write};
use std::net::TcpStream;
use std::path::Path;

const CHUNK_SIZE: usize = 64 * 1024; // 64 KB

pub struct SftpSession {
    session: Session,
    host: String,
    port: u16,
    user: String,
    pass: String,
    key_path: Option<String>,
}

impl SftpSession {
    pub fn connect(host: &str, port: u16, user: &str, pass: &str, key_path: Option<&str>) -> Result<Self, String> {
        let addr = format!("{}:{}", host, port);
        let tcp = TcpStream::connect(&addr).map_err(|e| format!("TCP connect failed: {}", e))?;
        let mut session = Session::new().map_err(|e| format!("SSH session failed: {}", e))?;
        session.set_tcp_stream(tcp);
        session
            .handshake()
            .map_err(|e| format!("SSH handshake failed: {}", e))?;

        Self::authenticate(&session, user, pass, key_path)?;

        Ok(Self {
            session,
            host: host.to_string(),
            port,
            user: user.to_string(),
            pass: pass.to_string(),
            key_path: key_path.map(|s| s.to_string()),
        })
    }

    fn authenticate(session: &Session, user: &str, pass: &str, key_path: Option<&str>) -> Result<(), String> {
        if let Some(kp) = key_path {
            let expanded = shellexpand::tilde(kp).to_string();
            let passphrase = if pass.is_empty() { None } else { Some(pass) };
            session
                .userauth_pubkey_file(user, None, Path::new(&expanded), passphrase)
                .map_err(|e| format!("SSH key auth failed: {}", e))?;
        } else {
            session
                .userauth_password(user, pass)
                .map_err(|e| format!("SSH auth failed: {}", e))?;
        }
        Ok(())
    }

    /// Reconnect if session expired
    pub fn reconnect(&mut self) -> Result<(), String> {
        let addr = format!("{}:{}", self.host, self.port);
        let tcp = TcpStream::connect(&addr).map_err(|e| format!("TCP reconnect failed: {}", e))?;
        let mut session = Session::new().map_err(|e| format!("SSH session failed: {}", e))?;
        session.set_tcp_stream(tcp);
        session
            .handshake()
            .map_err(|e| format!("SSH handshake failed: {}", e))?;

        Self::authenticate(&session, &self.user, &self.pass, self.key_path.as_deref())?;

        self.session = session;
        Ok(())
    }

    /// Check if session is alive; reconnect if not
    pub fn ensure_connected(&mut self) -> Result<(), String> {
        if self.session.authenticated() {
            // Try a quick sftp operation to verify
            match self.session.sftp() {
                Ok(_) => Ok(()),
                Err(_) => self.reconnect(),
            }
        } else {
            self.reconnect()
        }
    }

    pub fn list_dir(&mut self, path: &str) -> Result<Vec<FileItem>, String> {
        self.ensure_connected()?;
        let sftp = self
            .session
            .sftp()
            .map_err(|e| format!("SFTP init failed: {}", e))?;
        let entries = sftp
            .readdir(Path::new(path))
            .map_err(|e| format!("SFTP readdir failed: {}", e))?;

        let mut items = Vec::new();
        for (pathbuf, stat) in entries {
            let name = pathbuf
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();

            if name == "." {
                continue;
            }

            let is_directory = stat.is_dir();
            let size = stat.size.unwrap_or(0);
            let modified = match stat.mtime {
                Some(t) => {
                    let dt = chrono::DateTime::from_timestamp(t as i64, 0).unwrap_or_default();
                    dt.format("%Y-%m-%d %H:%M").to_string()
                }
                None => String::from("—"),
            };
            let permissions = stat.perm.map(|p| format!("{:o}", p));

            items.push(FileItem {
                name,
                size,
                modified,
                is_directory,
                permissions,
                is_symlink: None,
                symlink_target: None,
                resolved_path: None,
                entry_path: None,
            });
        }
        Ok(items)
    }

    /// Upload with chunked progress
    pub fn upload_with_progress<F: FnMut(u64, u64)>(
        &mut self,
        local_path: &str,
        remote_path: &str,
        on_progress: F,
    ) -> Result<(), String> {
        self.upload_with_progress_cancel(local_path, remote_path, on_progress, None)
    }

    /// Upload with optional cancellation token
    pub fn upload_with_progress_cancel<F: FnMut(u64, u64)>(
        &mut self,
        local_path: &str,
        remote_path: &str,
        mut on_progress: F,
        cancel_token: Option<&std::sync::atomic::AtomicBool>,
    ) -> Result<(), String> {
        self.ensure_connected()?;
        let sftp = self
            .session
            .sftp()
            .map_err(|e| format!("SFTP init failed: {}", e))?;
        let file = File::open(local_path).map_err(|e| format!("Read local file failed: {}", e))?;
        let total = file
            .metadata()
            .map_err(|e| format!("Read local file metadata failed: {}", e))?
            .len();
        on_progress(0, total);

        let mut remote_file = sftp
            .create(Path::new(remote_path))
            .map_err(|e| format!("SFTP create failed: {}", e))?;
        let mut local_file = BufReader::with_capacity(CHUNK_SIZE, file);
        let mut buffer = vec![0u8; CHUNK_SIZE];

        let mut sent: u64 = 0;
        loop {
            if let Some(token) = cancel_token {
                if token.load(std::sync::atomic::Ordering::Relaxed) {
                    return Err("Transfer cancelled".to_string());
                }
            }
            let read = local_file
                .read(&mut buffer)
                .map_err(|e| format!("Read local file failed: {}", e))?;
            if read == 0 {
                break;
            }
            remote_file
                .write_all(&buffer[..read])
                .map_err(|e| format!("SFTP write failed: {}", e))?;
            sent += read as u64;
            on_progress(sent, total);
        }
        Ok(())
    }

    /// Download with chunked progress
    pub fn download_with_progress<F: FnMut(u64, u64)>(
        &mut self,
        remote_path: &str,
        local_path: &str,
        on_progress: F,
    ) -> Result<(), String> {
        self.download_with_progress_cancel(remote_path, local_path, on_progress, None)
    }

    /// Download with optional cancellation token
    pub fn download_with_progress_cancel<F: FnMut(u64, u64)>(
        &mut self,
        remote_path: &str,
        local_path: &str,
        mut on_progress: F,
        cancel_token: Option<&std::sync::atomic::AtomicBool>,
    ) -> Result<(), String> {
        self.ensure_connected()?;
        let sftp = self
            .session
            .sftp()
            .map_err(|e| format!("SFTP init failed: {}", e))?;

        let stat = sftp
            .stat(Path::new(remote_path))
            .map_err(|e| format!("SFTP stat failed: {}", e))?;
        let total = stat.size.unwrap_or(0);
        on_progress(0, total);

        let mut remote_file = sftp
            .open(Path::new(remote_path))
            .map_err(|e| format!("SFTP open failed: {}", e))?;

        let local_file =
            File::create(local_path).map_err(|e| format!("Create local file failed: {}", e))?;
        let mut local_file = BufWriter::with_capacity(CHUNK_SIZE, local_file);

        let mut buf = vec![0u8; CHUNK_SIZE];
        let mut received: u64 = 0;
        loop {
            if let Some(token) = cancel_token {
                if token.load(std::sync::atomic::Ordering::Relaxed) {
                    return Err("Transfer cancelled".to_string());
                }
            }
            let n = remote_file
                .read(&mut buf)
                .map_err(|e| format!("SFTP read failed: {}", e))?;
            if n == 0 {
                break;
            }
            local_file
                .write_all(&buf[..n])
                .map_err(|e| format!("Write local file failed: {}", e))?;
            received += n as u64;
            on_progress(received, total);
        }
        local_file
            .flush()
            .map_err(|e| format!("Flush local file failed: {}", e))?;
        Ok(())
    }

    pub fn mkdir(&mut self, path: &str) -> Result<(), String> {
        self.ensure_connected()?;
        let sftp = self
            .session
            .sftp()
            .map_err(|e| format!("SFTP init failed: {}", e))?;
        sftp.mkdir(Path::new(path), 0o755)
            .map_err(|e| format!("SFTP mkdir failed: {}", e))
    }

    /// Create directory and all parents
    pub fn mkdir_p(&mut self, path: &str) -> Result<(), String> {
        self.ensure_connected()?;
        let sftp = self
            .session
            .sftp()
            .map_err(|e| format!("SFTP init failed: {}", e))?;
        let parts: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();
        let mut current = String::new();
        for part in parts {
            current = format!("{}/{}", current, part);
            let _ = sftp.mkdir(Path::new(&current), 0o755);
        }
        Ok(())
    }

    pub fn delete_file(&mut self, path: &str) -> Result<(), String> {
        self.ensure_connected()?;
        let sftp = self
            .session
            .sftp()
            .map_err(|e| format!("SFTP init failed: {}", e))?;
        sftp.unlink(Path::new(path))
            .map_err(|e| format!("SFTP delete failed: {}", e))
    }

    pub fn delete_dir(&mut self, path: &str) -> Result<(), String> {
        self.ensure_connected()?;
        let sftp = self
            .session
            .sftp()
            .map_err(|e| format!("SFTP init failed: {}", e))?;
        sftp.rmdir(Path::new(path))
            .map_err(|e| format!("SFTP rmdir failed: {}", e))
    }

    /// Recursively delete a directory
    pub fn delete_dir_recursive(&mut self, path: &str) -> Result<(), String> {
        let items = self.list_dir(path)?;
        for item in items {
            if item.name == ".." {
                continue;
            }
            let child = format!("{}/{}", path, item.name);
            if item.is_directory {
                self.delete_dir_recursive(&child)?;
            } else {
                self.delete_file(&child)?;
            }
        }
        self.delete_dir(path)
    }

    pub fn rename(&mut self, from: &str, to: &str) -> Result<(), String> {
        self.ensure_connected()?;
        let sftp = self
            .session
            .sftp()
            .map_err(|e| format!("SFTP init failed: {}", e))?;
        sftp.rename(Path::new(from), Path::new(to), None)
            .map_err(|e| format!("SFTP rename failed: {}", e))
    }

    /// Get modification time of a remote file (returns None if unavailable)
    pub fn file_mtime(&mut self, path: &str) -> Option<i64> {
        self.ensure_connected().ok()?;
        let sftp = self.session.sftp().ok()?;
        let stat = sftp.stat(Path::new(path)).ok()?;
        stat.mtime.map(|t| t as i64)
    }

    pub fn exists(&mut self, path: &str) -> Result<bool, String> {
        self.ensure_connected()?;
        let sftp = self
            .session
            .sftp()
            .map_err(|e| format!("SFTP init failed: {}", e))?;
        Ok(sftp.stat(Path::new(path)).is_ok())
    }

    pub fn disconnect(&mut self) -> Result<(), String> {
        self.session
            .disconnect(None, "bye", None)
            .map_err(|e| format!("SSH disconnect failed: {}", e))
    }
}
