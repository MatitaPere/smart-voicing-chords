import React, { useMemo, useState, useCallback, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Piano, Star, FileText, Plus, Trash2, X, Printer, Volume2, Settings2, Sun, Moon, Save, FolderOpen, Download, Upload } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFavorites } from "@/hooks/useFavorites";
import PianoVoicingCreator from "@/components/PianoVoicingCreator";
import { usePianoPlayer } from "@/hooks/usePianoPlayer";
import { useTheme, setTheme } from "@/hooks/useTheme";
import type { ThemeMode, ThemeAccent } from "@/hooks/useTheme";
import {
  getAllPianoChords, searchPianoChords,
  pianoRootNotes, pianoSuffixes, pianoSuffixLabels,
} from "@/data/pianoChords";
import type { PianoChord } from "@/data/pianoChords";
import PianoDiagram from "@/components/PianoDiagram";
import { getVoicingNoteNames } from "@/lib/music";

interface SheetEntry { type: "chord"; chord: PianoChord; voicingIdx: number; }

interface SavedSheet {
  id: string;
  name: string;
  createdAt: string;
  source: "piano";
  entries: { type?: string; label?: string; chordKey?: string; suffix?: string; voicingIndex?: number }[];
}

const SHEETS_KEY = "piano-saved-sheets";

function getSavedSheets(): SavedSheet[] {
  try {
    const data = localStorage.getItem(SHEETS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveSheetToStorage(sheet: SavedSheet) {
  const existing = getSavedSheets();
  existing.push(sheet);
  localStorage.setItem(SHEETS_KEY, JSON.stringify(existing));
}

function normalizeSheetEntry(entry: SheetEntry): { type?: string; label?: string; chordKey?: string; suffix?: string; voicingIndex?: number } {
  return {
    type: "chord",
    label: entry.chord.label,
    chordKey: entry.chord.key,
    suffix: entry.chord.suffix,
    voicingIndex: entry.voicingIdx,
  };
}

function deleteSheetFromStorage(id: string) {
  const existing = getSavedSheets();
  const filtered = existing.filter(s => s.id !== id);
  localStorage.setItem(SHEETS_KEY, JSON.stringify(filtered));
}

const PianoChords = () => {
  const [query, setQuery] = useState("");
  const [activeRoot, setActiveRoot] = useState<string | null>(null);
  const [activeSuffix, setActiveSuffix] = useState<string | null>(null);
  const [expandedChordId, setExpandedChordId] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sheetEntries, setSheetEntries] = useState<SheetEntry[]>(() => {
    try {
      const saved = sessionStorage.getItem("piano-sheet-entries");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showSheet, setShowSheet] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const { theme } = useTheme();
  const allChords = useMemo(() => getAllPianoChords(), [refreshKey]);

  // Persist sheet entries to sessionStorage
  React.useEffect(() => {
    try {
      if (sheetEntries.length > 0) {
        sessionStorage.setItem("piano-sheet-entries", JSON.stringify(sheetEntries));
      } else {
        sessionStorage.removeItem("piano-sheet-entries");
      }
    } catch {}
  }, [sheetEntries]);

  const filteredChords = useMemo(() => {
    let results = query ? searchPianoChords(query) : allChords;
    if (activeRoot) results = results.filter(c => c.key === activeRoot);
    if (activeSuffix) results = results.filter(c => c.suffix === activeSuffix);
    if (showFavoritesOnly) results = results.filter(c => favorites.has(`${c.key}-${c.suffix}`));
    return results;
  }, [query, activeRoot, activeSuffix, allChords, showFavoritesOnly, favorites]);

  const chordRows = useMemo(() => {
    const cols = window.innerWidth >= 640 ? 5 : 4;
    const rows: PianoChord[][] = [];
    for (let i = 0; i < filteredChords.length; i += cols) {
      rows.push(filteredChords.slice(i, i + cols));
    }
    return rows;
  }, [filteredChords]);

  const expandedChord = expandedChordId
    ? allChords.find(c => `${c.key}-${c.suffix}` === expandedChordId) ?? null
    : null;

  const [saveSheetName, setSaveSheetName] = useState("");
  const [savedSheets, setSavedSheets] = useState<SavedSheet[]>([]);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const addToSheet = useCallback((chord: PianoChord, voicingIdx: number) => {
    setSheetEntries(prev => [...prev, { type: "chord" as const, chord, voicingIdx }]);
  }, []);

  const removeFromSheet = useCallback((i: number) => {
    setSheetEntries(prev => prev.filter((_, idx) => idx !== i));
  }, []);

  function handleOpenLoadDialog() {
    setSavedSheets(getSavedSheets());
    setShowLoadDialog(true);
  }

  function handleReorderEntries(newOrder: SheetEntry[]) {
    setSheetEntries(newOrder);
  }



  function handleSaveSheet() {
    if (!saveSheetName.trim() || sheetEntries.length === 0) return;
    const now = new Date().toISOString();
    saveSheetToStorage({
      id: now,
      name: saveSheetName.trim(),
      createdAt: now,
      source: "piano",
      entries: sheetEntries.map(normalizeSheetEntry),
    });
    setSaveSheetName("");
    setShowSaveDialog(false);
  }

  function handleLoadSheet(sheet: SavedSheet) {
    setSheetEntries(
      sheet.entries.map(e => {
        const chord = allChords.find(c => c.key === e.chordKey && c.suffix === e.suffix);
        return chord
          ? { type: "chord" as const, chord, voicingIdx: e.voicingIndex ?? 0 }
          : { type: "chord" as const, chord: { key: e.chordKey || "", suffix: e.suffix || "", label: e.label || "", voicings: [] }, voicingIdx: 0 };
      })
    );
    setRefreshCounter(c => c + 1);
    setShowLoadDialog(false);
  }

  function handleDeleteSheet(id: string) {
    deleteSheetFromStorage(id);
    setSavedSheets(prev => prev.filter(s => s.id !== id));
  }

  function handleExportSheet() {
    if (sheetEntries.length === 0) return;
    const exportData = {
      source: "piano" as const,
      entries: sheetEntries.map(normalizeSheetEntry),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `piano-sheet-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

    function handleImportSheet(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.entries && Array.isArray(data.entries)) {
          setSheetEntries(
            data.entries.map((entry: any) => {
              const chord = allChords.find((c: PianoChord) => c.key === entry.chordKey && c.suffix === entry.suffix);
              return chord
                ? { type: "chord" as const, chord, voicingIdx: entry.voicingIndex ?? 0 }
                : { type: "chord" as const, chord: { key: entry.chordKey, suffix: entry.suffix, label: entry.label, voicings: [] }, voicingIdx: 0 };
            })
          );
          setRefreshCounter(c => c + 1);
        }
      } catch {}
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="min-h-screen bg-background lg:flex lg:h-screen lg:overflow-hidden">
      {/* Left column */}
      <div className="lg:flex-1 lg:overflow-y-auto lg:min-w-0">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Piano className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-semibold tracking-tighter text-foreground">
              Piano Chords
            </h1>
            <div className="ml-auto flex items-center gap-2">
              {sheetEntries.length > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowSheet(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Sheet ({sheetEntries.length})
                  </button>
                  <div className="flex">
                    <button
                      onClick={() => { setShowSaveDialog(true); setSaveSheetName(""); }}
                      className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title="Save this progression"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleOpenLoadDialog}
                      className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title="Load saved progression"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={() => { setShowFavoritesOnly(p => !p); setExpandedChordId(null); }}
                className={`p-2 rounded-xl transition-colors ${
                  showFavoritesOnly
                    ? "bg-yellow-400/20 text-yellow-400"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
                title="Favorites"
              >
                <Star className={`w-4 h-4 ${showFavoritesOnly ? "fill-yellow-400" : ""}`} />
              </button>
              <button
                onClick={() => setShowCreator(true)}
                className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Create voicing"
              >
                <Plus className="w-4 h-4" />
              </button>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title="Settings"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 space-y-4" align="end">
                  {/* Theme */}
                  <div>
                    <span className="text-xs font-semibold text-foreground block mb-2">Theme</span>
                    {/* Mode */}
                    <div className="flex gap-1 mb-2">
                      {([
                        { id: "dark",  icon: <Moon className="w-3 h-3" />, label: "Dark"  },
                        { id: "mid",   icon: <Moon className="w-3 h-3 opacity-50" />, label: "Dim" },
                        { id: "light", icon: <Sun  className="w-3 h-3" />, label: "Light" },
                      ] as { id: ThemeMode; icon: React.ReactNode; label: string }[]).map(m => (
                        <button
                          key={m.id}
                          onClick={() => setTheme({ mode: m.id })}
                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            theme.mode === m.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {m.icon}{m.label}
                        </button>
                      ))}
                    </div>
                    {/* Accent swatches */}
                    <div className="flex gap-1.5">
                      {([
                        { id: "blue",   color: "bg-blue-500" },
                        { id: "purple", color: "bg-purple-500" },
                        { id: "green",  color: "bg-green-500" },
                        { id: "amber",  color: "bg-amber-400" },
                      ] as { id: ThemeAccent; color: string }[]).map(({ id, color }) => (
                        <button
                          key={id}
                          onClick={() => setTheme({ accent: id })}
                          className={`w-7 h-7 rounded-full ${color} transition-all ${
                            theme.accent === id ? "ring-2 ring-offset-2 ring-offset-popover ring-foreground scale-110" : "opacity-70 hover:opacity-100"
                          }`}
                          title={id}
                        />
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setExpandedChordId(null); }}
              onFocus={() => setExpandedChordId(null)}
              placeholder="Search chords… e.g. Am7, C#m"
              className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl text-foreground placeholder:text-muted-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pb-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {pianoRootNotes.map(root => (
              <button
                key={root}
                onClick={() => { setActiveRoot(prev => prev === root ? null : root); setExpandedChordId(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeRoot === root
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {root}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {pianoSuffixes.map(s => (
              <button
                key={s}
                onClick={() => { setActiveSuffix(prev => prev === s ? null : s); setExpandedChordId(null); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  activeSuffix === s
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {pianoSuffixLabels[s] || s}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 lg:max-w-none">
        {chordRows.map((row, rowIdx) => (
          <div key={rowIdx}>
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 mb-2">
              {row.map(chord => {
                const id = `${chord.key}-${chord.suffix}`;
                const isExpanded = expandedChordId === id;
                const fav = isFavorite(id);
                return (
                  <div key={id} className="relative group">
                    <button
                      onClick={() => setExpandedChordId(prev => prev === id ? null : id)}
                      className={`w-full p-2.5 rounded-xl text-center transition-all ${
                        isExpanded
                          ? "bg-primary text-primary-foreground ring-2 ring-primary shadow-lg scale-105"
                          : "bg-card hover:bg-surface-elevated border border-border/30"
                      }`}
                    >
                      <p className={`text-base font-bold ${isExpanded ? "" : "text-foreground"}`}>{chord.label}</p>
                      <p className={`text-[10px] mt-0.5 ${isExpanded ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {chord.voicings.length} voicing{chord.voicings.length !== 1 ? "s" : ""}
                      </p>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); toggleFavorite(id); }}
                      className={`absolute top-1 right-1 p-0.5 rounded transition-opacity ${
                        fav ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                      }`}
                      title={fav ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star className={`w-3 h-3 ${fav ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="lg:hidden">
            <AnimatePresence mode="wait">
              {row.some(c => `${c.key}-${c.suffix}` === expandedChordId) && (() => {
                const chord = row.find(c => `${c.key}-${c.suffix}` === expandedChordId)!;
                return (
                  <motion.div
                    key={expandedChordId}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mb-2"
                  >
                    <InlinePianoVoicingPanel chord={chord} onAddToSheet={addToSheet} />
                  </motion.div>
                );
              })()}
            </AnimatePresence>
            </div>
          </div>
        ))}

        {filteredChords.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <p className="text-muted-foreground text-sm">No chords found</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Try a different search</p>
          </motion.div>
        )}

        <div className="h-20" />
      </main>
      </div>{/* end left column */}

      {/* Right panel — desktop only */}
      <div className="hidden lg:flex lg:flex-col lg:w-[420px] lg:flex-shrink-0 lg:border-l lg:border-border/50 lg:h-screen">
        <div className="p-4 flex-shrink-0 bg-background/80 backdrop-blur-md border-b border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {expandedChord ? expandedChord.label : "Select a chord"}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {expandedChord ? (
            <InlinePianoVoicingPanel chord={expandedChord} onAddToSheet={addToSheet} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground/50 gap-2 mt-16">
              <Piano className="w-10 h-10" />
              <p className="text-sm">Click any chord to see voicings</p>
            </div>
          )}
        </div>
      </div>

      {/* PDF Sheet overlay */}
      <AnimatePresence>
        {showCreator && (
          <PianoVoicingCreator
            onClose={() => setShowCreator(false)}
            onSaved={() => setRefreshKey(k => k + 1)}
          />
        )}
      </AnimatePresence>

      {/* Save sheet dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSaveDialog(false)}>
          <div className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Save Sheet</h3>
            <input
              type="text"
              value={saveSheetName}
              onChange={e => setSaveSheetName(e.target.value)}
              placeholder="Sheet name (e.g. Jazz Voicings)"
              className="w-full px-3 py-2 bg-surface rounded-xl text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 mb-4"
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSaveSheet(); } }}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowSaveDialog(false)} className="flex-1 py-2 rounded-xl bg-secondary text-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSaveSheet}
                disabled={!saveSheetName.trim() || sheetEntries.length === 0}
                className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load sheet dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowLoadDialog(false)}>
          <div className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-sm max-h-[70vh] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Load Sheet</h3>
              <label className="cursor-pointer p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Import from file">
                <Upload className="w-4 h-4" />
                <input type="file" accept=".json" onChange={handleImportSheet} className="hidden" />
              </label>
            </div>
            {savedSheets.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <p>No saved sheets yet.</p>
                <p className="text-xs mt-1">Use the Save button to save your current sheet.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2">
                {[...savedSheets].reverse().map(sheet => (
                  <div key={sheet.id} className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                    <button onClick={() => handleLoadSheet(sheet)} className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{sheet.name}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(sheet.createdAt).toLocaleDateString()} · {sheet.entries.length} chord{sheet.entries.length !== 1 ? "s" : ""}</p>
                    </button>
                    <button onClick={() => handleDeleteSheet(sheet.id)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowLoadDialog(false)} className="w-full mt-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {showSheet && createPortal(
        <PianoSheetOverlay
          key={"piano-sheet-overlay-" + refreshCounter}
          entries={sheetEntries}
          onRemove={removeFromSheet}
          onReorder={handleReorderEntries}
          onClose={() => setShowSheet(false)}
          handleOpenLoadDialog={handleOpenLoadDialog}
          handleExportSheet={handleExportSheet}
          setShowSaveDialog={setShowSaveDialog}
          setSaveSheetName={setSaveSheetName}
          handleImportSheet={handleImportSheet}
        />,
        document.body
      )}
    </div>
  );
};

// ── Voicing panel ──────────────────────────────────────────────────────────────

function InlinePianoVoicingPanel({
  chord,
  onAddToSheet,
}: {
  chord: PianoChord;
  onAddToSheet: (chord: PianoChord, voicingIdx: number) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const { playChord } = usePianoPlayer();

  const noteNames = useMemo(
    () => getVoicingNoteNames(chord.key, chord.suffix, chord.voicings[activeIdx].notes),
    [activeIdx, chord.key, chord.suffix, chord.voicings],
  );

  function handleAddToSheet() {
    onAddToSheet(chord, activeIdx);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="bg-secondary/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-bold text-foreground">{chord.label}</span>
        <span className="text-[10px] text-muted-foreground">
          {chord.voicings.length} voicing{chord.voicings.length !== 1 ? "s" : ""}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => playChord(chord.voicings[activeIdx])}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
          >
            <Volume2 className="w-3 h-3" />
            Play
          </button>
          <button
            onClick={handleAddToSheet}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              added
                ? "bg-green-500/20 text-green-400"
                : "bg-primary/20 text-primary hover:bg-primary/30"
            }`}
          >
            <Plus className="w-3 h-3" />
            {added ? "Added!" : "Add to Sheet"}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="flex justify-center mb-3"
          onClick={() => playChord(chord.voicings[activeIdx])}
          style={{ cursor: "pointer" }}
          title="Tap to play"
        >
          <PianoDiagram voicing={chord.voicings[activeIdx]} size="lg" noteLabels={noteNames} />
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-center gap-3 mb-3">
        <p className="text-xs text-muted-foreground font-mono tracking-wide">
          {noteNames.join(" · ")}
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {chord.voicings.map((v, i) => (
          <button
            key={i}
            onClick={() => { setActiveIdx(i); playChord(v); }}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors flex-shrink-0 ${
              i === activeIdx
                ? "bg-primary/10 ring-1 ring-primary/30"
                : "hover:bg-secondary/50"
            }`}
          >
            <div className="w-[80px]">
              <PianoDiagram voicing={v} size="sm" noteLabels={getVoicingNoteNames(chord.key, chord.suffix, v.notes)} />
            </div>
            <span className="text-[9px] text-muted-foreground mt-1">{v.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── PDF Sheet overlay ──────────────────────────────────────────────────────────

function PianoSheetOverlay({
  entries,
  onRemove,
  onReorder,
  onClose,
  handleOpenLoadDialog,
  handleExportSheet,
  setShowSaveDialog,
  setSaveSheetName,
  handleImportSheet,
}: {
  entries: SheetEntry[];
  onRemove: (i: number) => void;
  onReorder: (newOrder: SheetEntry[]) => void;
  onClose: () => void;
  handleOpenLoadDialog: () => void;
  handleExportSheet: () => void;
  setShowSaveDialog: (v: boolean) => void;
  setSaveSheetName: (v: string) => void;
  handleImportSheet: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  const [localEntries, setLocalEntries] = useState<SheetEntry[]>(entries);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Initialize from props on mount only
  const initialSyncDone = React.useRef(false);
  React.useEffect(() => {
    if (!initialSyncDone.current) {
      setLocalEntries(entries);
      initialSyncDone.current = true;
    }
  }, []);

  function handlePrint() {
    window.print();
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDragEnd() {
    setDragIndex(null);
  }

  function handleDrop(e: React.DragEvent, toIdx: number) {
    e.preventDefault();
    const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(fromIdx) || fromIdx === toIdx) return;
    const newOrder = [...localEntries];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    setLocalEntries(newOrder);
    onReorder(newOrder);
    setDragIndex(null);
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* Header — hidden during print */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-2 piano-sheet-no-print">
        <button onClick={onClose} className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground shrink-0">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-foreground flex-1 min-w-0 truncate">Reference Sheet</h2>
        <div className="flex items-center gap-1.5 shrink-0">
          {entries.length > 0 && (
            <>
              <button
                onClick={() => { setShowSaveDialog(true); setSaveSheetName(""); }}
                className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Save sheet"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={handleExportSheet}
                className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Export to file"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={handleOpenLoadDialog}
            className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Load saved sheet"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrint}
            disabled={entries.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Sheet content */}
      <div className="flex-1 overflow-y-auto p-3">
        {localEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
            <Piano className="w-10 h-10 opacity-30" />
            <p>No chords added yet.</p>
            <p className="text-xs opacity-60">Go back and click "Add to Sheet" on any voicing.</p>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-bold text-foreground mb-2 piano-sheet-print-title">Piano Chord Reference Sheet</h1>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-1.5">
              {localEntries.map((entry, i) => {
                const chord = entry.chord;
                const noteNames = getVoicingNoteNames(chord.key, chord.suffix, chord.voicings[entry.voicingIdx]?.notes || []);
                return (
                  <div
                    key={i}
                    className="relative flex flex-col items-center bg-card rounded-lg border border-border/30 p-1.5"
                    draggable
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={(e) => handleDrop(e, i)}
                    onDragEnd={handleDragEnd}
                    style={{ opacity: dragIndex === i ? 0.3 : 1, cursor: "grab" }}
                  >
                    <button
                      onClick={() => onRemove(i)}
                      className="piano-sheet-no-print absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center hover:bg-destructive transition-colors z-10"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                    <PianoDiagram voicing={chord.voicings[entry.voicingIdx]} size="sm" noteLabels={noteNames} />
                    <p className="text-[10px] font-semibold text-foreground text-center leading-tight mt-0.5">{chord.label}</p>
                    <p className="text-[8px] text-muted-foreground font-mono text-center leading-tight">{noteNames.join("·")}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
export default PianoChords;