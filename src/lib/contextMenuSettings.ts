import type { ContextMenuAction, ContextMenuSettings } from "@/types/contextMenu";

const STORAGE_KEY = "loftp.contextMenuSettings.v1";

export const ALL_CONTEXT_MENU_ACTIONS: ContextMenuAction[] = [
  "copyPath",
  "copyName",
  "copyBaseName",
  "copyFiles",
  "pasteFiles",
  "openInFinder",
  "openInVSCode",
  "openNatively",
  "openWith",
  "openAsArchive",
  "openArchive",
  "createArchive",
  "extractHere",
  "extractTo",
  "copyTo",
  "moveTo",
  "chmod",
  "changeDate",
  "calculateChecksum",
  "batchRename",
  "newFile",
  "newFolder",
  "splitFile",
  "combineFiles",
  "selectAll",
  "deselectAll",
  "invertSelection",
  "selectByExtension",
  "selectByPattern",
  "compareFolders",
  "aiExplainFile",
  "codexExplainFile",
  "properties",
  "rename",
  "delete",
  "refresh",
  "search",
];

export const ACTIVE_CONTEXT_MENU_ACTIONS: ContextMenuAction[] = [
  ...ALL_CONTEXT_MENU_ACTIONS,
];

const DEFAULT_ACTIONS = ALL_CONTEXT_MENU_ACTIONS.reduce(
  (acc, action) => {
    acc[action] = ACTIVE_CONTEXT_MENU_ACTIONS.includes(action);
    return acc;
  },
  {} as Record<ContextMenuAction, boolean>
);

export const DEFAULT_CONTEXT_MENU_SETTINGS: ContextMenuSettings = {
  showShortcuts: true,
  actions: DEFAULT_ACTIONS,
};

export function getContextMenuSettings(): ContextMenuSettings {
  if (typeof window === "undefined") return DEFAULT_CONTEXT_MENU_SETTINGS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONTEXT_MENU_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ContextMenuSettings> & Record<string, boolean>;
    const migratedActions = { ...DEFAULT_ACTIONS, ...(parsed.actions ?? {}) };

    // Migration from the first detailed settings version.
    if ("showCopyPath" in parsed) migratedActions.copyPath = Boolean(parsed.showCopyPath);
    if ("showCopyName" in parsed) migratedActions.copyName = Boolean(parsed.showCopyName);
    if ("showOpenInFinder" in parsed) migratedActions.openInFinder = Boolean(parsed.showOpenInFinder);
    if ("showOpenInVSCode" in parsed) migratedActions.openInVSCode = Boolean(parsed.showOpenInVSCode);
    if ("showAiExplain" in parsed) migratedActions.aiExplainFile = Boolean(parsed.showAiExplain);
    if ("showCodexExplain" in parsed) migratedActions.codexExplainFile = Boolean(parsed.showCodexExplain);
    if ("showArchives" in parsed) {
      migratedActions.openArchive = Boolean(parsed.showArchives);
      migratedActions.createArchive = Boolean(parsed.showArchives);
    }
    if ("showProperties" in parsed) migratedActions.properties = Boolean(parsed.showProperties);
    if ("showRename" in parsed) migratedActions.rename = Boolean(parsed.showRename);
    if ("showDelete" in parsed) migratedActions.delete = Boolean(parsed.showDelete);

    return {
      showShortcuts: parsed.showShortcuts ?? DEFAULT_CONTEXT_MENU_SETTINGS.showShortcuts,
      actions: migratedActions,
    };
  } catch {
    return DEFAULT_CONTEXT_MENU_SETTINGS;
  }
}

export function saveContextMenuSettings(settings: ContextMenuSettings) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function resetContextMenuSettings(): ContextMenuSettings {
  saveContextMenuSettings(DEFAULT_CONTEXT_MENU_SETTINGS);
  return DEFAULT_CONTEXT_MENU_SETTINGS;
}
