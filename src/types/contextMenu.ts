export type ContextMenuPanel = "left" | "right";

export type ContextMenuAction =
  | "copyPath"
  | "copyName"
  | "copyBaseName"
  | "copyFiles"
  | "pasteFiles"
  | "openInFinder"
  | "openInVSCode"
  | "openNatively"
  | "openWith"
  | "openAsArchive"
  | "openArchive"
  | "createArchive"
  | "extractHere"
  | "extractTo"
  | "copyTo"
  | "moveTo"
  | "chmod"
  | "changeDate"
  | "calculateChecksum"
  | "batchRename"
  | "newFile"
  | "newFolder"
  | "splitFile"
  | "combineFiles"
  | "selectAll"
  | "deselectAll"
  | "invertSelection"
  | "selectByExtension"
  | "selectByPattern"
  | "compareFolders"
  | "aiExplainFile"
  | "codexExplainFile"
  | "properties"
  | "rename"
  | "delete"
  | "refresh"
  | "search";

export interface ContextMenuActionPayload {
  id: string;
  action: ContextMenuAction;
}

export interface NativeContextMenuItem {
  action: ContextMenuAction;
  label: string;
  shortcut?: string;
}

export interface NativeContextMenuPayload {
  id: string;
  items: NativeContextMenuItem[];
  x: number;
  y: number;
}

export interface ContextMenuSettings {
  showShortcuts: boolean;
  actions: Record<ContextMenuAction, boolean>;
}
