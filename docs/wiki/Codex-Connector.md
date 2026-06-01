# Codex Connector

LoFTP includes a bundled Codex Connector. It is installed from `Settings -> Codex` and does not require a separate download.

## Setup

1. Install and open LoFTP.
2. Save the FTP, FTPS, SFTP, or Bunny Storage profiles you want to use.
3. Open `Settings -> Codex`.
4. Enable the local Codex bridge.
5. Click `Install / repair connector`.
6. Click `Test connector`.
7. Restart Codex if it was already open before installation.

The connector is copied into the user's local Codex plugin area and registered in the personal Codex marketplace. LoFTP also writes a local connector config with the bridge URL and session token.

## For Other Users

Each user installs the connector from their own LoFTP settings. They need LoFTP, Codex, Node.js, and their own saved profiles. They do not need your token, activation, or server credentials.

## Bunny.net

Bunny.net is configured as a LoFTP saved hosting profile:

1. Open the connection dialog.
2. Choose `Bunny Storage`.
3. Enter the storage zone name.
4. Enter the Bunny Storage access key.
5. Optionally enter the pull zone URL.
6. Save and test the profile.

Codex can list and plan work against Bunny Storage through LoFTP, but the Bunny access key remains inside LoFTP.

## What Codex Can Do

The connector exposes tools for status checks, saved hosting metadata, active context, local and remote listings, text previews, local secret scanning, project analysis, build-output detection, path comparison, upload plans, sync plans, LoFTP confirmation handoff, allowlisted build requests, masked build-error summaries, change reports, transfer status, and transfer cancellation.

Direct mutation endpoints are blocked. Codex creates a plan first, then LoFTP asks for confirmation in the app UI before anything is changed.

## Status Checks

`Settings -> Codex` checks the plugin manifest, MCP config, MCP server script, personal marketplace entry, connector config, Node.js runtime, and local bridge reachability.

If the status is not ready, use `Install / repair connector`. If the personal marketplace file is invalid JSON, LoFTP creates a timestamped backup and leaves the original file unchanged instead of overwriting it.

## Security

- The bridge binds to `127.0.0.1`.
- A local session token is required.
- FTP, SFTP, Bunny Storage, SSH, and AI credentials stay in LoFTP.
- Codex receives metadata, listings, plans, and transfer status only.
- Mutating operations require confirmation in LoFTP.
