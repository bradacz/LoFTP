import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { open as openExternal } from "@tauri-apps/plugin-shell";
import { HostingConfig, FileItem } from "@/types/ftp";
import { HostingTabs } from "@/components/ftp/HostingTabs";
import { HostingDialog } from "@/components/ftp/HostingDialog";
import { TransferDialog, TransferOptions } from "@/components/ftp/TransferDialog";
import { SettingsDialog } from "@/components/ftp/SettingsDialog";
import { AboutDialog } from "@/components/ftp/AboutDialog";
import { SharewareDialog } from "@/components/ftp/SharewareDialog";
import { AppTitleBar } from "@/components/ftp/AppTitleBar";
import { PanelHeaderRow } from "@/components/ftp/PanelHeaderRow";
import { Toolbar, type ToolbarMenuGroup } from "@/components/ftp/Toolbar";
import { FilePanel } from "@/components/ftp/FilePanel";
import { useLocalFiles } from "@/hooks/useLocalFiles";
import { useHostings } from "@/hooks/useHostings";
import { useHostingWorkspace } from "@/hooks/useHostingWorkspace";
import { useConnection } from "@/hooks/useConnection";
import { useFileActions } from "@/hooks/useFileActions";
import { useFileSelection } from "@/hooks/useFileSelection";
import { useRemoteFiles } from "@/hooks/useRemoteFiles";
import { useTransferOrchestration } from "@/hooks/useTransferOrchestration";
import { useTransfers } from "@/hooks/useTransfers";
import { useDeleteProgress } from "@/hooks/useDeleteProgress";
import { useLicense } from "@/hooks/useLicense";
import { useTheme } from "@/hooks/useTheme";
import { useShowHiddenFiles } from "@/hooks/useShowHiddenFiles";
import { filterVisibleFiles } from "@/lib/fileVisibility";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { FunctionKeyBar } from "@/components/ftp/FunctionKeyBar";
import { CompareBar } from "@/components/ftp/CompareBar";
import { SearchDialog } from "@/components/ftp/SearchDialog";
import { QuickViewPanel } from "@/components/ftp/QuickViewPanel";
import { EditorPanel } from "@/components/ftp/EditorPanel";
import { PropertiesDialog } from "@/components/ftp/PropertiesDialog";
import { InputDialog } from "@/components/ftp/InputDialog";
import { ConfirmDialog } from "@/components/ftp/ConfirmDialog";
import { AssistantResultDialog } from "@/components/ftp/AssistantResultDialog";
import { useDirectoryCompare } from "@/hooks/useDirectoryCompare";
import {
  aiRunPrompt,
  archiveCreate,
  archiveExtract,
  archiveReadText,
  codexExecutePendingBuild,
  codexExecutePendingPlan,
  codexListHostings,
  codexUpdateActiveContext,
  fsChecksum,
  fsChmod,
  fsCombineFiles,
  fsCopy,
  fsCopyDir,
  fsDeleteMany,
  DEFAULT_TRANSFER_OPTIONS,
  fsIsDir,
  fsMkdir,
  fsReadText,
  fsRename,
  fsRemove,
  fsSetModified,
  fsSplitFile,
  fsWriteText,
  uiShowContextMenu,
} from "@/lib/tauri";
import { toast } from "@/components/ui/sonner";
import { useI18n } from "@/i18n";
import type { ContextMenuAction, ContextMenuActionPayload, ContextMenuPanel, NativeContextMenuItem } from "@/types/contextMenu";
import { getContextMenuSettings } from "@/lib/contextMenuSettings";
import { joinPath, validateEntryName } from "@/lib/utils";

interface CodexPendingPlanPayload {
  planId: string;
  kind: string;
  hostingId?: string;
  localBasePath?: string;
  remoteBasePath?: string;
  report?: {
    totalActions?: number;
    destructiveActions?: number;
    totalBytes?: number;
    risks?: string[];
    actionCounts?: Record<string, number>;
    rollbackRecommendation?: string;
  };
}

type FileClipboardEntry =
  | string
  | {
      path?: string;
      isDirectory?: boolean;
      archivePath?: string;
      entryPath?: string;
      name?: string;
      stripPrefix?: string;
    };

interface CodexPendingBuildPayload {
  requestId: string;
  command: string;
  workingDir: string;
}

const Index = () => {
  const { t } = useI18n();
  // Hooks
  const { hostings, save: saveHosting, remove: removeHosting } = useHostings();
  const leftLocal = useLocalFiles();
  const rightLocal = useLocalFiles();
  const connection = useConnection();
  const { transfers, startUpload, startDownload, resetForTransfer } = useTransfers();
  const deleteProgress = useDeleteProgress();
  const license = useLicense();
  const themeCtx = useTheme();
  const { showHiddenFiles, setShowHiddenFiles } = useShowHiddenFiles();
  const dirCompare = useDirectoryCompare();
  const [sharewareDismissed, setSharewareDismissed] = useState(false);

  // Panel modes
  const [leftMode, setLeftMode] = useState<"local" | "remote">("local");
  const [rightMode, setRightMode] = useState<"local" | "remote">("local");

  // UI state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"left" | "right">("left");
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const contextMenuPayloadRef = useRef<{ id: string; file: FileItem; panel: ContextMenuPanel } | null>(null);
  const contextActionHandlerRef = useRef<(payload: ContextMenuActionPayload) => void>(() => {});
  const [archiveCreateRequest, setArchiveCreateRequest] = useState<{ baseDir: string; sourcePaths: string[] } | null>(null);
  const [propsFile, setPropsFile] = useState<{ file: FileItem; path: string } | null>(null);
  const [contextInput, setContextInput] = useState<{
    action: ContextMenuAction;
    panel: ContextMenuPanel;
    file: FileItem;
    title: string;
    label: string;
    defaultValue?: string;
  } | null>(null);
  const [contextConfirm, setContextConfirm] = useState<{
    action: ContextMenuAction;
    panel: ContextMenuPanel;
    file: FileItem;
    selectedNames: string[];
    title: string;
    message: string;
    danger?: boolean;
  } | null>(null);
  const [assistantResult, setAssistantResult] = useState<{
    type: "ai" | "codex";
    title: string;
    body: string;
    loading: boolean;
  } | null>(null);
  const [pendingCodexPlanId, setPendingCodexPlanId] = useState<string | null>(null);
  const [pendingCodexBuildId, setPendingCodexBuildId] = useState<string | null>(null);
  const [codexPlanApproving, setCodexPlanApproving] = useState(false);

  const leftSelection = useFileSelection();
  const rightSelection = useFileSelection();
  const remoteSelectionForHook = useFileSelection();
  const clearLeftSelection = leftSelection.clear;
  const clearRightSelection = rightSelection.clear;
  const clearRemoteSelection = remoteSelectionForHook.clear;
  const activatePanel = (panel: "left" | "right") => {
    if (panel === activePanel) return;
    if (panel === "left") rightSelection.clear();
    else leftSelection.clear();
    if ((panel === "left" ? rightMode : leftMode) === "remote") {
      remoteSelectionForHook.clear();
    }
    setActivePanel(panel);
  };
  const remote = useRemoteFiles(connection, remoteSelectionForHook.clear);
  useEffect(() => {
    clearLeftSelection();
    clearRightSelection();
    clearRemoteSelection();
  }, [showHiddenFiles, clearLeftSelection, clearRightSelection, clearRemoteSelection]);

  const hostingWorkspace = useHostingWorkspace({
    hostings,
    saveHosting,
    removeHosting,
    connection,
    remote,
  });
  const activeHost = hostingWorkspace.activeHost;
  const isConnected = !!activeHost && connection.getStatus(activeHost.id) === "connected";

  // Determine files/path/selection for each panel based on mode
  const getVisibleFiles = (files: FileItem[]) => filterVisibleFiles(files, showHiddenFiles);
  const getLeftFiles = () => getVisibleFiles(leftMode === "local" ? leftLocal.files : remote.files);
  const getLeftPath = () => leftMode === "local" ? leftLocal.path : remote.path;
  const getLeftSelection = () => leftMode === "local" ? leftSelection : remoteSelectionForHook;

  const getRightFiles = () => getVisibleFiles(rightMode === "local" ? rightLocal.files : remote.files);
  const getRightPath = () => rightMode === "local" ? rightLocal.path : remote.path;
  const getRightSelection = () => rightMode === "local" ? rightSelection : remoteSelectionForHook;
  const getLocalPanelHook = (panel: "left" | "right") => panel === "left" ? leftLocal : rightLocal;

  const leftPanelData = {
    mode: leftMode,
    path: getLeftPath(),
    isArchiveView: leftMode === "local" ? leftLocal.isArchiveView : false,
    archivePath: leftMode === "local" ? leftLocal.archivePath : null,
    archiveInnerPath: leftMode === "local" ? leftLocal.archiveInnerPath : null,
    files: getLeftFiles(),
    selection: getLeftSelection(),
    navigate: (path: string) => {
      if (leftMode === "local") {
        leftLocal.navigate(path);
        leftSelection.clear();
      } else {
        remote.navigate(activeHost, path);
      }
    },
    refresh: () => {
      if (leftMode === "local") {
        leftLocal.refresh();
      } else if (activeHost) {
        remote.refresh(activeHost);
      }
    },
  };

  const rightPanelData = {
    mode: rightMode,
    path: getRightPath(),
    isArchiveView: rightMode === "local" ? rightLocal.isArchiveView : false,
    archivePath: rightMode === "local" ? rightLocal.archivePath : null,
    archiveInnerPath: rightMode === "local" ? rightLocal.archiveInnerPath : null,
    files: getRightFiles(),
    selection: getRightSelection(),
    navigate: (path: string) => {
      if (rightMode === "local") {
        rightLocal.navigate(path);
        rightSelection.clear();
      } else {
        remote.navigate(activeHost, path);
      }
    },
    refresh: () => {
      if (rightMode === "local") {
        rightLocal.refresh();
      } else if (activeHost) {
        remote.refresh(activeHost);
      }
    },
  };

  const fileActions = useFileActions({
    connection,
    activeHost,
    activePanel,
    leftPanel: leftPanelData,
    rightPanel: rightPanelData,
    deleteProgress,
    remoteNotConnectedMessage: t("dialogs.remoteNotConnected"),
  });

  const transferFlow = useTransferOrchestration({
    connection,
    activeHost,
    activePanel,
    leftPanel: leftPanelData,
    rightPanel: rightPanelData,
    transfers: { startUpload, startDownload, resetForTransfer },
  });

  // --- Navigation ---

  const activePanelData = activePanel === "left" ? leftPanelData : rightPanelData;
  const activeFiles = activePanelData.files;
  const activeSel = activePanelData.selection;

  const isArchive = (name: string) => /\.(zip|tar|tar\.gz|tgz)$/i.test(name);
  const deleteDialogBusy = deleteProgress.status?.status === "pending" || deleteProgress.status?.status === "deleting";
  const deleteDialogFailed = deleteProgress.status?.status === "error";

  const handleDoubleClick = (panel: "left" | "right", file: FileItem) => {
    const pd = panel === "left" ? leftPanelData : rightPanelData;
    const localPanel = getLocalPanelHook(panel);
    if (file.isDirectory) {
      if (file.name === "..") {
        if (pd.mode === "local") {
          localPanel.navigateUp();
        } else {
          pd.navigate(pd.path.split("/").slice(0, -1).join("/") || "/");
        }
      } else if (pd.mode === "local" && localPanel.isArchiveView && file.entryPath) {
        localPanel.openArchive(localPanel.archivePath!, file.entryPath, localPanel.archivePath!.split("/").slice(0, -1).join("/") || "/");
      } else {
        pd.navigate(file.resolvedPath || joinPath(pd.path, file.name));
      }
    } else if (pd.mode === "local" && isArchive(file.name)) {
      localPanel.openArchive(joinPath(pd.path, file.name));
    }
  };

  const handleNavigateUp = () => {
    if (activePanelData.mode === "local") {
      getLocalPanelHook(activePanel).navigateUp();
      return;
    }
    activePanelData.navigate(activePanelData.path.split("/").slice(0, -1).join("/") || "/");
  };

  const getPanelData = (panel: "left" | "right") => panel === "left" ? leftPanelData : rightPanelData;

  const getArchiveSelection = (panel: "left" | "right", preferredNames?: string[]) => {
    const pd = getPanelData(panel);
    const localPanel = getLocalPanelHook(panel);
    if (pd.mode !== "local" || localPanel.isArchiveView) return null;

    const selected = Array.from(pd.selection.selected).filter((name) => name !== "..");
    if (selected.length > 0) {
      if (!preferredNames || preferredNames.every((name) => selected.includes(name))) {
        return { baseDir: pd.path, sourcePaths: selected };
      }
    }

    const fallback = (preferredNames ?? []).filter((name) => name !== "..");
    if (fallback.length > 0) {
      return { baseDir: pd.path, sourcePaths: fallback };
    }

    return null;
  };

  const resolveArchivePath = (panel: "left" | "right", preferredName?: string) => {
    const pd = getPanelData(panel);
    const localPanel = getLocalPanelHook(panel);
    if (pd.mode !== "local" || localPanel.isArchiveView) return null;

    const candidateNames = preferredName
      ? [preferredName]
      : Array.from(pd.selection.selected).filter((name) => name !== "..");

    if (candidateNames.length !== 1) return null;
    const name = candidateNames[0];
    const file = pd.files.find((item) => item.name === name);
    if (!file || file.isDirectory || !isArchive(name)) return null;
    return joinPath(pd.path, name);
  };

  const handleOpenArchive = (panel: "left" | "right" = activePanel, preferredName?: string) => {
    const nextPath = resolveArchivePath(panel, preferredName);
    if (!nextPath) return;
    getLocalPanelHook(panel).openArchive(nextPath);
  };

  const handleCreateArchiveRequest = (panel: "left" | "right" = activePanel, preferredNames?: string[]) => {
    const nextRequest = getArchiveSelection(panel, preferredNames);
    if (!nextRequest) return;
    setArchiveCreateRequest(nextRequest);
  };

  const handleCreateArchiveConfirm = async (archiveName: string) => {
    if (!archiveCreateRequest) return;

    try {
      const safeArchiveName = validateEntryName(archiveName);
      const outputName = /\.zip$/i.test(safeArchiveName) ? safeArchiveName : `${safeArchiveName}.zip`;
      await archiveCreate(
        joinPath(archiveCreateRequest.baseDir, outputName),
        archiveCreateRequest.sourcePaths,
        archiveCreateRequest.baseDir
      );
      setArchiveCreateRequest(null);
      leftPanelData.refresh();
      rightPanelData.refresh();
      toast.success(t("toasts.archiveCreated"), {
        description: outputName,
      });
    } catch (error) {
      toast.error(t("toasts.archiveCreateFailed"), {
        description: String(error),
      });
    }
  };

  const getArchiveContext = (panel: ContextMenuPanel) => {
    const pd = panel === "left" ? leftPanelData : rightPanelData;
    const localPanel = getLocalPanelHook(panel);
    if (pd.mode !== "local" || !localPanel.isArchiveView || !localPanel.archivePath) return null;
    return {
      archivePath: localPanel.archivePath,
      innerPath: localPanel.archiveInnerPath ?? "",
    };
  };

  const getArchiveEntryPaths = (panel: ContextMenuPanel, file: FileItem) => {
    const pd = getPanelData(panel);
    return getContextSelection(panel, file)
      .map((name) => pd.files.find((item) => item.name === name)?.entryPath)
      .filter((entryPath): entryPath is string => !!entryPath);
  };

  const getFullPath = (panel: ContextMenuPanel, file: FileItem) => {
    const pd = panel === "left" ? leftPanelData : rightPanelData;
    const archiveContext = getArchiveContext(panel);
    if (archiveContext && file.entryPath) {
      return `${archiveContext.archivePath}!/${file.entryPath}`;
    }
    return joinPath(pd.path, file.name);
  };

  const getRealLocalPanelPath = (panel: ContextMenuPanel) => {
    const pd = getPanelData(panel);
    const archiveContext = getArchiveContext(panel);
    if (archiveContext) {
      return archiveContext.archivePath.split("/").slice(0, -1).join("/") || "/";
    }
    return pd.path;
  };

  const runAiExplainFile = async (panel: ContextMenuPanel, file: FileItem) => {
    const fullPath = getFullPath(panel, file);
    const title = `${t("contextMenu.aiExplainFile")}: ${file.name}`;
    setAssistantResult({ type: "ai", title, body: "", loading: true });
    try {
      const pd = getPanelData(panel);
      if (pd.mode !== "local" || file.isDirectory) {
        throw new Error(t("toasts.aiLocalTextOnly"));
      }
      const archiveContext = getArchiveContext(panel);
      const content = archiveContext && file.entryPath
        ? await archiveReadText(archiveContext.archivePath, file.entryPath, 80_000)
        : await fsReadText(fullPath, 80_000);
      const result = await aiRunPrompt("Explain this file for a LoFTP user.", content.content);
      setAssistantResult({ type: "ai", title, body: result.output, loading: false });
    } catch (error) {
      setAssistantResult({ type: "ai", title, body: String(error), loading: false });
    }
  };

  const runCodexExplainFile = async (panel: ContextMenuPanel, file: FileItem) => {
    const title = `${t("contextMenu.codexExplainFile")}: ${file.name}`;
    setAssistantResult({ type: "codex", title, body: "", loading: true });
    try {
      const pd = getPanelData(panel);
      const hostings = await codexListHostings();
      const body = [
        "Codex bridge context prepared.",
        "",
        `Panel: ${panel}`,
        `Mode: ${pd.mode}`,
        `Path: ${pd.path}`,
        `Item: ${file.name}`,
        `Saved hostings available to LoFTP: ${hostings.length}`,
        "",
        "Secrets are not exposed. FTP/SFTP credentials stay in LoFTP credential storage.",
      ].join("\n");
      setAssistantResult({ type: "codex", title, body, loading: false });
    } catch (error) {
      setAssistantResult({ type: "codex", title, body: String(error), loading: false });
    }
  };

  const approvePendingCodexPlan = async () => {
    if (!pendingCodexPlanId) return;
    setCodexPlanApproving(true);
    try {
      const result = await codexExecutePendingPlan(pendingCodexPlanId);
      setPendingCodexPlanId(null);
      setAssistantResult({
        type: "codex",
        title: "Codex plan executed",
        body: JSON.stringify(result, null, 2),
        loading: false,
      });
    } catch (error) {
      setAssistantResult({
        type: "codex",
        title: "Codex plan failed",
        body: String(error),
        loading: false,
      });
    } finally {
      setCodexPlanApproving(false);
    }
  };

  const approvePendingCodexBuild = async () => {
    if (!pendingCodexBuildId) return;
    setCodexPlanApproving(true);
    try {
      const result = await codexExecutePendingBuild(pendingCodexBuildId);
      setPendingCodexBuildId(null);
      setAssistantResult({
        type: "codex",
        title: "Codex build executed",
        body: JSON.stringify(result, null, 2),
        loading: false,
      });
    } catch (error) {
      setAssistantResult({
        type: "codex",
        title: "Codex build failed",
        body: String(error),
        loading: false,
      });
    } finally {
      setCodexPlanApproving(false);
    }
  };

  const selectContextFile = (panel: ContextMenuPanel, file: FileItem) => {
    activatePanel(panel);
    if (file.name === "..") return;
    const pd = getPanelData(panel);
    if (!pd.selection.selected.has(file.name)) {
      pd.selection.setSelected(new Set([file.name]));
    }
  };

  const getContextSelection = (panel: ContextMenuPanel, file: FileItem) => {
    const pd = getPanelData(panel);
    const validNames = new Set(pd.files.filter((item) => item.name !== "..").map((item) => item.name));
    const selected = pd.selection.selected.has(file.name)
      ? Array.from(pd.selection.selected)
      : file.name === ".."
        ? []
        : [file.name];
    return selected.filter((name) => validNames.has(name));
  };

  const copyLocalEntry = async (
    from: string,
    to: string,
    isDirectory: boolean,
    options = DEFAULT_TRANSFER_OPTIONS,
  ) => {
    const normalize = (path: string) => path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "") || "/";
    if (normalize(from) === normalize(to)) {
      throw new Error("Source and target are the same file.");
    }
    if (isDirectory) await fsCopyDir(from, to, options);
    else await fsCopy(from, to, options);
  };

  const copyLocalSelection = async (panel: ContextMenuPanel, file: FileItem, targetDir: string, move = false) => {
    const pd = getPanelData(panel);
    if (pd.mode !== "local") throw new Error(t("dialogs.localFilesOnly"));
    const archiveContext = getArchiveContext(panel);
    if (archiveContext) {
      if (move) throw new Error(t("dialogs.archiveReadOnly"));
      const entryPaths = getArchiveEntryPaths(panel, file);
      if (entryPaths.length === 0) return;
      await archiveExtract(archiveContext.archivePath, targetDir, entryPaths, archiveContext.innerPath);
      return;
    }
    const names = getContextSelection(panel, file);
    const normalizedTargetDir = targetDir.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "") || "/";
    for (const name of names) {
      const sourceItem = pd.files.find((item) => item.name === name);
      if (!sourceItem) continue;
      const source = joinPath(pd.path, name);
      const normalizedSource = source.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "") || "/";
      if (sourceItem.isDirectory && (normalizedTargetDir === normalizedSource || normalizedTargetDir.startsWith(`${normalizedSource}/`))) {
        throw new Error("A folder cannot be copied into itself.");
      }
    }
    const transferOptions = move
      ? { ...DEFAULT_TRANSFER_OPTIONS, overwrite: "rename" }
      : DEFAULT_TRANSFER_OPTIONS;
    for (const name of names) {
      const source = joinPath(pd.path, name);
      const sourceItem = pd.files.find((item) => item.name === name);
      await copyLocalEntry(source, joinPath(targetDir, name), sourceItem?.isDirectory ?? false, transferOptions);
    }
    if (move) {
      for (const name of names) {
        await fsRemove(joinPath(pd.path, name));
      }
    }
    pd.refresh();
  };

  const saveContextClipboard = (panel: ContextMenuPanel, file: FileItem) => {
    const pd = getPanelData(panel);
    if (pd.mode !== "local") throw new Error(t("dialogs.localFilesOnly"));
    const archiveContext = getArchiveContext(panel);
    const entries: FileClipboardEntry[] = getContextSelection(panel, file).map((name) => {
      const sourceFile = pd.files.find((item) => item.name === name);
      if (archiveContext && sourceFile?.entryPath) {
        return {
          archivePath: archiveContext.archivePath,
          entryPath: sourceFile.entryPath,
          name,
          isDirectory: sourceFile.isDirectory,
          stripPrefix: archiveContext.innerPath,
        };
      }
      return {
        path: joinPath(pd.path, name),
        isDirectory: sourceFile?.isDirectory ?? false,
      };
    });
    localStorage.setItem("loftp.fileClipboard.v1", JSON.stringify(entries));
    toast.success(t("contextMenu.copyFiles"), { description: `${entries.length}` });
  };

  const pasteContextClipboard = async (panel: ContextMenuPanel) => {
    const pd = getPanelData(panel);
    if (pd.mode !== "local") throw new Error(t("dialogs.localPanelOnly"));
    if (getArchiveContext(panel)) throw new Error(t("dialogs.archiveReadOnly"));
    const raw = localStorage.getItem("loftp.fileClipboard.v1");
    const parsed = raw ? JSON.parse(raw) as FileClipboardEntry[] : [];
    for (const entry of parsed) {
      if (typeof entry !== "string" && entry.archivePath && entry.entryPath) {
        await archiveExtract(entry.archivePath, pd.path, [entry.entryPath], entry.stripPrefix ?? "");
        continue;
      }
      const source = typeof entry === "string" ? entry : entry.path;
      if (!source) continue;
      const name = source.split("/").filter(Boolean).pop();
      if (!name) continue;
      const isDirectory = typeof entry === "string" ? await fsIsDir(source) : Boolean(entry.isDirectory);
      await copyLocalEntry(source, joinPath(pd.path, name), isDirectory);
    }
    pd.refresh();
  };

  const requestContextInput = (action: ContextMenuAction, panel: ContextMenuPanel, file: FileItem, title: string, label: string, defaultValue = "") => {
    setContextInput({ action, panel, file, title, label, defaultValue });
  };

  const requestContextConfirm = (action: ContextMenuAction, panel: ContextMenuPanel, file: FileItem, title: string, message: string, danger = false, selectedNames = getContextSelection(panel, file)) => {
    if (action === "delete") {
      deleteProgress.clear();
    }
    setContextConfirm({ action, panel, file, selectedNames, title, message, danger });
  };

  const renameInPanel = async (panel: ContextMenuPanel, file: FileItem, newName: string) => {
    const pd = getPanelData(panel);
    if (getArchiveContext(panel)) throw new Error(t("dialogs.archiveReadOnly"));
    const oldName = file.name;
    const safeName = validateEntryName(newName);
    if (safeName === oldName) return;
    if (pd.mode === "remote") {
      if (!activeHost || connection.getStatus(activeHost.id) !== "connected") throw new Error(t("dialogs.remoteNotConnected"));
      if (activeHost.protocol === "bunnyStorage") throw new Error("Bunny Storage does not support atomic rename.");
      await connection.renameRemote(activeHost.id, joinPath(pd.path, oldName), joinPath(pd.path, safeName), activeHost.protocol);
    } else {
      await fsRename(joinPath(pd.path, oldName), joinPath(pd.path, safeName));
    }
    pd.selection.clear();
    pd.refresh();
  };

  const createFolderInPanel = async (panel: ContextMenuPanel, name: string) => {
    const pd = getPanelData(panel);
    if (getArchiveContext(panel)) throw new Error(t("dialogs.archiveReadOnly"));
    const safeName = validateEntryName(name);
    if (pd.mode === "remote") {
      if (!activeHost || connection.getStatus(activeHost.id) !== "connected") throw new Error(t("dialogs.remoteNotConnected"));
      await connection.mkdirRemote(activeHost.id, joinPath(pd.path, safeName), activeHost.protocol);
    } else {
      await fsMkdir(joinPath(pd.path, safeName));
    }
    pd.refresh();
  };

  const deleteSelectionInPanel = async (panel: ContextMenuPanel, selectedNames: string[]) => {
    const pd = getPanelData(panel);
    if (getArchiveContext(panel)) throw new Error(t("dialogs.archiveReadOnly"));
    const targets = selectedNames
      .filter((name) => name !== "..")
      .map((name) => {
        const item = pd.files.find((entry) => entry.name === name);
        return item
          ? { name, path: joinPath(pd.path, name), isDirectory: item.isDirectory }
          : null;
      })
      .filter((target): target is { name: string; path: string; isDirectory: boolean } => target !== null);
    if (targets.length === 0) return;

    const deleteId = crypto.randomUUID();
    deleteProgress.begin({
      id: deleteId,
      mode: pd.mode,
      rootPath: pd.path,
      totalItems: targets.length,
    });

    let completedItems = 0;
    if (pd.mode === "local") {
      deleteProgress.step({
        id: deleteId,
        currentPath: pd.path,
        currentName: pd.path,
        completedItems: 0,
      });

      try {
        await fsDeleteMany(targets.map((target) => target.path), deleteId);
        completedItems = targets.length;
        deleteProgress.finish({ id: deleteId, completedItems });
        pd.selection.clear();
      } catch (error) {
        deleteProgress.fail({ id: deleteId, error: String(error) });
        pd.refresh();
        throw error;
      }
      pd.refresh();
      return;
    }

    if (!activeHost || connection.getStatus(activeHost.id) !== "connected") {
      const error = new Error(t("dialogs.remoteNotConnected"));
      deleteProgress.fail({ id: deleteId, error: String(error) });
      pd.refresh();
      throw error;
    }

    const errors: string[] = [];
    for (const target of targets) {
      deleteProgress.step({
        id: deleteId,
        currentPath: target.path,
        currentName: target.name,
        completedItems,
      });

      try {
        await connection.deleteRemote(activeHost.id, target.path, target.isDirectory, activeHost.protocol, deleteId);
        completedItems += 1;
        deleteProgress.step({
          id: deleteId,
          currentPath: target.path,
          currentName: target.name,
          completedItems,
        });
      } catch (error) {
        errors.push(String(error));
      }
    }

    if (errors.length > 0) {
      const error = new Error(errors[0]);
      deleteProgress.fail({ id: deleteId, error: String(error) });
      pd.refresh();
      throw error;
    }

    deleteProgress.finish({ id: deleteId, completedItems });
    pd.selection.clear();
    pd.refresh();
  };

  const handleContextConfirm = async () => {
    if (!contextConfirm) return;
    const { action, panel, selectedNames } = contextConfirm;
    try {
      if (action === "delete") {
        await deleteSelectionInPanel(panel, selectedNames);
        setContextConfirm(null);
      }
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleContextInputConfirm = async (value: string) => {
    if (!contextInput) return;
    const { action, panel, file } = contextInput;
    const pd = getPanelData(panel);
    const fullPath = getFullPath(panel, file);
    setContextInput(null);

    try {
      if (action === "copyTo") {
        await copyLocalSelection(panel, file, value, false);
        return;
      }
      if (action === "moveTo") {
        await copyLocalSelection(panel, file, value, true);
        return;
      }
      if (action === "extractTo") {
        await archiveExtract(fullPath, value);
        pd.refresh();
        return;
      }
      if (action === "chmod") {
        await fsChmod(fullPath, value);
        pd.refresh();
        return;
      }
      if (action === "changeDate") {
        await fsSetModified(fullPath, value);
        pd.refresh();
        return;
      }
      if (action === "calculateChecksum") {
        const checksum = await fsChecksum(fullPath, value || "sha256");
        setAssistantResult({ type: "ai", title: t("dialogs.checksumTitle"), body: checksum, loading: false });
        return;
      }
      if (action === "batchRename") {
        validateEntryName(value);
        const names = getContextSelection(panel, file).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        const planned = names.map((name, index) => {
          const extension = name.includes(".") ? `.${name.split(".").pop()}` : "";
          return `${value}${index + 1}${extension}`;
        });
        const collisions = planned.filter((name) => pd.files.some((item) => item.name === name) && !names.includes(name));
        if (collisions.length > 0) {
          throw new Error(`Rename target already exists: ${collisions[0]}`);
        }
        for (const [index, name] of names.entries()) {
          const extension = name.includes(".") ? `.${name.split(".").pop()}` : "";
          await fsRename(joinPath(pd.path, name), joinPath(pd.path, `${value}${index + 1}${extension}`));
        }
        pd.refresh();
        return;
      }
      if (action === "newFile") {
        await fsWriteText(joinPath(pd.path, validateEntryName(value)), "");
        pd.refresh();
        return;
      }
      if (action === "splitFile") {
        const megabytes = Number.parseInt(value, 10);
        await fsSplitFile(fullPath, Math.max(1, megabytes || 10) * 1024 * 1024);
        pd.refresh();
        return;
      }
      if (action === "combineFiles") {
        const parts = getContextSelection(panel, file)
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
          .map((name) => joinPath(pd.path, name));
        await fsCombineFiles(parts, joinPath(pd.path, validateEntryName(value)));
        pd.refresh();
        return;
      }
      if (action === "selectByExtension") {
        const normalized = value.startsWith(".") ? value.toLowerCase() : `.${value.toLowerCase()}`;
        pd.selection.setSelected(new Set(pd.files.filter((item) => item.name.toLowerCase().endsWith(normalized)).map((item) => item.name)));
        return;
      }
      if (action === "selectByPattern") {
        pd.selection.selectByPattern(value, pd.files);
      }
      if (action === "rename") {
        await renameInPanel(panel, file, value);
      }
      if (action === "newFolder") {
        await createFolderInPanel(panel, value);
      }
    } catch (error) {
      toast.error(String(error));
    }
  };

  const performContextMenuAction = (action: ContextMenuAction, panel: ContextMenuPanel, file: FileItem) => {
    const pd = panel === "left" ? leftPanelData : rightPanelData;
    const archiveContext = getArchiveContext(panel);

    if (action === "copyPath") {
      navigator.clipboard.writeText(getFullPath(panel, file));
      return;
    }
    if (action === "copyName") {
      navigator.clipboard.writeText(file.name);
      return;
    }
    if (action === "copyBaseName") {
      navigator.clipboard.writeText(file.name.replace(/\.[^/.]+$/, ""));
      return;
    }
    if (action === "copyFiles") {
      saveContextClipboard(panel, file);
      return;
    }
    if (action === "pasteFiles") {
      pasteContextClipboard(panel).catch((error) => toast.error(String(error)));
      return;
    }
    if (action === "openInFinder" && pd.mode === "local" && !archiveContext) {
      openExternal(getFullPath(panel, file)).catch(() => {});
      return;
    }
    if (action === "openInVSCode" && pd.mode === "local" && !archiveContext) {
      const encodedPath = encodeURI(getFullPath(panel, file));
      openExternal(`vscode://file${encodedPath}`).catch(() => {});
      return;
    }
    if ((action === "openNatively" || action === "openWith") && pd.mode === "local" && !archiveContext) {
      const targetPath = getFullPath(panel, file);
      if (action === "openWith") {
        openExternal(`file://${targetPath}`).catch(() => openExternal(targetPath).catch(() => {}));
      } else {
        openExternal(targetPath).catch(() => {});
      }
      return;
    }
    if (action === "openArchive" || action === "openAsArchive") {
      handleOpenArchive(panel, file.name);
      return;
    }
    if (action === "createArchive") {
      handleCreateArchiveRequest(panel, getPanelData(panel).selection.selected.has(file.name) ? undefined : [file.name]);
      return;
    }
    if (action === "extractHere") {
      archiveExtract(getFullPath(panel, file), pd.path).then(pd.refresh).catch((error) => toast.error(String(error)));
      return;
    }
    if (action === "extractTo") {
      requestContextInput(action, panel, file, t("contextMenu.extractTo"), t("dialogs.targetFolder"), getRealLocalPanelPath(panel));
      return;
    }
    if (action === "copyTo") {
      requestContextInput(action, panel, file, t("contextMenu.copyTo"), t("dialogs.targetFolder"), getRealLocalPanelPath(panel));
      return;
    }
    if (action === "moveTo") {
      requestContextInput(action, panel, file, t("contextMenu.moveTo"), t("dialogs.targetFolder"), getRealLocalPanelPath(panel));
      return;
    }
    if (action === "chmod") {
      requestContextInput(action, panel, file, t("contextMenu.chmod"), t("dialogs.chmodOctal"), "755");
      return;
    }
    if (action === "changeDate") {
      requestContextInput(action, panel, file, t("contextMenu.changeDate"), t("dialogs.changeDateLabel"), file.modified || "2026-05-31 12:00");
      return;
    }
    if (action === "calculateChecksum") {
      requestContextInput(action, panel, file, t("contextMenu.calculateChecksum"), t("dialogs.checksumAlgorithm"), "sha256");
      return;
    }
    if (action === "batchRename") {
      requestContextInput(action, panel, file, t("contextMenu.batchRename"), t("dialogs.batchRenamePrefix"), "file-");
      return;
    }
    if (action === "newFile") {
      requestContextInput(action, panel, file, t("contextMenu.newFile"), t("contextMenu.newFile"), "new-file.txt");
      return;
    }
    if (action === "newFolder") {
      requestContextInput(action, panel, file, t("contextMenu.newFolder"), t("dialogs.newFolderLabel"), "New Folder");
      return;
    }
    if (action === "selectAll") {
      pd.selection.setSelected(new Set(pd.files.filter((item) => item.name !== "..").map((item) => item.name)));
      return;
    }
    if (action === "deselectAll") {
      pd.selection.clear();
      return;
    }
    if (action === "invertSelection") {
      const all = pd.files.filter((item) => item.name !== "..").map((item) => item.name);
      pd.selection.setSelected(new Set(all.filter((name) => !pd.selection.selected.has(name))));
      return;
    }
    if (action === "selectByExtension") {
      requestContextInput(action, panel, file, t("contextMenu.selectByExtension"), t("contextMenu.selectByExtension"), ".txt");
      return;
    }
    if (action === "selectByPattern") {
      requestContextInput(action, panel, file, t("contextMenu.selectByPattern"), t("contextMenu.selectByPattern"), "*.txt");
      return;
    }
    if (action === "splitFile") {
      requestContextInput(action, panel, file, t("contextMenu.splitFile"), t("dialogs.splitChunkSizeMb"), "10");
      return;
    }
    if (action === "combineFiles") {
      requestContextInput(action, panel, file, t("contextMenu.combineFiles"), t("dialogs.combineOutputFile"), "combined.bin");
      return;
    }
    if (action === "compareFolders") {
      if (dirCompare.isComparing) dirCompare.stop();
      else dirCompare.compare(leftPanelData.files, rightPanelData.files);
      return;
    }
    if (action === "refresh") {
      fileActions.refresh();
      return;
    }
    if (action === "search") {
      activatePanel(panel);
      setSearchOpen(true);
      return;
    }
    if (action === "aiExplainFile") {
      runAiExplainFile(panel, file);
      return;
    }
    if (action === "codexExplainFile") {
      runCodexExplainFile(panel, file);
      return;
    }
    if (action === "properties") {
      setPropsFile({ file, path: getFullPath(panel, file) });
      return;
    }
    if (action === "rename") {
      requestContextInput(action, panel, file, t("contextMenu.rename"), t("dialogs.renameLabel"), file.name);
      return;
    }
    if (action === "delete") {
      const selectedNames = getContextSelection(panel, file);
      requestContextConfirm(
        action,
        panel,
        file,
        t("dialogs.deleteTitle"),
        t("dialogs.deleteMessage", { count: selectedNames.length }),
        true,
        selectedNames
      );
    }
  };

  contextActionHandlerRef.current = (payload: ContextMenuActionPayload) => {
    const current = contextMenuPayloadRef.current;
    if (!current || current.id !== payload.id) return;
    performContextMenuAction(payload.action, current.panel, current.file);
    contextMenuPayloadRef.current = null;
  };

  useEffect(() => {
    let unlistenContextMenu: (() => void) | undefined;
    let unlistenCodexPlan: (() => void) | undefined;
    let unlistenCodexBuild: (() => void) | undefined;

    listen<ContextMenuActionPayload>("loftp-context-menu-action", (event) => {
      contextActionHandlerRef.current(event.payload);
    })
      .then((nextUnlisten) => {
        unlistenContextMenu = nextUnlisten;
      })
      .catch(() => {});

    listen<CodexPendingPlanPayload>("loftp-codex-plan-pending", (event) => {
      const report = event.payload.report ?? {};
      setPendingCodexPlanId(event.payload.planId);
      setPendingCodexBuildId(null);
      setAssistantResult({
        type: "codex",
        title: "Codex plan requires confirmation",
        body: [
          `Plan: ${event.payload.kind}`,
          `Plan ID: ${event.payload.planId}`,
          event.payload.hostingId ? `Hosting ID: ${event.payload.hostingId}` : "",
          event.payload.localBasePath ? `Local: ${event.payload.localBasePath}` : "",
          event.payload.remoteBasePath ? `Remote: ${event.payload.remoteBasePath}` : "",
          "",
          `Actions: ${report.totalActions ?? 0}`,
          `Destructive actions: ${report.destructiveActions ?? 0}`,
          `Bytes: ${report.totalBytes ?? 0}`,
          "",
          report.actionCounts ? JSON.stringify(report.actionCounts, null, 2) : "",
          "",
          ...(report.risks ?? []).map((risk) => `Risk: ${risk}`),
          report.rollbackRecommendation ? `Rollback: ${report.rollbackRecommendation}` : "",
        ].filter(Boolean).join("\n"),
        loading: false,
      });
    })
      .then((nextUnlisten) => {
        unlistenCodexPlan = nextUnlisten;
      })
      .catch(() => {});

    listen<CodexPendingBuildPayload>("loftp-codex-build-pending", (event) => {
      setPendingCodexPlanId(null);
      setPendingCodexBuildId(event.payload.requestId);
      setAssistantResult({
        type: "codex",
        title: "Codex build requires confirmation",
        body: [
          `Request ID: ${event.payload.requestId}`,
          `Command: ${event.payload.command}`,
          `Working dir: ${event.payload.workingDir}`,
          "",
          "The command will run locally only after this LoFTP confirmation.",
        ].join("\n"),
        loading: false,
      });
    })
      .then((nextUnlisten) => {
        unlistenCodexBuild = nextUnlisten;
      })
      .catch(() => {});

    return () => {
      unlistenContextMenu?.();
      unlistenCodexPlan?.();
      unlistenCodexBuild?.();
    };
  }, []);

  useEffect(() => {
    const localRoots = [
      leftMode === "local" && !leftLocal.isArchiveView ? leftLocal.path : null,
      rightMode === "local" && !rightLocal.isArchiveView ? rightLocal.path : null,
    ].filter((path): path is string => Boolean(path));

    const activeLocalPath =
      activePanel === "left"
        ? leftMode === "local" && !leftLocal.isArchiveView
          ? leftLocal.path
          : null
        : rightMode === "local" && !rightLocal.isArchiveView
          ? rightLocal.path
          : null;

    codexUpdateActiveContext({
      activeLocalPath,
      activeRemotePath: remote.path,
      activeHostingId: activeHost?.id ?? null,
      localRoots,
    }).catch(() => {});
  }, [
    activePanel,
    activeHost?.id,
    leftLocal.isArchiveView,
    leftLocal.path,
    leftMode,
    remote.path,
    rightLocal.isArchiveView,
    rightLocal.path,
    rightMode,
  ]);

  const openSystemContextMenu = async (panel: ContextMenuPanel, file: FileItem, event: React.MouseEvent) => {
    const panelData = getPanelData(panel);
    const panelArchiveView = !!getArchiveContext(panel);
    const panelWritableLocal = panelData.mode === "local" && !panelArchiveView;
    activatePanel(panel);
    if (file.name !== ".." && !panelData.selection.selected.has(file.name)) {
      panelData.selection.setSelected(new Set([file.name]));
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const menuSettings = getContextMenuSettings();
    const shortcut = (value: string) => menuSettings.showShortcuts ? value : undefined;
    const enabled = (action: ContextMenuAction) => menuSettings.actions[action];
    const items: NativeContextMenuItem[] = [];

    if (enabled("copyPath")) {
      items.push({ action: "copyPath", label: t("contextMenu.copyPath"), shortcut: shortcut("Cmd+Shift+C") });
    }

    if (enabled("copyName")) {
      items.push({ action: "copyName", label: t("contextMenu.copyName") });
    }

    if (enabled("copyBaseName") && file.name !== "..") {
      items.push({ action: "copyBaseName", label: t("contextMenu.copyBaseName") });
    }

    if (enabled("copyFiles") && file.name !== "..") {
      items.push({ action: "copyFiles", label: t("contextMenu.copyFiles"), shortcut: shortcut("F5") });
    }
    if (enabled("pasteFiles") && panelWritableLocal) {
      items.push({ action: "pasteFiles", label: t("contextMenu.pasteFiles") });
    }

    if (panelWritableLocal) {
      if (enabled("openInFinder")) {
        items.push({ action: "openInFinder", label: t("contextMenu.openInFinder"), shortcut: shortcut("Cmd+O") });
      }
      if (enabled("openInVSCode")) {
        items.push({ action: "openInVSCode", label: t("contextMenu.openInVsCode") });
      }
      if (enabled("openNatively")) {
        items.push({ action: "openNatively", label: t("contextMenu.openNatively") });
      }
      if (enabled("openWith")) {
        items.push({ action: "openWith", label: t("contextMenu.openWith") });
      }
    }

    if (file.name !== "..") {
      if (enabled("aiExplainFile")) {
        items.push({ action: "aiExplainFile", label: t("contextMenu.aiExplainFile") });
      }
      if (enabled("codexExplainFile")) {
        items.push({ action: "codexExplainFile", label: t("contextMenu.codexExplainFile") });
      }
    }

    if (enabled("openAsArchive") && resolveArchivePath(panel, file.name)) {
      items.push({ action: "openAsArchive", label: t("contextMenu.openAsArchive") });
    }
    if (enabled("openArchive") && resolveArchivePath(panel, file.name)) {
      items.push({ action: "openArchive", label: t("contextMenu.openArchive") });
    }

    if (enabled("createArchive") && panelWritableLocal && file.name !== "..") {
      items.push({ action: "createArchive", label: t("contextMenu.createArchive") });
    }
    if (enabled("extractHere") && panelData.mode === "local" && resolveArchivePath(panel, file.name)) {
      items.push({ action: "extractHere", label: t("contextMenu.extractHere") });
    }
    if (enabled("extractTo") && panelData.mode === "local" && resolveArchivePath(panel, file.name)) {
      items.push({ action: "extractTo", label: t("contextMenu.extractTo") });
    }

    if (enabled("copyTo") && panelData.mode === "local" && file.name !== "..") {
      items.push({ action: "copyTo", label: t("contextMenu.copyTo") });
    }
    if (enabled("moveTo") && panelWritableLocal && file.name !== "..") {
      items.push({ action: "moveTo", label: t("contextMenu.moveTo") });
    }
    if (enabled("newFile") && panelWritableLocal) {
      items.push({ action: "newFile", label: t("contextMenu.newFile") });
    }
    if (enabled("newFolder") && !panelArchiveView) {
      items.push({ action: "newFolder", label: t("contextMenu.newFolder"), shortcut: shortcut("F7") });
    }
    if (enabled("selectAll")) {
      items.push({ action: "selectAll", label: t("contextMenu.selectAll") });
    }
    if (enabled("deselectAll")) {
      items.push({ action: "deselectAll", label: t("contextMenu.deselectAll") });
    }
    if (enabled("invertSelection")) {
      items.push({ action: "invertSelection", label: t("contextMenu.invertSelection") });
    }
    if (enabled("selectByExtension")) {
      items.push({ action: "selectByExtension", label: t("contextMenu.selectByExtension") });
    }
    if (enabled("selectByPattern")) {
      items.push({ action: "selectByPattern", label: t("contextMenu.selectByPattern") });
    }
    if (enabled("compareFolders")) {
      items.push({ action: "compareFolders", label: t("contextMenu.compareFolders") });
    }
    if (enabled("refresh")) {
      items.push({ action: "refresh", label: t("contextMenu.refresh") });
    }
    if (enabled("search")) {
      items.push({ action: "search", label: t("contextMenu.search") });
    }

    if (enabled("properties")) {
      items.push({ action: "properties", label: t("contextMenu.properties") });
    }
    if (enabled("chmod") && panelWritableLocal && file.name !== "..") {
      items.push({ action: "chmod", label: t("contextMenu.chmod") });
    }
    if (enabled("changeDate") && panelWritableLocal && file.name !== "..") {
      items.push({ action: "changeDate", label: t("contextMenu.changeDate") });
    }
    if (enabled("calculateChecksum") && panelWritableLocal && !file.isDirectory) {
      items.push({ action: "calculateChecksum", label: t("contextMenu.calculateChecksum") });
    }
    if (enabled("batchRename") && panelWritableLocal && file.name !== "..") {
      items.push({ action: "batchRename", label: t("contextMenu.batchRename") });
    }
    if (enabled("splitFile") && panelWritableLocal && !file.isDirectory) {
      items.push({ action: "splitFile", label: t("contextMenu.splitFile") });
    }
    if (enabled("combineFiles") && panelWritableLocal && getContextSelection(panel, file).length > 1) {
      items.push({ action: "combineFiles", label: t("contextMenu.combineFiles") });
    }
    const panelRenameSupported = !panelArchiveView && !(panelData.mode === "remote" && activeHost?.protocol === "bunnyStorage");
    if (enabled("rename") && panelRenameSupported && file.name !== "..") {
      items.push({ action: "rename", label: t("contextMenu.rename"), shortcut: shortcut("F6") });
    }
    if (enabled("delete") && !panelArchiveView && file.name !== "..") {
      items.push({ action: "delete", label: t("contextMenu.delete"), shortcut: shortcut("F8") });
    }
    if (items.length === 0) {
      toast.error(t("toasts.contextMenuNoItems"));
      return;
    }

    contextMenuPayloadRef.current = { id, file, panel };

    try {
      await uiShowContextMenu({
        id,
        items,
        x: event.clientX,
        y: event.clientY,
      });
    } catch (error) {
      contextMenuPayloadRef.current = null;
      toast.error(t("toasts.contextMenuOpenFailed"), { description: String(error) });
    }
  };

  const canOpenArchive = !!resolveArchivePath(activePanel);
  const canCreateArchive = !!getArchiveSelection(activePanel);
  const activeFileNameSet = new Set(activeFiles.filter((file) => file.name !== "..").map((file) => file.name));
  const activeSelectedNames = Array.from(activeSel.selected).filter((name) => activeFileNameSet.has(name));
  const activeMenuFile = activeFiles.find((file) => activeSelectedNames.includes(file.name)) ?? null;
  const activeMenuFallbackFile: FileItem = activeMenuFile ?? {
    name: "",
    isDirectory: false,
    size: 0,
    modified: "",
  };
  const activeMenuHasFile = !!activeMenuFile;
  const activeMenuHasSelection = activeSelectedNames.length > 0;
  const activeMenuIsLocal = activePanelData.mode === "local";
  const activeMenuIsArchiveView = activeMenuIsLocal && getLocalPanelHook(activePanel).isArchiveView;
  const activeMenuIsWritableLocal = activeMenuIsLocal && !activeMenuIsArchiveView;
  const activeMenuIsFile = !!activeMenuFile && !activeMenuFile.isDirectory;
  const activeRenameSupported = !activeMenuIsArchiveView && !(activePanelData.mode === "remote" && activeHost?.protocol === "bunnyStorage");

  const runMenuContextAction = (action: ContextMenuAction, requiresFile = true) => {
    if (requiresFile && !activeMenuFile) return;
    performContextMenuAction(action, activePanel, requiresFile ? activeMenuFile! : activeMenuFallbackFile);
  };

  const toolbarMenuGroups: ToolbarMenuGroup[] = [
    {
      id: "connection",
      label: t("toolbar.menuConnection"),
      items: [
        { id: "newConnection", label: t("toolbar.newConnection"), onSelect: hostingWorkspace.openCreate },
        { id: "refresh", label: t("toolbar.refresh"), onSelect: fileActions.refresh, shortcut: "F2" },
        { id: "disconnect", label: t("toolbar.disconnect"), onSelect: hostingWorkspace.disconnect, danger: true },
      ],
    },
    {
      id: "transfers",
      label: t("toolbar.menuTransfers"),
      items: [
        { id: "upload", label: t("toolbar.upload"), onSelect: transferFlow.copy, disabled: !fileActions.hasSelection },
        { id: "download", label: t("toolbar.download"), onSelect: transferFlow.copy, disabled: !fileActions.hasSelection },
        { id: "copy", label: t("functionKeys.copy"), onSelect: transferFlow.copy, disabled: !fileActions.hasSelection, shortcut: "F5" },
        { id: "move", label: t("functionKeys.move"), onSelect: transferFlow.move, disabled: !fileActions.hasSelection || activeMenuIsArchiveView, shortcut: "F6" },
        { id: "copyTo", label: t("contextMenu.copyTo"), onSelect: () => runMenuContextAction("copyTo"), disabled: !activeMenuIsLocal || !activeMenuHasFile },
        { id: "moveTo", label: t("contextMenu.moveTo"), onSelect: () => runMenuContextAction("moveTo"), disabled: !activeMenuIsWritableLocal || !activeMenuHasFile },
        { id: "copyFiles", label: t("contextMenu.copyFiles"), onSelect: () => runMenuContextAction("copyFiles"), disabled: !activeMenuIsLocal || !activeMenuHasFile },
        { id: "pasteFiles", label: t("contextMenu.pasteFiles"), onSelect: () => runMenuContextAction("pasteFiles", false), disabled: !activeMenuIsWritableLocal },
      ],
    },
    {
      id: "file",
      label: t("toolbar.menuFile"),
      items: [
        { id: "view", label: t("functionKeys.view"), onSelect: () => setQuickViewOpen((v) => !v), disabled: !activeMenuHasFile, shortcut: "F3" },
        { id: "edit", label: t("functionKeys.edit"), onSelect: () => setEditorOpen(true), disabled: !activeMenuIsWritableLocal || !activeMenuIsFile, shortcut: "F4" },
        { id: "openInFinder", label: t("contextMenu.openInFinder"), onSelect: () => runMenuContextAction("openInFinder"), disabled: !activeMenuIsWritableLocal || !activeMenuHasFile },
        { id: "openInVsCode", label: t("contextMenu.openInVsCode"), onSelect: () => runMenuContextAction("openInVSCode"), disabled: !activeMenuIsWritableLocal || !activeMenuHasFile },
        { id: "openNatively", label: t("contextMenu.openNatively"), onSelect: () => runMenuContextAction("openNatively"), disabled: !activeMenuIsWritableLocal || !activeMenuHasFile },
        { id: "openWith", label: t("contextMenu.openWith"), onSelect: () => runMenuContextAction("openWith"), disabled: !activeMenuIsWritableLocal || !activeMenuHasFile },
        { id: "copyPath", label: t("contextMenu.copyPath"), onSelect: () => runMenuContextAction("copyPath"), disabled: !activeMenuHasFile, shortcut: "Cmd+Shift+C" },
        { id: "copyName", label: t("contextMenu.copyName"), onSelect: () => runMenuContextAction("copyName"), disabled: !activeMenuHasFile },
        { id: "copyBaseName", label: t("contextMenu.copyBaseName"), onSelect: () => runMenuContextAction("copyBaseName"), disabled: !activeMenuHasFile },
        { id: "newFile", label: t("contextMenu.newFile"), onSelect: () => runMenuContextAction("newFile", false), disabled: !activeMenuIsWritableLocal },
        { id: "newFolder", label: t("contextMenu.newFolder"), onSelect: fileActions.createFolder, disabled: activeMenuIsArchiveView, shortcut: "F7" },
        { id: "rename", label: t("contextMenu.rename"), onSelect: fileActions.rename, disabled: !activeMenuHasSelection || !activeRenameSupported, shortcut: "F6" },
        { id: "delete", label: t("contextMenu.delete"), onSelect: fileActions.remove, disabled: !activeMenuHasSelection || activeMenuIsArchiveView, shortcut: "F8", danger: true },
      ],
    },
    {
      id: "selection",
      label: t("toolbar.menuSelection"),
      items: [
        { id: "selectAll", label: t("contextMenu.selectAll"), onSelect: () => runMenuContextAction("selectAll", false) },
        { id: "deselectAll", label: t("contextMenu.deselectAll"), onSelect: () => runMenuContextAction("deselectAll", false), disabled: !activeMenuHasSelection },
        { id: "invertSelection", label: t("contextMenu.invertSelection"), onSelect: () => runMenuContextAction("invertSelection", false) },
        { id: "selectByExtension", label: t("contextMenu.selectByExtension"), onSelect: () => runMenuContextAction("selectByExtension", false), disabled: activeFiles.length === 0 },
        { id: "selectByPattern", label: t("contextMenu.selectByPattern"), onSelect: () => runMenuContextAction("selectByPattern", false), disabled: activeFiles.length === 0 },
      ],
    },
    {
      id: "archives",
      label: t("toolbar.menuArchives"),
      items: [
        { id: "openAsArchive", label: t("contextMenu.openAsArchive"), onSelect: () => runMenuContextAction("openAsArchive"), disabled: !canOpenArchive },
        { id: "openArchive", label: t("contextMenu.openArchive"), onSelect: () => handleOpenArchive(), disabled: !canOpenArchive },
        { id: "createArchive", label: t("contextMenu.createArchive"), onSelect: () => handleCreateArchiveRequest(), disabled: !canCreateArchive },
        { id: "extractHere", label: t("contextMenu.extractHere"), onSelect: () => runMenuContextAction("extractHere"), disabled: !activeMenuIsLocal || !canOpenArchive },
        { id: "extractTo", label: t("contextMenu.extractTo"), onSelect: () => runMenuContextAction("extractTo"), disabled: !activeMenuIsLocal || !canOpenArchive },
      ],
    },
    {
      id: "tools",
      label: t("toolbar.menuTools"),
      items: [
        { id: "search", label: t("contextMenu.search"), onSelect: () => setSearchOpen(true), shortcut: "Alt+F7" },
        {
          id: "compareFolders",
          label: t("contextMenu.compareFolders"),
          onSelect: () => {
            if (dirCompare.isComparing) dirCompare.stop();
            else dirCompare.compare(leftPanelData.files, rightPanelData.files);
          },
        },
        { id: "properties", label: t("contextMenu.properties"), onSelect: () => runMenuContextAction("properties"), disabled: !activeMenuHasFile },
        { id: "chmod", label: t("contextMenu.chmod"), onSelect: () => runMenuContextAction("chmod"), disabled: !activeMenuIsWritableLocal || !activeMenuHasFile },
        { id: "changeDate", label: t("contextMenu.changeDate"), onSelect: () => runMenuContextAction("changeDate"), disabled: !activeMenuIsWritableLocal || !activeMenuHasFile },
        { id: "calculateChecksum", label: t("contextMenu.calculateChecksum"), onSelect: () => runMenuContextAction("calculateChecksum"), disabled: !activeMenuIsWritableLocal || !activeMenuIsFile },
        { id: "batchRename", label: t("contextMenu.batchRename"), onSelect: () => runMenuContextAction("batchRename"), disabled: !activeMenuIsWritableLocal || !activeMenuHasFile },
        { id: "splitFile", label: t("contextMenu.splitFile"), onSelect: () => runMenuContextAction("splitFile"), disabled: !activeMenuIsWritableLocal || !activeMenuIsFile },
        { id: "combineFiles", label: t("contextMenu.combineFiles"), onSelect: () => runMenuContextAction("combineFiles"), disabled: !activeMenuIsWritableLocal || activeSelectedNames.length <= 1 },
        { id: "aiExplainFile", label: t("contextMenu.aiExplainFile"), onSelect: () => runMenuContextAction("aiExplainFile"), disabled: !activeMenuIsLocal || !activeMenuIsFile },
        { id: "codexExplainFile", label: t("contextMenu.codexExplainFile"), onSelect: () => runMenuContextAction("codexExplainFile"), disabled: !activeMenuHasFile },
      ],
    },
    {
      id: "application",
      label: t("toolbar.menuApplication"),
      items: [
        { id: "settings", label: t("toolbar.settings"), onSelect: () => setSettingsOpen(true) },
        { id: "about", label: t("toolbar.about"), onSelect: () => setAboutOpen(true) },
      ],
    },
  ];

  const archiveCreateDefaultName = (() => {
    if (!archiveCreateRequest || archiveCreateRequest.sourcePaths.length !== 1) {
      return "archive.zip";
    }

    const [name] = archiveCreateRequest.sourcePaths;
    const withoutExtension = name.replace(/\.(zip|tar|tar\.gz|tgz)$/i, "");
    return `${withoutExtension || "archive"}.zip`;
  })();

  // Drive selector handlers
  const handleSelectVolume = (panel: "left" | "right", path: string) => {
    if (panel === "left") {
      setLeftMode("local");
      leftLocal.navigate(path);
      leftSelection.clear();
    } else {
      setRightMode("local");
      rightLocal.navigate(path);
      rightSelection.clear();
    }
  };

  const handleSelectHosting = async (panel: "left" | "right", hosting: HostingConfig) => {
    // Connect if needed
    if (connection.getStatus(hosting.id) !== "connected") {
      await hostingWorkspace.selectHosting(hosting.id);
    }
    if (panel === "left") {
      if (rightMode === "remote") setRightMode("local");
      setLeftMode("remote");
    } else {
      if (leftMode === "remote") setLeftMode("local");
      setRightMode("remote");
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    disabled: Boolean(
      fileActions.pendingAction ||
        contextInput ||
        contextConfirm ||
        archiveCreateRequest ||
        settingsOpen ||
        aboutOpen ||
        searchOpen ||
        propsFile ||
        assistantResult ||
        editorOpen ||
        hostingWorkspace.dialogOpen ||
        transferFlow.transferDialogOpen ||
        (!license.isActivated && !sharewareDismissed)
    ),
    hasSelection: activeMenuHasSelection,
    onView: () => setQuickViewOpen((v) => !v),
    onEdit: () => {
      if (activeMenuIsWritableLocal && activeMenuIsFile) setEditorOpen(true);
    },
    onCopy: () => transferFlow.copy(),
    onMove: () => transferFlow.move(),
    onNewFolder: () => {
      if (!activeMenuIsArchiveView) fileActions.createFolder();
    },
    onDelete: () => {
      if (!activeMenuIsArchiveView) fileActions.remove();
    },
    onSearch: () => setSearchOpen(true),
    onRefresh: () => fileActions.refresh(),
    onSelectAll: () => {
      const names = activeFiles.filter((f) => f.name !== "..").map((f) => f.name);
      activeSel.setSelected(new Set(names));
    },
    onInvertSelection: () => {
      const all = activeFiles.filter((f) => f.name !== "..").map((f) => f.name);
      const inverted = new Set(all.filter((n) => !activeSel.selected.has(n)));
      activeSel.setSelected(inverted);
    },
    onTogglePanel: () => activatePanel(activePanel === "left" ? "right" : "left"),
    onNavigateUp: handleNavigateUp,
  });

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden select-none">
      <AppTitleBar
        activeHost={activeHost}
        isConnected={isConnected}
      />

      {/* Row 1: Hosting tabs */}
      <div className="bg-toolbar border-b border-toolbar-border">
        <HostingTabs
          hostings={hostings}
          activeId={hostingWorkspace.activeHostingId}
          onSelect={async (id: string) => {
            await hostingWorkspace.selectHosting(id);
            // Auto-switch right panel to remote after selecting a hosting
            if (leftMode === "remote") setLeftMode("local");
            setRightMode("remote");
          }}
          onRemove={hostingWorkspace.remove}
          onEdit={hostingWorkspace.edit}
        />
      </div>

      {/* Row 2: Toolbar */}
      <Toolbar
        menuGroups={toolbarMenuGroups}
        onNewHosting={hostingWorkspace.openCreate}
        onRefresh={fileActions.refresh}
        onDisconnect={hostingWorkspace.disconnect}
        onUpload={transferFlow.copy}
        onDownload={transferFlow.copy}
        onDelete={fileActions.remove}
        onRename={fileActions.rename}
        onSettings={() => setSettingsOpen(true)}
        onAbout={() => setAboutOpen(true)}
        onNewFolder={fileActions.createFolder}
        onSearch={() => setSearchOpen(true)}
        onOpenArchive={() => handleOpenArchive()}
        onCreateArchive={() => handleCreateArchiveRequest()}
        onCompare={() => {
          if (dirCompare.isComparing) dirCompare.stop();
          else dirCompare.compare(leftPanelData.files, rightPanelData.files);
        }}
        hasSelection={fileActions.hasSelection}
        canRename={fileActions.hasSelection && activeRenameSupported}
        canNewFolder={!activeMenuIsArchiveView}
        canDelete={fileActions.hasSelection && !activeMenuIsArchiveView}
        canOpenArchive={canOpenArchive}
        canCreateArchive={canCreateArchive}
        isComparing={dirCompare.isComparing}
      />

      <PanelHeaderRow
        hostings={hostings}
        activeHost={activeHost}
        connectionStatuses={connection.statuses}
        leftMode={leftMode}
        rightMode={rightMode}
        leftPath={getLeftPath()}
        rightPath={getRightPath()}
        onLeftSelectVolume={(path) => handleSelectVolume("left", path)}
        onLeftSelectHosting={(h) => handleSelectHosting("left", h)}
        onRightSelectVolume={(path) => handleSelectVolume("right", path)}
        onRightSelectHosting={(h) => handleSelectHosting("right", h)}
      />

      {/* Compare bar */}
      {dirCompare.isComparing && dirCompare.result && (
        <CompareBar
          result={dirCompare.result}
          onSyncToRemote={() => {
            const toSync = leftPanelData.files.filter((f) => {
              const s = dirCompare.result?.statusMap.get(f.name);
              return s === "newer" || s === "local-only" || s === "size-differs";
            });
            if (toSync.length > 0) {
              leftPanelData.selection.setSelected(new Set(toSync.map((f) => f.name)));
              activatePanel("left");
              transferFlow.copy();
            }
          }}
          onSyncToLocal={() => {
            const toSync = rightPanelData.files.filter((f) => {
              const s = dirCompare.result?.statusMap.get(f.name);
              return s === "older" || s === "remote-only" || s === "size-differs";
            });
            if (toSync.length > 0) {
              rightPanelData.selection.setSelected(new Set(toSync.map((f) => f.name)));
              activatePanel("right");
              transferFlow.copy();
            }
          }}
          onClose={() => dirCompare.stop()}
        />
      )}

      {/* Dual panel */}
      <div className="flex-1 grid grid-cols-2 gap-0 min-h-0">
        <div className="border-r border-divider p-1.5 min-h-0" onClick={() => activatePanel("left")}>
          <FilePanel
            title={leftMode === "local" ? t("common.local") : t("common.server")}
            icon={leftMode === "local" ? "local" : "remote"}
            files={getLeftFiles()}
            currentPath={getLeftPath()}
            onNavigate={(path) => leftPanelData.navigate(path)}
            onNavigateUp={() => {
              if (leftMode === "local") leftLocal.navigateUp();
              else leftPanelData.navigate(leftPanelData.path.split("/").slice(0, -1).join("/") || "/");
            }}
            selectedFiles={getLeftSelection().selected}
            onSelect={getLeftSelection().toggle}
            onClearSelection={getLeftSelection().clear}
            onRangeSelect={getLeftSelection().rangeSelect}
            onUpdateLastClicked={getLeftSelection().updateLastClicked}
            onDoubleClick={(file) => handleDoubleClick("left", file)}
            onContextMenu={(event, file) => openSystemContextMenu("left", file, event)}
            onDrop={(fileNames, operation) => transferFlow.dropOnPanel("left", fileNames, operation)}
            onActivate={() => activatePanel("left")}
            panelId="left"
            isFocused={activePanel === "left"}
            compareStatus={dirCompare.isComparing ? dirCompare.result?.statusMap : undefined}
          />
        </div>
        <div className="p-1.5 min-h-0" onClick={() => !quickViewOpen && activatePanel("right")}>
          {quickViewOpen ? (
            <QuickViewPanel
              filePath={(() => {
                const sel = activeSel.selected;
                if (sel.size === 0) return null;
                const name = Array.from(sel)[0];
                const file = activeFiles.find((f) => f.name === name);
                if (!file || file.isDirectory) return null;
                if (activePanelData.mode === "local" && !getLocalPanelHook(activePanel).isArchiveView) {
                  return joinPath(activePanelData.path, name);
                }
                return null;
              })()}
              archivePath={(() => {
                if (activePanelData.mode !== "local") return null;
                const localPanel = getLocalPanelHook(activePanel);
                if (!localPanel.isArchiveView) return null;
                return localPanel.archivePath;
              })()}
              archiveEntryPath={(() => {
                if (activePanelData.mode !== "local") return null;
                const localPanel = getLocalPanelHook(activePanel);
                if (!localPanel.isArchiveView) return null;
                const sel = activeSel.selected;
                if (sel.size === 0) return null;
                const name = Array.from(sel)[0];
                const file = activeFiles.find((f) => f.name === name);
                if (!file || file.isDirectory) return null;
                return file.entryPath ?? null;
              })()}
              onClose={() => setQuickViewOpen(false)}
            />
          ) : (
            <FilePanel
              title={rightMode === "local" ? t("common.local") : t("common.server")}
              icon={rightMode === "local" ? "local" : "remote"}
              files={getRightFiles()}
              currentPath={getRightPath()}
              onNavigate={(path) => rightPanelData.navigate(path)}
              onNavigateUp={() => {
                if (rightMode === "local") rightLocal.navigateUp();
                else rightPanelData.navigate(rightPanelData.path.split("/").slice(0, -1).join("/") || "/");
              }}
              selectedFiles={getRightSelection().selected}
              onSelect={getRightSelection().toggle}
              onClearSelection={getRightSelection().clear}
              onRangeSelect={getRightSelection().rangeSelect}
              onUpdateLastClicked={getRightSelection().updateLastClicked}
              onDoubleClick={(file) => handleDoubleClick("right", file)}
              onContextMenu={(event, file) => openSystemContextMenu("right", file, event)}
              onDrop={(fileNames, operation) => transferFlow.dropOnPanel("right", fileNames, operation)}
              onActivate={() => activatePanel("right")}
              panelId="right"
              isFocused={activePanel === "right"}
              compareStatus={dirCompare.isComparing ? dirCompare.result?.statusMap : undefined}
            />
          )}
        </div>
      </div>

      {/* Function key bar */}
      <FunctionKeyBar
        onView={() => setQuickViewOpen((v) => !v)}
        onEdit={() => {
          if (activeMenuIsWritableLocal && activeMenuIsFile) setEditorOpen(true);
        }}
        onCopy={() => transferFlow.copy()}
        onMove={() => {
          transferFlow.move();
        }}
        onNewFolder={() => {
          if (!activeMenuIsArchiveView) fileActions.createFolder();
        }}
        onDelete={() => {
          if (!activeMenuIsArchiveView) fileActions.remove();
        }}
        onSearch={() => setSearchOpen(true)}
      />


      {/* Dialogs */}
      <HostingDialog
        open={hostingWorkspace.dialogOpen}
        onClose={hostingWorkspace.closeDialog}
        onSave={hostingWorkspace.save}
        editHosting={hostingWorkspace.editingHosting}
      />

      {transferFlow.pendingTransfer && (
        <TransferDialog
          open={transferFlow.transferDialogOpen}
          onClose={transferFlow.closeDialog}
          onConfirm={transferFlow.confirm}
          files={transferFlow.pendingTransfer.files}
          fromPath={transferFlow.pendingTransfer.from}
          toPath={transferFlow.pendingTransfer.to}
          direction={transferFlow.pendingTransfer.direction}
          operation={transferFlow.pendingTransfer.operation}
          transfers={transfers}
          transferring={transferFlow.isTransferring}
        />
      )}

      {/* Editor */}
      <EditorPanel
        open={editorOpen}
        filePath={(() => {
          if (activePanelData.mode !== "local") return null;
          if (getLocalPanelHook(activePanel).isArchiveView) return null;
          const sel = activeSel.selected;
          if (sel.size === 0) return null;
          const name = Array.from(sel)[0];
          const file = activeFiles.find((f) => f.name === name);
          if (!file || file.isDirectory) return null;
          return joinPath(activePanelData.path, name);
        })()}
        onClose={() => setEditorOpen(false)}
        onSaved={() => activePanelData.refresh()}
      />

      {/* Search dialog */}
      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        searchPath={activePanelData.path}
        onNavigateToFile={(path) => activePanelData.navigate(path)}
      />

      {/* Properties dialog */}
      <PropertiesDialog
        open={!!propsFile}
        onClose={() => setPropsFile(null)}
        file={propsFile?.file ?? null}
        fullPath={propsFile?.path ?? ""}
      />

      <AssistantResultDialog
        open={!!assistantResult}
        type={assistantResult?.type ?? "ai"}
        title={assistantResult?.title ?? ""}
        body={assistantResult?.body ?? ""}
        loading={assistantResult?.loading}
        actionLabel={pendingCodexPlanId ? "Confirm plan" : pendingCodexBuildId ? "Run build" : undefined}
        actionDisabled={codexPlanApproving}
        onAction={pendingCodexPlanId ? approvePendingCodexPlan : pendingCodexBuildId ? approvePendingCodexBuild : undefined}
        onClose={() => {
          setAssistantResult(null);
          setPendingCodexPlanId(null);
          setPendingCodexBuildId(null);
        }}
      />

      {/* Input/Confirm dialogs for file actions */}
      <InputDialog
        open={fileActions.pendingAction?.type === "mkdir"}
        title={t("dialogs.newFolderTitle")}
        label={t("dialogs.newFolderLabel")}
        onConfirm={fileActions.confirmCreateFolder}
        onCancel={fileActions.cancelAction}
      />
      <InputDialog
        open={fileActions.pendingAction?.type === "rename"}
        title={t("dialogs.renameTitle")}
        label={t("dialogs.renameLabel")}
        defaultValue={fileActions.pendingAction?.type === "rename" ? fileActions.pendingAction.oldName : ""}
        onConfirm={fileActions.confirmRename}
        onCancel={fileActions.cancelAction}
      />
      <InputDialog
        open={!!archiveCreateRequest}
        title={t("dialogs.createArchiveTitle")}
        label={t("dialogs.createArchiveLabel")}
        defaultValue={archiveCreateDefaultName}
        onConfirm={handleCreateArchiveConfirm}
        onCancel={() => setArchiveCreateRequest(null)}
      />
      <InputDialog
        open={!!contextInput}
        title={contextInput?.title ?? ""}
        label={contextInput?.label ?? ""}
        defaultValue={contextInput?.defaultValue ?? ""}
        onConfirm={handleContextInputConfirm}
        onCancel={() => setContextInput(null)}
      />
      <ConfirmDialog
        open={fileActions.pendingAction?.type === "delete"}
        title={t("dialogs.deleteTitle")}
        message={t("dialogs.deleteMessage", { count: fileActions.pendingAction?.type === "delete" ? fileActions.pendingAction.count : 0 })}
        confirmLabel={t("common.delete")}
        danger
        busy={deleteDialogBusy}
        confirmDisabled={deleteDialogFailed}
        progress={fileActions.pendingAction?.type === "delete" ? deleteProgress.status : null}
        onConfirm={fileActions.confirmDelete}
        onCancel={fileActions.cancelAction}
      />
      <ConfirmDialog
        open={!!contextConfirm}
        title={contextConfirm?.title ?? ""}
        message={contextConfirm?.message ?? ""}
        confirmLabel={t("common.delete")}
        danger={contextConfirm?.danger}
        busy={deleteDialogBusy}
        confirmDisabled={deleteDialogFailed}
        progress={contextConfirm?.action === "delete" ? deleteProgress.status : null}
        onConfirm={handleContextConfirm}
        onCancel={() => {
          deleteProgress.clear();
          setContextConfirm(null);
        }}
      />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={themeCtx.theme}
        onThemeChange={themeCtx.setTheme}
        showHiddenFiles={showHiddenFiles}
        onShowHiddenFilesChange={setShowHiddenFiles}
      />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <SharewareDialog
        open={!license.isActivated && !sharewareDismissed}
        onContinue={() => setSharewareDismissed(true)}
        onActivate={() => {
          setSharewareDismissed(true);
          setSettingsOpen(true);
        }}
      />
    </div>
  );
};

export default Index;
