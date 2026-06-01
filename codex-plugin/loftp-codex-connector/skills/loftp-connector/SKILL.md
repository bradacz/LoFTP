---
name: loftp-connector
description: Use when the user wants Codex to inspect or operate LoFTP through its local bridge, including saved FTP/SFTP/Bunny profiles, file listings, sync plans, transfer status, or confirmed build commands.
---

# LoFTP Connector

Use the LoFTP MCP tools for LoFTP work instead of asking the user for FTP, SFTP, Bunny Storage, SSH, or API credentials.

Rules:
- Treat LoFTP as the source of truth for saved profiles and credentials.
- Use read-only tools first: status, active context, hostings, and file listings.
- For uploads, downloads, deletes, or syncs, create a plan and ask LoFTP to confirm it in the app UI.
- Do not try direct mutation endpoints.
- Do not ask the user to paste server passwords into the conversation.
- Build commands must go through LoFTP confirmation and the bridge allowlist.
