# Getting Started

## What LoFTP Is

LoFTP is a macOS desktop application for working with:

- local files
- FTP servers
- FTPS servers
- SFTP servers
- Bunny Storage

It uses a dual-pane workflow inspired by classic commander-style file managers.

## Core Workflow

Typical use:

1. open LoFTP
2. keep one pane local and one pane remote
3. connect to a saved server profile
4. compare, upload, download, or inspect files
5. optionally enable the bundled Codex Connector in `Settings -> Codex`

## Current Platform Scope

LoFTP is currently macOS-oriented.

That means:

- local volume discovery uses macOS paths
- cloud shortcuts are tuned for macOS locations
- the current desktop packaging and release flow targets macOS

## Saved Connections

LoFTP supports saved profiles for:

- FTP
- FTPS
- SFTP
- Bunny Storage

Credentials are stored using the system keychain where available.

## Codex Connector

The Codex Connector is included with LoFTP. Open `Settings -> Codex`, enable the local bridge, click `Install / repair connector`, and then click `Test connector`.

The connector lets Codex use saved LoFTP profiles without receiving passwords, API keys, SSH keys, or Bunny Storage access keys.

## Installation Notes

The project repository contains the application source code.

For end users, release builds and project information are published through:

- [www.loftp.space](https://www.loftp.space)

## Current Limitation Notes

- search is local, not remote
- the built-in editor writes local text files
- remote editing is not a direct in-place edit flow
- archive creation currently supports ZIP output only
