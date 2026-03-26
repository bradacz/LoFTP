use crate::models::file_item::FileItem;
use std::fs::File;
use std::io::{BufReader, BufWriter, Read, Write};
use std::path::Path;
use std::str::FromStr;
use suppaftp::list::File as SuppaFile;
use suppaftp::{FtpStream, NativeTlsConnector, NativeTlsFtpStream};

const CHUNK_SIZE: usize = 64 * 1024;

enum FtpInner {
    Plain(FtpStream),
    Tls(NativeTlsFtpStream),
}

/// Macro to dispatch method calls to whichever variant is active.
macro_rules! ftp {
    ($self:expr, $method:ident ( $($arg:expr),* )) => {
        match &mut $self.inner {
            FtpInner::Plain(s) => s.$method($($arg),*),
            FtpInner::Tls(s) => s.$method($($arg),*),
        }
    };
}

pub struct FtpSession {
    inner: FtpInner,
    host: String,
    port: u16,
    user: String,
    pass: String,
    use_tls: bool,
}

impl FtpSession {
    pub fn connect(host: &str, port: u16, user: &str, pass: &str, use_tls: bool) -> Result<Self, String> {
        let inner = Self::create_connection(host, port, user, pass, use_tls)?;
        Ok(Self {
            inner,
            host: host.to_string(),
            port,
            user: user.to_string(),
            pass: pass.to_string(),
            use_tls,
        })
    }

    fn create_connection(host: &str, port: u16, user: &str, pass: &str, use_tls: bool) -> Result<FtpInner, String> {
        let addr = format!("{}:{}", host, port);
        if use_tls {
            let connector = NativeTlsConnector::from(
                native_tls::TlsConnector::builder()
                    .danger_accept_invalid_certs(true)
                    .build()
                    .map_err(|e| format!("TLS init failed: {}", e))?,
            );
            let s = NativeTlsFtpStream::connect(&addr)
                .map_err(|e| format!("FTP connect failed: {}", e))?;
            // Upgrade to TLS before login (sends AUTH TLS)
            let mut tls = s
                .into_secure(connector, host)
                .map_err(|e| format!("FTPS TLS upgrade failed: {}", e))?;
            tls.login(user, pass)
                .map_err(|e| format!("FTP login failed: {}", e))?;
            tls.transfer_type(suppaftp::types::FileType::Binary)
                .map_err(|e| format!("Set binary mode failed: {}", e))?;
            Ok(FtpInner::Tls(tls))
        } else {
            let mut s = FtpStream::connect(&addr)
                .map_err(|e| format!("FTP connect failed: {}", e))?;
            s.login(user, pass)
                .map_err(|e| format!("FTP login failed: {}", e))?;
            s.transfer_type(suppaftp::types::FileType::Binary)
                .map_err(|e| format!("Set binary mode failed: {}", e))?;
            Ok(FtpInner::Plain(s))
        }
    }

    /// Reconnect if the session has expired
    pub fn reconnect(&mut self) -> Result<(), String> {
        self.inner = Self::create_connection(&self.host, self.port, &self.user, &self.pass, self.use_tls)?;
        Ok(())
    }

    /// Check if connection is alive; reconnect if not
    pub fn ensure_connected(&mut self) -> Result<(), String> {
        match ftp!(self, pwd()) {
            Ok(_) => Ok(()),
            Err(_) => self.reconnect(),
        }
    }

    pub fn list_dir(&mut self, path: &str) -> Result<Vec<FileItem>, String> {
        self.ensure_connected()?;
        if let Ok(entries) = ftp!(self, mlsd(Some(path))) {
            let items: Vec<FileItem> = entries
                .iter()
                .filter_map(|entry| parse_mlsx_entry(entry))
                .filter(|item| !is_special_name(&item.name))
                .collect();

            if !items.is_empty() {
                return Ok(items);
            }
        }

        if let Ok(entries) = ftp!(self, list(Some(path))) {
            let items: Vec<FileItem> = entries
                .iter()
                .filter_map(|entry| parse_ftp_entry(entry))
                .filter(|item| !is_special_name(&item.name))
                .collect();

            if !items.is_empty() {
                return Ok(items);
            }
        }

        let original_dir = ftp!(self, pwd()).ok();

        ftp!(self, nlst(Some(path)))
            .map_err(|e| format!("FTP list failed: {}", e))
            .map(|entries| {
                entries
                    .into_iter()
                    .filter_map(|name| {
                        let trimmed = name.trim();
                        let item_name = basename(trimmed);
                        if item_name.is_empty() || is_special_name(&item_name) {
                            None
                        } else {
                            let joined_path = join_ftp_path(path, &item_name);
                            Some(self.inspect_nlst_entry(&joined_path).unwrap_or_else(|| {
                                FileItem {
                                    name: item_name,
                                    size: 0,
                                    modified: "—".to_string(),
                                    is_directory: false,
                                    permissions: Some("unknown".to_string()),
                                    is_symlink: None,
                                    symlink_target: None,
                                    resolved_path: None,
                                    entry_path: None,
                                }
                            }))
                        }
                    })
                    .collect()
            })
            .inspect(|_| {
                if let Some(dir) = &original_dir {
                    let _ = ftp!(self, cwd(dir));
                }
            })
    }

    /// Upload with chunked progress callback: cb(bytes_sent_so_far, total_bytes)
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
        let file = File::open(local_path).map_err(|e| format!("Read local file failed: {}", e))?;
        let total = file
            .metadata()
            .map_err(|e| format!("Read local file metadata failed: {}", e))?
            .len();
        on_progress(0, total);

        let buffered = BufReader::with_capacity(CHUNK_SIZE, file);
        let mut reader = ProgressReader::new(buffered, total, &mut on_progress);
        if let Some(token) = cancel_token {
            reader = reader.with_cancel(token);
        }
        ftp!(self, put_file(remote_path, &mut reader))
            .map(|_| ())
            .map_err(|e| format!("FTP upload failed: {}", e))
    }

    /// Download with chunked progress callback
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
        let total = self.file_size(remote_path);
        on_progress(0, total);

        let local_file =
            File::create(local_path).map_err(|e| format!("Write local file failed: {}", e))?;
        let mut writer = BufWriter::with_capacity(CHUNK_SIZE, local_file);
        let mut received = 0u64;

        ftp!(self, retr(remote_path, |reader| {
            let mut buffer = [0u8; CHUNK_SIZE];
            loop {
                if let Some(token) = cancel_token {
                    if token.load(std::sync::atomic::Ordering::Relaxed) {
                        return Err(suppaftp::FtpError::ConnectionError(
                            std::io::Error::new(std::io::ErrorKind::Interrupted, "Transfer cancelled")
                        ));
                    }
                }
                let bytes_read = reader
                    .read(&mut buffer)
                    .map_err(suppaftp::FtpError::ConnectionError)?;
                if bytes_read == 0 {
                    break;
                }

                writer
                    .write_all(&buffer[..bytes_read])
                    .map_err(suppaftp::FtpError::ConnectionError)?;
                received += bytes_read as u64;
                on_progress(received, total);
            }

            writer
                .flush()
                .map_err(suppaftp::FtpError::ConnectionError)?;
            Ok(())
        }))
        .map_err(|e| format!("FTP download failed: {}", e))
    }

    pub fn mkdir(&mut self, path: &str) -> Result<(), String> {
        self.ensure_connected()?;
        ftp!(self, mkdir(path))
            .map_err(|e| format!("FTP mkdir failed: {}", e))
    }

    /// Create directory and all parents (like mkdir -p)
    pub fn mkdir_p(&mut self, path: &str) -> Result<(), String> {
        self.ensure_connected()?;
        let parts: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();
        let mut current = String::new();
        for part in parts {
            current = format!("{}/{}", current, part);
            let _ = ftp!(self, mkdir(&current));
        }
        Ok(())
    }

    pub fn delete_file(&mut self, path: &str) -> Result<(), String> {
        self.ensure_connected()?;
        ftp!(self, rm(path))
            .map_err(|e| format!("FTP delete failed: {}", e))
    }

    pub fn delete_dir(&mut self, path: &str) -> Result<(), String> {
        self.ensure_connected()?;
        ftp!(self, rmdir(path))
            .map_err(|e| format!("FTP rmdir failed: {}", e))
    }

    /// Recursively delete a directory and all contents
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
        ftp!(self, rename(from, to))
            .map_err(|e| format!("FTP rename failed: {}", e))
    }

    pub fn exists(&mut self, path: &str) -> Result<bool, String> {
        self.ensure_connected()?;

        if ftp!(self, mlst(Some(path))).is_ok() {
            return Ok(true);
        }

        let parent = parent_ftp_path(path);
        let target_name = basename(path);
        if target_name.is_empty() {
            return Ok(false);
        }

        let entries = self.list_dir(&parent)?;
        Ok(entries.iter().any(|entry| entry.name == target_name))
    }

    /// Get size of remote file (returns 0 if unknown)
    pub fn file_size(&mut self, path: &str) -> u64 {
        ftp!(self, size(path)).unwrap_or(0) as u64
    }

    /// Get modification time of a remote file (returns None if unavailable)
    pub fn file_mtime(&mut self, path: &str) -> Option<i64> {
        // Try MDTM command first
        if let Ok(dt) = ftp!(self, mdtm(path)) {
            return Some(dt.and_utc().timestamp());
        }
        // Try MLST as fallback
        if let Ok(entry) = ftp!(self, mlst(Some(path))) {
            if let Some(item) = parse_mlsx_entry(&entry) {
                // Parse the modified string back to timestamp
                if let Ok(dt) = chrono::NaiveDateTime::parse_from_str(&item.modified, "%Y-%m-%d %H:%M") {
                    return Some(dt.and_utc().timestamp());
                }
            }
        }
        None
    }

    pub fn disconnect(&mut self) -> Result<(), String> {
        ftp!(self, quit())
            .map_err(|e| format!("FTP disconnect failed: {}", e))
    }

    fn inspect_nlst_entry(&mut self, full_path: &str) -> Option<FileItem> {
        if let Ok(entry) = ftp!(self, mlst(Some(full_path))) {
            if let Some(parsed) = parse_mlsx_entry(&entry) {
                return Some(FileItem {
                    name: basename(full_path),
                    ..parsed
                });
            }
        }

        let original_dir = ftp!(self, pwd()).ok()?;
        let is_directory = ftp!(self, cwd(full_path)).is_ok();
        let _ = ftp!(self, cwd(&original_dir));

        Some(FileItem {
            name: basename(full_path),
            size: 0,
            modified: "—".to_string(),
            is_directory,
            permissions: Some(if is_directory {
                "dir".to_string()
            } else {
                "unknown".to_string()
            }),
            is_symlink: None,
            symlink_target: None,
            resolved_path: None,
            entry_path: None,
        })
    }
}

/// Reader wrapper that calls a progress callback after each chunk read.
/// Supports cancellation via an AtomicBool token.
struct ProgressReader<'a, R: Read, F: FnMut(u64, u64)> {
    inner: R,
    total: u64,
    sent: u64,
    on_progress: &'a mut F,
    cancel_token: Option<&'a std::sync::atomic::AtomicBool>,
}

impl<'a, R: Read, F: FnMut(u64, u64)> ProgressReader<'a, R, F> {
    fn new(inner: R, total: u64, on_progress: &'a mut F) -> Self {
        Self {
            inner,
            total,
            sent: 0,
            on_progress,
            cancel_token: None,
        }
    }

    fn with_cancel(mut self, token: &'a std::sync::atomic::AtomicBool) -> Self {
        self.cancel_token = Some(token);
        self
    }
}

impl<R: Read, F: FnMut(u64, u64)> Read for ProgressReader<'_, R, F> {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        if let Some(token) = self.cancel_token {
            if token.load(std::sync::atomic::Ordering::Relaxed) {
                return Err(std::io::Error::new(std::io::ErrorKind::Interrupted, "Transfer cancelled"));
            }
        }
        let n = self.inner.read(buf)?;
        self.sent += n as u64;
        (self.on_progress)(self.sent, self.total);
        Ok(n)
    }
}

fn parse_ftp_entry(line: &str) -> Option<FileItem> {
    let entry = SuppaFile::from_str(line).ok()?;
    Some(file_item_from_suppa(&entry))
}

fn parse_mlsx_entry(line: &str) -> Option<FileItem> {
    let entry = SuppaFile::from_mlsx_line(line).ok()?;
    Some(file_item_from_suppa(&entry))
}

fn file_item_from_suppa(entry: &SuppaFile) -> FileItem {
    let modified = chrono::DateTime::<chrono::Local>::from(entry.modified())
        .format("%Y-%m-%d %H:%M")
        .to_string();

    FileItem {
        name: entry.name().to_string(),
        size: entry.size() as u64,
        modified,
        is_directory: entry.is_directory(),
        permissions: permissions_from_entry(entry),
        is_symlink: None,
        symlink_target: None,
        resolved_path: None,
        entry_path: None,
    }
}

fn permissions_from_entry(entry: &SuppaFile) -> Option<String> {
    if entry.is_directory() {
        Some("dir".to_string())
    } else {
        None
    }
}

fn is_special_name(name: &str) -> bool {
    name == "." || name == ".."
}

fn basename(path: &str) -> String {
    Path::new(path)
        .file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_else(|| path.trim_matches('/').to_string())
}

fn parent_ftp_path(path: &str) -> String {
    Path::new(path)
        .parent()
        .map(|parent| {
            let value = parent.to_string_lossy().replace('\\', "/");
            if value.is_empty() || value == "." {
                "/".to_string()
            } else {
                value
            }
        })
        .unwrap_or_else(|| "/".to_string())
}

fn join_ftp_path(base: &str, name: &str) -> String {
    if base.is_empty() || base == "/" {
        format!("/{}", name)
    } else {
        format!("{}/{}", base.trim_end_matches('/'), name)
    }
}
