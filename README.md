# LoFTP

LoFTP is licensed under the [MIT License](LICENSE). Source code is public, and payments in the app are voluntary contributions to continued development.

## Why LoFTP Exists

LoFTP started from a simple need: on macOS, I was missing the speed and workflow of Total Commander, and none of the available alternatives felt right for the way I work. So I started building my own file manager, focused on practical day-to-day use instead of feature lists for their own sake.

![LoFTP Screenshot](docs/loftp-main-window.png)
![LoFTP Screenshot 2](docs/loftp-secondary-window.png)

LoFTP brings a fast dual-pane workflow to macOS and combines local file management with direct access to remote servers in a way that stays efficient, familiar, and immediate.

## Current Implemented Scope

LoFTP is a dual-pane file manager for macOS built for working with both local and remote files. The application currently includes:

- Dual-pane local and remote file browsing
- Saved FTP, FTPS, and SFTP connections
- Credentials stored through the system keychain
- Upload and download of files and directories
- Transfer dialog with overwrite, resume, timestamp, permission, symlink, verification, and directory creation options
- Transfer queue with progress reporting and cancellation
- Local-to-local copy between panes
- Directory comparison between the left and right pane
- Local filesystem search by file name and file content
- Archive browsing and extraction for `zip`, `tar`, `tar.gz`, and `tgz`
- ZIP archive creation from selected local files
- Quick view for text, images, PDF files, and binary files in hex mode
- Built-in text editor for local text files
- Open selected local files and folders directly in VS Code
- Quick access to mounted volumes, iCloud, and common CloudStorage folders on macOS
- Light and dark themes
- Interface localization in English, Czech, German, Slovak, Polish, and Spanish
- In-app update checks and installation flow through Tauri updater

## AI, Codex, And VS Code Integration

LoFTP already includes practical integrations for development-oriented workflows:

- AI-assisted file explanation, search, and compare review inside the application
- Codex-assisted explain, compare, sync, and transfer review flows
- Direct opening of selected local files and folders in VS Code

Planned next step for Codex-oriented workflows:

- a local control API / Codex add-on layer for working with saved LoFTP hostings without exposing credentials in chat

## Notes About Current Behavior

- The current implementation is explicitly macOS-oriented. Volume discovery and cloud storage shortcuts use macOS paths.
- Search is implemented for the local filesystem. It is not currently a remote server search.
- The built-in editor writes local text files. Remote editing is not implemented as a direct in-place edit flow.
- Archive creation currently supports ZIP output only.
- The application can be used without activating a license. Payment primarily supports further development of the project.

## Main Advantage

The main advantage of LoFTP is straightforward: it does not limit how many FTP or SFTP connections you can save, and those connections are available in a single click. The goal is to remove friction from switching between projects, servers, and environments.

## Licensing And Project Support

LoFTP source code has been publicly shared on GitHub from the beginning of the project and is now licensed under MIT.

The home page of the project is [www.loftp.space](https://www.loftp.space), where users can support further development of LoFTP.

The displayed contribution amount in the application is 25 EUR.

The application itself works without functional restrictions. Payment is primarily a voluntary contribution to continued development, future improvements, and long-term maintenance.

The project name, logo, and branding are described separately in [TRADEMARKS.md](TRADEMARKS.md).

## Roadmap Notes

The current AI integration implementation plan for LoFTP is documented in [docs/ai-integration-blueprint.md](docs/ai-integration-blueprint.md).

## Feedback And Contributions

If you have an idea for an improvement, want to contribute, or would like to help shape the next version, feel free to get in touch.

If you send a useful improvement or code contribution, I will be happy to include it in a future release of LoFTP.

## Contact

info@mylocalio.com

Bradacz
