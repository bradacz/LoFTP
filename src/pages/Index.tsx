import { useState } from "react";
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
import { ContextMenu } from "@/components/ftp/ContextMenu";
import { CompareBar } from "@/components/ftp/CompareBar";
import { SearchDialog } from "@/components/ftp/SearchDialog";
import { QuickViewPanel } from "@/components/ftp/QuickViewPanel";
import { EditorPanel } from "@/components/ftp/EditorPanel";
import { PropertiesDialog } from "@/components/ftp/PropertiesDialog";
import { InputDialog } from "@/components/ftp/InputDialog";
import { ConfirmDialog } from "@/components/ftp/ConfirmDialog";
import { useDirectoryCompare } from "@/hooks/useDirectoryCompare";
import { archiveCreate } from "@/lib/tauri";
import { toast } from "@/components/ui/sonner";
import { useI18n } from "@/i18n";

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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem; panel: "left" | "right" } | null>(null);
  const [archiveCreateRequest, setArchiveCreateRequest] = useState<{ baseDir: string; sourcePaths: string[] } | null>(null);
  const [propsFile, setPropsFile] = useState<{ file: FileItem; path: string } | null>(null);

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
            onContextMenu={(e, file) => setContextMenu({ x: e.clientX, y: e.clientY, file, panel: "left" })}
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
              onContextMenu={(e, file) => setContextMenu({ x: e.clientX, y: e.clientY, file, panel: "right" })}
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

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          panelType={contextMenu.panel === "left" ? (leftMode === "local" ? "local" : "remote") : (rightMode === "local" ? "local" : "remote")}
          onClose={() => setContextMenu(null)}
          onCopyPath={() => {
            const pd = contextMenu.panel === "left" ? leftPanelData : rightPanelData;
            navigator.clipboard.writeText(`${pd.path}/${contextMenu.file.name}`);
          }}
          onCopyName={() => navigator.clipboard.writeText(contextMenu.file.name)}
          onOpenInFinder={() => {
            const pd = contextMenu.panel === "left" ? leftPanelData : rightPanelData;
            if (pd.mode === "local") {
              import("@tauri-apps/plugin-shell").then(({ open }) => {
                open(`${pd.path}/${contextMenu.file.name}`);
              }).catch(() => {});
            }
          }}
          onOpenInVSCode={() => {
            const pd = contextMenu.panel === "left" ? leftPanelData : rightPanelData;
            if (pd.mode === "local") {
              const fullPath = `${pd.path}/${contextMenu.file.name}`;
              import("@tauri-apps/plugin-shell").then(({ open }) => {
                open(`vscode://file${fullPath}`);
              }).catch(() => {});
            }
          }}
          onOpenArchive={() => handleOpenArchive(contextMenu.panel, contextMenu.file.name)}
          canOpenArchive={contextMenu.panel === "left" || contextMenu.panel === "right" ? !!resolveArchivePath(contextMenu.panel, contextMenu.file.name) : false}
          onCreateArchive={() => handleCreateArchiveRequest(
            contextMenu.panel,
            getPanelData(contextMenu.panel).selection.selected.has(contextMenu.file.name)
              ? undefined
              : [contextMenu.file.name]
          )}
          canCreateArchive={getPanelData(contextMenu.panel).mode === "local" && contextMenu.file.name !== ".."}
          onProperties={() => {
            const pd = contextMenu.panel === "left" ? leftPanelData : rightPanelData;
            setPropsFile({ file: contextMenu.file, path: `${pd.path}/${contextMenu.file.name}` });
          }}
          onRename={() => fileActions.rename()}
          onDelete={() => fileActions.remove()}
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
      <ConfirmDialog
        open={fileActions.pendingAction?.type === "delete"}
        title={t("dialogs.deleteTitle")}
        message={t("dialogs.deleteMessage", { count: fileActions.pendingAction?.type === "delete" ? fileActions.pendingAction.count : 0 })}
        confirmLabel={t("common.delete")}
        danger
        onConfirm={fileActions.confirmDelete}
        onCancel={fileActions.cancelAction}
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
