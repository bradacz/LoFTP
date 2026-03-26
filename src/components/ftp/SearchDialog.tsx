import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, File, Folder } from "lucide-react";
import { fsSearch, SearchResult } from "@/lib/tauri";
import { useI18n } from "@/i18n";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  searchPath: string;
  onNavigateToFile: (path: string) => void;
}

export function SearchDialog({ open, onClose, searchPath, onNavigateToFile }: SearchDialogProps) {
  const { t } = useI18n();
  const [namePattern, setNamePattern] = useState("*");
  const [contentPattern, setContentPattern] = useState("");
  const [recursive, setRecursive] = useState(true);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    setSearched(false);
    try {
      const res = await fsSearch(searchPath, {
        namePattern,
        contentPattern: contentPattern || undefined,
        recursive,
        caseSensitive,
      });
      setResults(res);
      setSearched(true);
    } catch (e) {
      console.error("Search failed:", e);
    } finally {
      setSearching(false);
    }
  };

  const handleGoToFile = (result: SearchResult) => {
    // Navigate to parent directory of the found file
    const parentDir = result.path.substring(0, result.path.lastIndexOf("/"));
    onNavigateToFile(parentDir);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            {t("search.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">{t("search.searchIn")} <span className="font-mono text-foreground">{searchPath}</span></Label>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">{t("search.fileName")}</Label>
            <Input
              value={namePattern}
              onChange={(e) => setNamePattern(e.target.value)}
              placeholder="*.tsx, config*, *.json"
              className="h-8 text-sm font-mono"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">{t("search.containingText")}</Label>
            <Input
              value={contentPattern}
              onChange={(e) => setContentPattern(e.target.value)}
              placeholder="useState, className..."
              className="h-8 text-sm font-mono"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <div className="flex gap-4 text-xs text-muted-foreground">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={recursive} onChange={(e) => setRecursive(e.target.checked)} className="rounded" />
              {t("search.subfolders")}
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} className="rounded" />
              {t("search.caseSensitive")}
            </label>
          </div>

          <Button onClick={handleSearch} disabled={searching} size="sm" className="gap-1.5">
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            {searching ? t("search.searching") : t("search.search")}
          </Button>
        </div>

        {/* Results */}
        {searched && (
          <div className="flex-1 min-h-0 border-t border-border pt-2">
            <div className="text-xs text-muted-foreground mb-2">
              {t("search.found")} {results.length} {t("search.results")}{results.length >= 1000 ? " (limit)" : ""}
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-0.5">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleGoToFile(r)}
                  className="w-full text-left flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-file-hover transition-colors"
                >
                  {r.isDirectory ? (
                    <Folder className="h-3.5 w-3.5 text-folder shrink-0" />
                  ) : (
                    <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-mono truncate text-foreground">{r.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{r.path}</div>
                    {r.matchLine && (
                      <div className="text-[10px] text-primary truncate mt-0.5">{r.matchLine}</div>
                    )}
                  </div>
                  <span className="text-muted-foreground text-[10px] shrink-0">
                    {r.isDirectory ? t("common.dir") : formatSearchSize(r.size)}
                  </span>
                </button>
              ))}
              {results.length === 0 && (
                <div className="text-center text-muted-foreground py-4 text-xs">
                  {t("search.noResults")}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>{t("common.close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatSearchSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
