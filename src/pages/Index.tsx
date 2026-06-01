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
import { Toolbar } from "@/components/ftp/Toolbar";
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
import { useLicense } from "@/hooks/useLicense";
import { useTheme } from "@/hooks/useTheme";
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
  codexListHostings,
  fsChecksum,
  fsChmod,
  fsCombineFiles,
  fsCopy,
  fsCopyDir,
  fsDelete,
  fsIsDir,
  fsMkdir,
  fsReadText,
  fsRename,
  fsSetModified,
  fsSplitFile,
  fsWriteText,
  uiShowContextMenu,
} from "@/lib/tauri";
import { toast } from "@/components/ui/sonner";
import { useI18n } from "@/i18n";
import type { ContextMenuAction, ContextMenuActionPayload, ContextMenuPanel, NativeContextMenuItem } from "@/types/contextMenu";
import { getContextMenuSettings } from "@/lib/contextMenuSettings";

const Index = () => {
  const { t } = useI18n();
  // Hooks
  const { hostings, save: saveHosting, remove: removeHosting } = useHostings();
  const leftLocal = useLocalFiles();
  const rightLocal = useLocalFiles();
  const connection = useConnection();
  const { transfers, startUpload, startDownload } = useTransfers();
  const license = useLicense();
  const themeCtx = useTheme();
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

  const leftSelection = useFileSelection();
  const rightSelection = useFileSelection();
  const remoteSelectionForHook = useFileSelection();
  const remote = useRemoteFiles(connection, remoteSelectionForHook.clear);
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
  const getLeftFiles = () => leftMode === "local" ? leftLocal.files : remote.files;
  const getLeftPath = () => leftMode === "local" ? leftLocal.path : remote.path;
  const getLeftSelection = () => leftMode === "local" ? leftSelection : remoteSelectionForHook;

  const getRightFiles = () => rightMode === "local" ? rightLocal.files : remote.files;
  const getRightPath = () => rightMode === "local" ? rightLocal.path : remote.path;
  const getRightSelection = () => rightMode === "local" ? rightSelection : remoteSelectionForHook;
  const getLocalPanelHook = (panel: "left" | "right") => panel === "left" ? leftLocal : rightLocal;

  const leftPanelData = {
    mode: leftMode,
    path: getLeftPath(),
    isArchiveView: leftMode === "local" ? leftLocal.isArchiveView : false,
    archivePath: leftMode === "local" ? leftLocal.archivePath : null,
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
  });

  const transferFlow = useTransferOrchestration({
    activeHost,
    activePanel,
    leftPanel: leftPanelData,
    rightPanel: rightPanelData,
    transfers: { startUpload, startDownload },
    fileResolver: {
      resolveActiveItem: fileActions.resolveActiveItem,
      resolveInactiveItem: fileActions.resolveInactiveItem,
    },
  });

  // --- Navigation ---

  const activePanelData = activePanel === "left" ? leftPanelData : rightPanelData;
  const activeFiles = activePanelData.files;
  const activeSel = activePanelData.selection;

  const isArchive = (name: string) => /\.(zip|tar|tar\.gz|tgz)$/i.test(name);

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
        pd.navigate(file.resolvedPath || `${pd.path}/${file.name}`);
      }
    } else if (pd.mode === "local" && isArchive(file.name)) {
      localPanel.openArchive(`${pd.path}/${file.name}`);
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
    return `${pd.path}/${name}`;
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

    const outputName = /\.zip$/i.test(archiveName) ? archiveName : `${archiveName}.zip`;
    try {
      await archiveCreate(
        `${archiveCreateRequest.baseDir}/${outputName}`,
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

  const getFullPath = (panel: ContextMenuPanel, file: FileItem) => {
    const pd = panel === "left" ? leftPanelData : rightPanelData;
    return `${pd.path}/${file.name}`;
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
      const content = await fsReadText(fullPath, 80_000);
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

  const selectContextFile = (panel: ContextMenuPanel, file: FileItem) => {
    setActivePanel(panel);
    if (file.name === "..") return;
    const pd = getPanelData(panel);
    if (!pd.selection.selected.has(file.name)) {
      pd.selection.setSelected(new Set([file.name]));
    }
  };

  const getContextSelection = (panel: ContextMenuPanel, file: FileItem) => {
    const pd = getPanelData(panel);
    const selected = pd.selection.selected.has(file.name)
      ? Array.from(pd.selection.selected)
      : file.name === ".."
        ? []
        : [file.name];
    return selected.filter((name) => name !== "..");
  };

  const copyLocalEntry = async (from: string, to: string, isDirectory: boolean) => {
    if (isDirectory) await fsCopyDir(from, to);
    else await fsCopy(from, to);
  };

  const copyLocalSelection = async (panel: ContextMenuPanel, file: FileItem, targetDir: string, move = false) => {
    const pd = getPanelData(panel);
    if (pd.mode !== "local") throw new Error(t("dialogs.localFilesOnly"));
    const names = getContextSelection(panel, file);
    for (const name of names) {
      const source = `${pd.path}/${name}`;
      const sourceItem = pd.files.find((item) => item.name === name);
      await copyLocalEntry(source, `${targetDir}/${name}`, sourceItem?.isDirectory ?? false);
      if (move) await fsDelete(source);
    }
    pd.refresh();
  };

  const saveContextClipboard = (panel: ContextMenuPanel, file: FileItem) => {
    const pd = getPanelData(panel);
    if (pd.mode !== "local") throw new Error(t("dialogs.localFilesOnly"));
    const entries = getContextSelection(panel, file).map((name) => {
      const sourceFile = pd.files.find((item) => item.name === name);
      return {
        path: `${pd.path}/${name}`,
        isDirectory: sourceFile?.isDirectory ?? false,
      };
    });
    localStorage.setItem("loftp.fileClipboard.v1", JSON.stringify(entries));
    toast.success(t("contextMenu.copyFiles"), { description: `${entries.length}` });
  };

  const pasteContextClipboard = async (panel: ContextMenuPanel) => {
    const pd = getPanelData(panel);
    if (pd.mode !== "local") throw new Error(t("dialogs.localPanelOnly"));
    const raw = localStorage.getItem("loftp.fileClipboard.v1");
    const parsed = raw ? JSON.parse(raw) as Array<string | { path: string; isDirectory?: boolean }> : [];
    for (const entry of parsed) {
      const source = typeof entry === "string" ? entry : entry.path;
      const name = source.split("/").filter(Boolean).pop();
      if (!name) continue;
      const isDirectory = typeof entry === "string" ? await fsIsDir(source) : Boolean(entry.isDirectory);
      await copyLocalEntry(source, `${pd.path}/${name}`, isDirectory);
    }
    pd.refresh();
  };

  const requestContextInput = (action: ContextMenuAction, panel: ContextMenuPanel, file: FileItem, title: string, label: string, defaultValue = "") => {
    setContextInput({ action, panel, file, title, label, defaultValue });
  };

  const requestContextConfirm = (action: ContextMenuAction, panel: ContextMenuPanel, file: FileItem, title: string, message: string, danger = false) => {
    setContextConfirm({ action, panel, file, title, message, danger });
  };

  const renameInPanel = async (panel: ContextMenuPanel, file: FileItem, newName: string) => {
    const pd = getPanelData(panel);
    const oldName = file.name;
    if (!newName || newName === oldName) return;
    if (pd.mode === "remote") {
      if (!activeHost || connection.getStatus(activeHost.id) !== "connected") throw new Error(t("dialogs.remoteNotConnected"));
      await connection.renameRemote(activeHost.id, `${pd.path}/${oldName}`, `${pd.path}/${newName}`, activeHost.protocol);
    } else {
      await fsRename(`${pd.path}/${oldName}`, `${pd.path}/${newName}`);
    }
    pd.selection.clear();
    pd.refresh();
  };

  const createFolderInPanel = async (panel: ContextMenuPanel, name: string) => {
    const pd = getPanelData(panel);
    if (pd.mode === "remote") {
      if (!activeHost || connection.getStatus(activeHost.id) !== "connected") throw new Error(t("dialogs.remoteNotConnected"));
      await connection.mkdirRemote(activeHost.id, `${pd.path}/${name}`, activeHost.protocol);
    } else {
      await fsMkdir(`${pd.path}/${name}`);
    }
    pd.refresh();
  };

  const deleteSelectionInPanel = async (panel: ContextMenuPanel, file: FileItem) => {
    const pd = getPanelData(panel);
    const names = getContextSelection(panel, file);
    for (const name of names) {
      if (pd.mode === "remote") {
        if (!activeHost || connection.getStatus(activeHost.id) !== "connected") throw new Error(t("dialogs.remoteNotConnected"));
        const item = pd.files.find((entry) => entry.name === name);
        await connection.deleteRemote(activeHost.id, `${pd.path}/${name}`, item?.isDirectory ?? false, activeHost.protocol);
      } else {
        await fsDelete(`${pd.path}/${name}`);
      }
    }
    pd.selection.clear();
    pd.refresh();
  };

  const handleContextConfirm = async () => {
    if (!contextConfirm) return;
    const { action, panel, file } = contextConfirm;
    setContextConfirm(null);
    try {
      if (action === "delete") {
        await deleteSelectionInPanel(panel, file);
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
          await fsRename(`${pd.path}/${name}`, `${pd.path}/${value}${index + 1}${extension}`);
        }
        pd.refresh();
        return;
      }
      if (action === "newFile") {
        await fsWriteText(`${pd.path}/${value}`, "");
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
          .map((name) => `${pd.path}/${name}`);
        await fsCombineFiles(parts, `${pd.path}/${value}`);
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
    if (action === "openInFinder" && pd.mode === "local") {
      openExternal(getFullPath(panel, file)).catch(() => {});
      return;
    }
    if (action === "openInVSCode" && pd.mode === "local") {
      const encodedPath = encodeURI(getFullPath(panel, file));
      openExternal(`vscode://file${encodedPath}`).catch(() => {});
      return;
    }
    if ((action === "openNatively" || action === "openWith") && pd.mode === "local") {
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
      requestContextInput(action, panel, file, t("contextMenu.extractTo"), t("dialogs.targetFolder"), pd.path);
      return;
    }
    if (action === "copyTo") {
      requestContextInput(action, panel, file, t("contextMenu.copyTo"), t("dialogs.targetFolder"), pd.path);
      return;
    }
    if (action === "moveTo") {
      requestContextInput(action, panel, file, t("contextMenu.moveTo"), t("dialogs.targetFolder"), pd.path);
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
      setActivePanel(panel);
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
      requestContextConfirm(
        action,
        panel,
        file,
        t("dialogs.deleteTitle"),
        t("dialogs.deleteMessage", { count: getContextSelection(panel, file).length }),
        true
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
    let unlisten: (() => void) | undefined;

    listen<ContextMenuActionPayload>("loftp-context-menu-action", (event) => {
      contextActionHandlerRef.current(event.payload);
    })
      .then((nextUnlisten) => {
        unlisten = nextUnlisten;
      })
      .catch(() => {});

    return () => {
      unlisten?.();
    };
  }, []);

  const openSystemContextMenu = async (panel: ContextMenuPanel, file: FileItem, event: React.MouseEvent) => {
    const panelData = getPanelData(panel);
    setActivePanel(panel);
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
    if (enabled("pasteFiles") && panelData.mode === "local") {
      items.push({ action: "pasteFiles", label: t("contextMenu.pasteFiles") });
    }

    if (panelData.mode === "local") {
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

    if (enabled("createArchive") && panelData.mode === "local" && file.name !== "..") {
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
    if (enabled("moveTo") && panelData.mode === "local" && file.name !== "..") {
      items.push({ action: "moveTo", label: t("contextMenu.moveTo") });
    }
    if (enabled("newFile") && panelData.mode === "local") {
      items.push({ action: "newFile", label: t("contextMenu.newFile") });
    }
    if (enabled("newFolder")) {
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
    if (enabled("chmod") && panelData.mode === "local" && file.name !== "..") {
      items.push({ action: "chmod", label: t("contextMenu.chmod") });
    }
    if (enabled("changeDate") && panelData.mode === "local" && file.name !== "..") {
      items.push({ action: "changeDate", label: t("contextMenu.changeDate") });
    }
    if (enabled("calculateChecksum") && panelData.mode === "local" && !file.isDirectory) {
      items.push({ action: "calculateChecksum", label: t("contextMenu.calculateChecksum") });
    }
    if (enabled("batchRename") && panelData.mode === "local" && file.name !== "..") {
      items.push({ action: "batchRename", label: t("contextMenu.batchRename") });
    }
    if (enabled("splitFile") && panelData.mode === "local" && !file.isDirectory) {
      items.push({ action: "splitFile", label: t("contextMenu.splitFile") });
    }
    if (enabled("combineFiles") && panelData.mode === "local" && getContextSelection(panel, file).length > 1) {
      items.push({ action: "combineFiles", label: t("contextMenu.combineFiles") });
    }
    if (enabled("rename")) {
      items.push({ action: "rename", label: t("contextMenu.rename"), shortcut: shortcut("F6") });
    }
    if (enabled("delete")) {
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
    onView: () => setQuickViewOpen((v) => !v),
    onEdit: () => setEditorOpen(true),
    onCopy: () => transferFlow.copy(),
    onMove: () => fileActions.rename(),
    onNewFolder: () => fileActions.createFolder(),
    onDelete: () => fileActions.remove(),
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
    onTogglePanel: () => setActivePanel((p) => (p === "left" ? "right" : "left")),
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
              setActivePanel("left");
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
              setActivePanel("right");
              transferFlow.copy();
            }
          }}
          onClose={() => dirCompare.stop()}
        />
      )}

      {/* Dual panel */}
      <div className="flex-1 grid grid-cols-2 gap-0 min-h-0">
        <div className="border-r border-divider p-1.5 min-h-0" onClick={() => setActivePanel("left")}>
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
            onRangeSelect={getLeftSelection().rangeSelect}
            onUpdateLastClicked={getLeftSelection().updateLastClicked}
            onDoubleClick={(file) => handleDoubleClick("left", file)}
            onContextMenu={(event, file) => openSystemContextMenu("left", file, event)}
            onDrop={(fileNames) => transferFlow.dropOnPanel("left", fileNames)}
            panelId="left"
            isFocused={activePanel === "left"}
            compareStatus={dirCompare.isComparing ? dirCompare.result?.statusMap : undefined}
          />
        </div>
        <div className="p-1.5 min-h-0" onClick={() => !quickViewOpen && setActivePanel("right")}>
          {quickViewOpen ? (
            <QuickViewPanel
              filePath={(() => {
                const sel = activeSel.selected;
                if (sel.size === 0) return null;
                const name = Array.from(sel)[0];
                const file = activeFiles.find((f) => f.name === name);
                if (!file || file.isDirectory) return null;
                if (activePanelData.mode === "local" && !getLocalPanelHook(activePanel).isArchiveView) {
                  return `${activePanelData.path}/${name}`;
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
              onRangeSelect={getRightSelection().rangeSelect}
              onUpdateLastClicked={getRightSelection().updateLastClicked}
              onDoubleClick={(file) => handleDoubleClick("right", file)}
              onContextMenu={(event, file) => openSystemContextMenu("right", file, event)}
              onDrop={(fileNames) => transferFlow.dropOnPanel("right", fileNames)}
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
        onEdit={() => setEditorOpen(true)}
        onCopy={() => transferFlow.copy()}
        onMove={() => fileActions.rename()}
        onNewFolder={() => fileActions.createFolder()}
        onDelete={() => fileActions.remove()}
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
          transfers={transfers}
          transferring={transferFlow.isTransferring}
        />
      )}

      {/* Editor */}
      <EditorPanel
        open={editorOpen}
        filePath={(() => {
          if (activePanelData.mode !== "local") return null;
          const sel = activeSel.selected;
          if (sel.size === 0) return null;
          const name = Array.from(sel)[0];
          const file = activeFiles.find((f) => f.name === name);
          if (!file || file.isDirectory) return null;
          return `${activePanelData.path}/${name}`;
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
        onClose={() => setAssistantResult(null)}
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
        onConfirm={fileActions.confirmDelete}
        onCancel={fileActions.cancelAction}
      />
      <ConfirmDialog
        open={!!contextConfirm}
        title={contextConfirm?.title ?? ""}
        message={contextConfirm?.message ?? ""}
        confirmLabel={t("common.delete")}
        danger={contextConfirm?.danger}
        onConfirm={handleContextConfirm}
        onCancel={() => setContextConfirm(null)}
      />

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} theme={themeCtx.theme} onThemeChange={themeCtx.setTheme} />
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
