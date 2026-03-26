import { FileItem } from "@/types/ftp";

export const localFiles: FileItem[] = [
  { name: "Documents", size: 0, modified: "2026-03-20", isDirectory: true },
  { name: "Downloads", size: 0, modified: "2026-03-22", isDirectory: true },
  { name: "Projects", size: 0, modified: "2026-03-23", isDirectory: true },
  { name: "Desktop", size: 0, modified: "2026-03-23", isDirectory: true },
  { name: "readme.md", size: 4520, modified: "2026-03-18", isDirectory: false },
  { name: "index.html", size: 12840, modified: "2026-03-21", isDirectory: false },
  { name: "styles.css", size: 8920, modified: "2026-03-21", isDirectory: false },
  { name: "app.js", size: 34200, modified: "2026-03-22", isDirectory: false },
  { name: "package.json", size: 1240, modified: "2026-03-19", isDirectory: false },
  { name: "logo.png", size: 245000, modified: "2026-03-15", isDirectory: false },
  { name: "favicon.ico", size: 4286, modified: "2026-03-10", isDirectory: false },
  { name: "config.yml", size: 890, modified: "2026-03-17", isDirectory: false },
];

export const remoteFiles: FileItem[] = [
  { name: "public_html", size: 0, modified: "2026-03-19", isDirectory: true },
  { name: "logs", size: 0, modified: "2026-03-23", isDirectory: true },
  { name: "backups", size: 0, modified: "2026-03-15", isDirectory: true },
  { name: ".htaccess", size: 420, modified: "2026-03-12", isDirectory: false },
  { name: "wp-config.php", size: 3200, modified: "2026-03-18", isDirectory: false },
  { name: "robots.txt", size: 120, modified: "2026-03-10", isDirectory: false },
  { name: "error_log", size: 890000, modified: "2026-03-23", isDirectory: false },
];

export const subfolderFiles: FileItem[] = [
  { name: "..", size: 0, modified: "", isDirectory: true },
  { name: "images", size: 0, modified: "2026-03-20", isDirectory: true },
  { name: "css", size: 0, modified: "2026-03-21", isDirectory: true },
  { name: "js", size: 0, modified: "2026-03-21", isDirectory: true },
  { name: "index.html", size: 15600, modified: "2026-03-22", isDirectory: false },
  { name: "about.html", size: 8900, modified: "2026-03-20", isDirectory: false },
  { name: "contact.php", size: 5400, modified: "2026-03-19", isDirectory: false },
];
