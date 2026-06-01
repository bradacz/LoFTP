# AI, Codex, and VS Code

## AI Inside LoFTP

LoFTP includes practical AI-oriented workflows for development and server work.

Current focus:

- explaining files
- reviewing compare results
- helping with search and file understanding

The goal is not generic chat. The goal is faster decisions over files, configs, logs, and transfers.

## Codex-Oriented Workflow

LoFTP already includes Codex-oriented usage patterns inside the application, especially around:

- explain file
- compare review
- sync review
- transfer review

These workflows are intended to help with:

- understanding files
- spotting risky changes
- reviewing transfer intent before action

## Bundled Codex Connector

LoFTP includes a bundled Codex Connector that can be installed from `Settings -> Codex`.

The connector lets Codex work with saved LoFTP hostings without exposing credentials in chat.

Design:

- LoFTP stores credentials and connection state
- Codex works through safe local tools
- secrets do not need to be pasted into conversations
- write actions require confirmation in the LoFTP UI

## VS Code Integration

LoFTP can open selected local files and folders directly in VS Code.

This is useful for:

- jumping from file browsing to editing
- opening project folders quickly
- moving between remote transfer work and local development work
