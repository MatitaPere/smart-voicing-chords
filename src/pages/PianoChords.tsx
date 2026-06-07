import React, { useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Piano, Star, FileText, Plus, Trash2, X, Printer, Volume2, Settings2, Sun, Moon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFavorites } from "@/hooks/useFavorites";
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

interface SheetEntry { chord: PianoChord; voicingIdx: number; }

const PianoChords = () => {
  const [query, setQuery] = useState("");
  const [activeRoot, setActiveRoot] = useState<string | null>(null);
  const [activeSuffix, setActiveSuffix] = useState<string | null>(null);
  const [expandedChordId, setExpandedChordId] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sheetEntries, setSheetEntries] = useState<SheetEntry[]>([]);
  const [showSheet, setShowSheet] = useState(false);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const { theme } = useTheme();
  const allChords = useMemo(() => getAllPianoChords(), []);

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

  const addToSheet = useCallback((chord: PianoChord, voicingIdx: number) => {
    setSheetEntries(prev => [...prev, { chord, voicingIdx }]);
  }, []);

  const removeFromSheet = useCallback((i: number) => {
    setSheetEntries(prev => prev.filter((_, idx) => idx !== i));
  }, []);

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
                <button
                  onClick={() => setShowSheet(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Sheet ({sheetEntries.length})
                </button>
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
      {showSheet && createPortal(
        <PianoSheetOverlay
          entries={sheetEntries}
          onRemove={removeFromSheet}
          onClose={() => setShowSheet(false)}
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
  onClose,
}: {
  entries: SheetEntry[];
  onRemove: (i: number) => void;
  onClose: () => void;
}) {
  function handlePrint() {
    window.print();
  }

  return (
    <div id="piano-sheet-overlay" className="piano-sheet-overlay fixed inset-0 z-[60] bg-background flex flex-col">
      {/* Header — hidden during print */}
      <div className="piano-sheet-no-print sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-foreground flex-1">Reference Sheet</h2>
        <button
          onClick={handlePrint}
          disabled={entries.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Sheet content */}
      <div className="flex-1 overflow-y-auto p-6 piano-sheet-content">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
            <Piano className="w-10 h-10 opacity-30" />
            <p>No chords added yet.</p>
            <p className="text-xs opacity-60">Go back and click "Add to Sheet" on any voicing.</p>
          </div>
        ) : (
          <>
            {/* Print title — visible only during print */}
            <h1 className="piano-sheet-print-title hidden text-2xl font-bold text-black mb-6">Piano Chord Reference Sheet</h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 piano-sheet-grid">
              {entries.map((entry, i) => {
                const noteNames = getVoicingNoteNames(
                  entry.chord.key,
                  entry.chord.suffix,
                  entry.chord.voicings[entry.voicingIdx].notes
                );
                return (
                  <div key={i} className="piano-sheet-card relative flex flex-col items-center gap-2 p-3 bg-card rounded-xl border border-border/40">
                    {/* Remove button — hidden during print */}
                    <button
                      onClick={() => onRemove(i)}
                      className="piano-sheet-no-print absolute top-2 right-2 w-5 h-5 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center hover:bg-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <p className="text-base font-bold text-foreground piano-sheet-label">{entry.chord.label}</p>
                    <p className="text-[10px] text-muted-foreground piano-sheet-sublabel">{entry.chord.voicings[entry.voicingIdx].name}</p>
                    <div className="w-full max-w-[160px]">
                      <PianoDiagram voicing={entry.chord.voicings[entry.voicingIdx]} size="lg" noteLabels={noteNames} />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">{noteNames.join(" · ")}</p>
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
