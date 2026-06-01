# LoFTP Codex Connector

This connector is bundled with LoFTP and installed from `Settings -> Codex`.

It exposes safe LoFTP bridge tools to Codex. Saved FTP, SFTP, Bunny Storage, SSH, and AI credentials stay inside LoFTP. Mutating operations are planned first and require confirmation in the LoFTP UI before execution.

The LoFTP installer copies this plugin into the local Codex plugin area, writes `.mcp.json` with the detected Node.js runtime, and registers the plugin in the personal Codex marketplace. The connector reads its local bridge configuration from the LoFTP application support directory.

Tools include status checks, saved hosting metadata, local and remote listings, text previews, project analysis, build-output detection, path comparison, upload and sync plan creation, plan execution handoff, allowlisted build requests, masked build-error summaries, change reports, transfer status, and transfer cancellation.
