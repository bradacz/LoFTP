#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

const TOOL_DEFINITIONS = [
  tool("loftp_get_status", "Check whether the local LoFTP bridge is reachable.", {}),
  tool("loftp_list_hostings", "List saved LoFTP hostings without credentials.", {}),
  tool("loftp_get_active_context", "Get active LoFTP panel context and allowed local roots.", {}),
  tool("loftp_list_local", "List allowed local files from LoFTP.", {
    path: stringSchema("Allowed local path from the active LoFTP context.")
  }, ["path"]),
  tool("loftp_list_remote", "List remote files through a saved LoFTP hosting.", {
    hostingId: stringSchema("Saved LoFTP hosting id."),
    path: stringSchema("Remote path to list.")
  }, ["hostingId", "path"]),
  tool("loftp_read_text_file_preview", "Read a bounded local text preview from an allowed LoFTP path.", {
    path: stringSchema("Allowed local file path."),
    maxBytes: { type: "number", description: "Maximum preview bytes." }
  }, ["path"]),
  tool("loftp_scan_for_secrets", "Scan allowed local files for likely secrets before transfer.", {
    path: stringSchema("Allowed local file or directory path.")
  }, ["path"]),
  tool("loftp_analyze_project", "Analyze a local project folder from the active LoFTP context.", {
    path: stringSchema("Allowed local project path.")
  }, ["path"]),
  tool("loftp_detect_build_output", "Detect likely build output directories for a local project.", {
    path: stringSchema("Allowed local project path.")
  }, ["path"]),
  tool("loftp_compare_paths", "Compare local and remote file metadata.", {
    localPath: stringSchema("Allowed local base path."),
    remotePath: stringSchema("Remote base path."),
    hostingId: stringSchema("Saved LoFTP hosting id.")
  }, ["localPath", "remotePath", "hostingId"]),
  tool("loftp_create_upload_plan", "Create a LoFTP upload plan. The plan still requires confirmation in LoFTP.", {
    localPath: stringSchema("Allowed local file or directory path."),
    remotePath: stringSchema("Remote destination path."),
    hostingId: stringSchema("Optional saved LoFTP hosting id. Omit to use the active context when available.")
  }, ["localPath", "remotePath"]),
  tool("loftp_create_sync_plan", "Create a LoFTP sync plan. The plan still requires confirmation in LoFTP.", {
    localPath: stringSchema("Allowed local base path."),
    remotePath: stringSchema("Remote base path."),
    hostingId: stringSchema("Saved LoFTP hosting id."),
    direction: {
      type: "string",
      enum: ["localToRemote", "remoteToLocal"],
      description: "Sync direction."
    },
    includeDeletes: {
      type: "boolean",
      description: "Whether missing files should become delete actions."
    }
  }, ["localPath", "remotePath", "hostingId"]),
  tool("loftp_execute_plan", "Send a prepared plan to LoFTP for UI confirmation.", {
    planId: stringSchema("Pending LoFTP plan id.")
  }, ["planId"]),
  tool("loftp_run_build_command", "Request an allowlisted build command through LoFTP UI confirmation.", {
    workingDir: stringSchema("Allowed local working directory."),
    command: stringSchema("Allowlisted build command.")
  }, ["workingDir", "command"]),
  tool("loftp_explain_build_error", "Return a masked build-log summary for Codex review.", {
    log: stringSchema("Build log or error text to mask and summarize.")
  }, ["log"]),
  tool("loftp_get_change_report", "Create a readable change report from a pending plan or transfer id.", {
    plan: { type: "object", description: "LoFTP plan object returned by a create_*_plan tool." },
    transferId: stringSchema("LoFTP transfer id.")
  }),
  tool("loftp_get_transfer_status", "Read LoFTP transfer status.", {
    transferId: stringSchema("Optional transfer id.")
  }),
  tool("loftp_cancel_transfer", "Cancel a LoFTP transfer by id.", {
    transferId: stringSchema("Transfer id.")
  }, ["transferId"])
];

function stringSchema(description) {
  return { type: "string", description };
}

function tool(name, description, properties, required = []) {
  return {
    name,
    description,
    inputSchema: {
      type: "object",
      properties,
      required,
      additionalProperties: false
    }
  };
}

function configPath() {
  if (process.env.LOFTP_CODEX_CONFIG) return process.env.LOFTP_CODEX_CONFIG;
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "com.loftp.desktop", "codex_connector.json");
  }
  if (process.platform === "win32") {
    const base = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    return path.join(base, "com.loftp.desktop", "codex_connector.json");
  }
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(base, "com.loftp.desktop", "codex_connector.json");
}

function readConfig() {
  const file = configPath();
  const raw = fs.readFileSync(file, "utf8");
  const config = JSON.parse(raw);
  if (!config.bridgeUrl || !config.token) {
    throw new Error(`LoFTP connector config is incomplete: ${file}`);
  }
  return config;
}

async function callLoftp(toolName, args) {
  const config = readConfig();
  const response = await fetch(`${config.bridgeUrl.replace(/\/$/, "")}/${toolName}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-loftp-token": config.token
    },
    body: JSON.stringify(args || {})
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }
  if (!response.ok) {
    throw new Error(payload?.error || `LoFTP bridge returned HTTP ${response.status}`);
  }
  return payload;
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function result(id, value) {
  send({ jsonrpc: "2.0", id, result: value });
}

function error(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

async function handle(message) {
  const { id, method, params } = message;
  try {
    if (method === "initialize") {
      result(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "loftp-codex-connector", version: "0.1.1" }
      });
      return;
    }
    if (method === "notifications/initialized") return;
    if (method === "ping") {
      result(id, {});
      return;
    }
    if (method === "tools/list") {
      result(id, { tools: TOOL_DEFINITIONS });
      return;
    }
    if (method === "tools/call") {
      const name = params?.name;
      const args = params?.arguments || {};
      if (!TOOL_DEFINITIONS.some((entry) => entry.name === name)) {
        throw new Error(`Unknown LoFTP tool: ${name}`);
      }
      const payload = await callLoftp(name, args);
      result(id, {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        structuredContent: payload
      });
      return;
    }
    if (id !== undefined) error(id, -32601, `Method not found: ${method}`);
  } catch (err) {
    if (id !== undefined) error(id, -32000, err instanceof Error ? err.message : String(err));
  }
}

readline.createInterface({ input: process.stdin }).on("line", (line) => {
  if (!line.trim()) return;
  try {
    void handle(JSON.parse(line));
  } catch (err) {
    error(null, -32700, err instanceof Error ? err.message : String(err));
  }
});
