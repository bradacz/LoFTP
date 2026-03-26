import { useEffect, useCallback } from "react";

interface ShortcutActions {
  onView: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onMove: () => void;
  onNewFolder: () => void;
  onDelete: () => void;
  onSearch: () => void;
  onRefresh: () => void;
  onSelectAll: () => void;
  onInvertSelection: () => void;
  onTogglePanel: () => void;
  onNavigateUp: () => void;
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if inside input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key;
      const ctrl = e.ctrlKey || e.metaKey;
      const alt = e.altKey;

      switch (true) {
        case key === "F3":
          e.preventDefault();
          actions.onView();
          break;
        case key === "F4":
          e.preventDefault();
          actions.onEdit();
          break;
        case key === "F5":
          e.preventDefault();
          actions.onCopy();
          break;
        case key === "F6":
          e.preventDefault();
          actions.onMove();
          break;
        case alt && key === "F7":
          e.preventDefault();
          actions.onSearch();
          break;
        case key === "F7":
          e.preventDefault();
          actions.onNewFolder();
          break;
        case key === "F8" || key === "Delete":
          e.preventDefault();
          actions.onDelete();
          break;
        case ctrl && key === "r":
          e.preventDefault();
          actions.onRefresh();
          break;
        case ctrl && key === "a":
          e.preventDefault();
          actions.onSelectAll();
          break;
        case key === "*":
          // Numpad * for invert selection
          actions.onInvertSelection();
          break;
        case key === "Tab":
          e.preventDefault();
          actions.onTogglePanel();
          break;
        case key === "Backspace":
          e.preventDefault();
          actions.onNavigateUp();
          break;
      }
    },
    [actions]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
