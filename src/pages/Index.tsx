import React, { useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Guitar, Plus, Volume2, Settings2, Star, Timer, Sun, Moon, FileText, Trash2, X, Printer, Save, FolderOpen, Download, Upload } from "lucide-react";
import { getAllChordsWithCustom, searchChords, rootNotes, suffixes, suffixLabels, suffixDescriptions } from "@/data/chords";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Chord } from "@/data/chords";
import ChordDiagram from "@/components/ChordDiagram";
import VoicingCreator from "@/components/VoicingCreator";
import { useChordPlayer } from "@/hooks/useChordPlayer";
import { useAudioSettings } from "@/hooks/useAudioSettings";
import type { Tone, Instrument } from "@/hooks/useAudioSettings";
import { useFavorites } from "@/hooks/useFavorites";
import { useLeftHanded, setLeftHanded } from "@/hooks/useLeftHanded";
import { useRecentChords } from "@/hooks/useRecentChords";
import { useTheme, setTheme } from "@/hooks/useTheme";
import type { ThemeMode, ThemeAccent } from "@/hooks/useTheme";
import { SCALE_INTERVALS, SCALE_LABELS, chordFitsScale, getChordInScales } from "@/lib/scales";
import { getSubstitutions } from "@/lib/substitutions";
import FretboardMap from "@/components/FretboardMap";
import TuningReference from "@/components/TuningReference";
import PracticeTimer from "@/components/PracticeTimer";

const Index = () => {
  const [query, setQuery] = useState("");
  const [activeRoot, setActiveRoot] = useState<string | null>(null);
  const [activeSuffix, setActiveSuffix] = useState<string | null>(null);
  const [expandedChordId, setExpandedChordId] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [capoFret, setCapoFret] = useState(0);
  const [scaleKey, setScaleKey] = useState<string | null>(null);
  const [scaleType, setScaleType] = useState("major");
  const [showScaleFilter, setShowScaleFilter] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { settings, setAudioSettings } = useAudioSettings();
  const { playChord } = useChordPlayer();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { leftHanded } = useLeftHanded();
  const { theme } = useTheme();
  const { recent, addRecent, clearRecent } = useRecentChords();
  const [showTimer, setShowTimer] = useState(false);

  // Transpose a root note up by N semitones (for capo display)
  const transposeNote = (note: string, semitones: number): string => {
    const idx = rootNotes.indexOf(note);
    if (idx === -1) return note;
    return rootNotes[((idx + semitones) % 12 + 12) % 12];
  };

  const capoLabel = (chord: Chord): string | null => {
    if (capoFret === 0) return null;
    return transposeNote(chord.key, capoFret) + chord.suffix;
  };

  const allChords = useMemo(() => getAllChordsWithCustom(), [refreshKey]);

  const filteredChords = useMemo(() => {
    let results = query ? searchChords(query) : allChords;
    if (query) {
      const q = query.toLowerCase().trim();
      const customFiltered = allChords.filter(c =>
        c.label.toLowerCase().includes(q) ||
        c.key.toLowerCase().includes(q) ||
        `${c.key}${c.suffix}`.toLowerCase().includes(q)
      );
      const ids = new Set(results.map(c => `${c.key}-${c.suffix}`));
      for (const c of customFiltered) {
        if (!ids.has(`${c.key}-${c.suffix}`)) {
          results.push(c);
        }
      }
    } else {
      results = allChords;
    }
    if (activeRoot) {
      results = results.filter(c => c.key === activeRoot);
    }
    if (activeSuffix) {
      results = results.filter(c => c.suffix === activeSuffix);
    }
    if (showFavoritesOnly) {
      results = results.filter(c => favorites.has(`${c.key}-${c.suffix}`));
    }
    return results;
  }, [query, activeRoot, activeSuffix, allChords, showFavoritesOnly, favorites]);

  // Group chords into rows for inline expansion
  const chordRows = useMemo(() => {
    const cols = window.innerWidth >= 640 ? 5 : 4;
    const rows: Chord[][] = [];
    for (let i = 0; i < filteredChords.length; i += cols) {
      rows.push(filteredChords.slice(i, i + cols));
    }
    return rows;
  }, [filteredChords]);

  const handleRootClick = (root: string) => {
    setActiveRoot(prev => prev === root ? null : root);
    setExpandedChordId(null);
  };

  const handleSuffixClick = (suffix: string) => {
    setActiveSuffix(prev => prev === suffix ? null : suffix);
    setExpandedChordId(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setExpandedChordId(null);
  };

  const handleChordSelect = (chord: Chord) => {
    const id = `${chord.key}-${chord.suffix}`;
    setExpandedChordId(prev => prev === id ? null : id);
    addRecent({ chordKey: chord.key, suffix: chord.suffix, label: chord.label });
  };

  const handleVoicingSaved = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const expandedChord = expandedChordId
    ? allChords.find(c => `${c.key}-${c.suffix}` === expandedChordId) ?? null
    : null;

  interface SheetChordEntry { type: "chord"; chord: Chord; voicingIdx: number; }
  interface SheetSectionHeader { type: "section"; id: string; label: string; }
  type SheetEntry = SheetChordEntry | SheetSectionHeader;

interface SavedSheet {
  id: string;
  name: string;
  createdAt: string;
  source: "guitar";
  entries: { type?: string; label?: string; chordKey?: string; suffix?: string; voicingIndex?: number; id?: string }[];
}

const SHEETS_KEY = "guitar-saved-sheets";

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

function normalizeSheetEntry(entry: SheetEntry): { type?: string; label?: string; chordKey?: string; suffix?: string; voicingIndex?: number; id?: string } {
  if (entry.type === "section") {
    return { type: "section", id: entry.id, label: entry.label };
  }
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
  const [sheetEntries, setSheetEntries] = useState<SheetEntry[]>(() => {
    try {
      const saved = sessionStorage.getItem("guitar-sheet-entries");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showSheet, setShowSheet] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveSheetName, setSaveSheetName] = useState("");
  const [savedSheets, setSavedSheets] = useState<SavedSheet[]>([]);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Persist sheet entries to sessionStorage
  React.useEffect(() => {
    try {
      if (sheetEntries.length > 0) {
        sessionStorage.setItem("guitar-sheet-entries", JSON.stringify(sheetEntries));
      } else {
        sessionStorage.removeItem("guitar-sheet-entries");
      }
    } catch {}
  }, [sheetEntries]);

  const addToSheet = useCallback((chord: Chord, voicingIdx: number) => {
    setSheetEntries(prev => [...prev, { type: "chord" as const, chord, voicingIdx } as SheetChordEntry]);
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
      source: "guitar",
      entries: sheetEntries.map(normalizeSheetEntry),
    });
    setSaveSheetName("");
    setShowSaveDialog(false);
  }

  function handleLoadSheet(sheet: SavedSheet) {
    setSheetEntries(
      sheet.entries.map(e => {
        if (e.type === "section") {
          return { type: "section" as const, id: e.id || Date.now().toString() + Math.random(), label: e.label || "Section" };
        }
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
      source: "guitar" as const,
      entries: sheetEntries.map(normalizeSheetEntry),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guitar-sheet-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportSheet(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.entries && Array.isArray(data.entries)) {
          setSheetEntries(
            data.entries.map((entry: any) => {
              if (entry.type === "section") {
                return { type: "section" as const, id: entry.id || Date.now().toString() + Math.random(), label: entry.label || "Section" };
              }
              const chord = allChords.find((c: Chord) => c.key === entry.chordKey && c.suffix === entry.suffix);
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
      {/* Left column: header + grid */}
      <div className="lg:flex-1 lg:overflow-y-auto lg:min-w-0">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Guitar className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-semibold tracking-tighter text-foreground">
              Chord Library
            </h1>
            <div className="ml-auto flex items-center gap-2">
              {/* Audio settings */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Audio settings">
                    <Settings2 className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-4 space-y-4">
                  {/* Volume */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground">Volume</span>
                      <span className="text-xs text-muted-foreground">{Math.round(settings.volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={settings.volume}
                      onChange={e => setAudioSettings({ volume: parseFloat(e.target.value) })}
                      className="w-full accent-primary"
                    />
                  </div>
                  {/* Instrument */}
                  <div>
                    <span className="text-xs font-semibold text-foreground block mb-2">Instrument</span>
                    <div className="grid grid-cols-2 gap-1">
                      {([
                        { value: "guitar", label: "Guitar" },
                        { value: "organ",  label: "Organ"  },
                        { value: "pad",    label: "Synth Pad" },
                        { value: "piano",  label: "Grand Piano" },
                      ] as { value: Instrument; label: string }[]).map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setAudioSettings({ instrument: value })}
                          className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            settings.instrument === value
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Tone — guitar only */}
                  {settings.instrument === "guitar" && (
                  <div>
                    <span className="text-xs font-semibold text-foreground block mb-2">Tone</span>
                    <div className="flex gap-1">
                      {(["soft", "medium", "bright"] as Tone[]).map(t => (
                        <button
                          key={t}
                          onClick={() => setAudioSettings({ tone: t })}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                            settings.tone === t
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  )}
                  {/* Capo */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground">Capo</span>
                      <span className="text-xs text-muted-foreground">{capoFret === 0 ? "Off" : `Fret ${capoFret}`}</span>
                    </div>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                        <button
                          key={n}
                          onClick={() => setCapoFret(n)}
                          className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            capoFret === n
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {n === 0 ? "✕" : n}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Tuning reference */}
                  <TuningReference />

                  {/* Left-handed */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Left-handed</span>
                    <button
                      onClick={() => setLeftHanded(!leftHanded)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${leftHanded ? "bg-primary" : "bg-secondary"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${leftHanded ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>

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
                onClick={() => setShowTimer(p => !p)}
                className={`p-2 rounded-xl transition-colors ${
                  showTimer ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
                title="Practice timer"
              >
                <Timer className="w-4 h-4" />
              </button>

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
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-semibold">Custom</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              onFocus={() => setExpandedChordId(null)}
              placeholder="Search chords… e.g. Am7, C#m"
              className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl text-foreground placeholder:text-muted-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
        </div>

        {/* Root note filter */}
        <div className="max-w-lg mx-auto px-4 pb-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {rootNotes.map(root => (
              <button
                key={root}
                onClick={() => handleRootClick(root)}
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

        {/* Suffix filter */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <TooltipProvider delayDuration={400}>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {suffixes.map(s => (
                <Tooltip key={s}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleSuffixClick(s)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                        activeSuffix === s
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {suffixLabels[s] || s}
                    </button>
                  </TooltipTrigger>
                  {suffixDescriptions[s] && (
                    <TooltipContent side="bottom" className="max-w-[200px] text-center text-xs">
                      {suffixDescriptions[s]}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>

      </header>

      {/* Scale highlight panel — outside sticky header so it's never clipped */}
      <div className="max-w-lg mx-auto px-4 pt-3 lg:max-w-none">
        <button
          onClick={() => { setShowScaleFilter(p => !p); if (showScaleFilter) setScaleKey(null); }}
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
            scaleKey
              ? "bg-green-500/20 text-green-400"
              : showScaleFilter
              ? "bg-secondary text-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {scaleKey ? `✦ ${scaleKey} ${SCALE_LABELS[scaleType]}` : "Scale Highlight"}
        </button>

        <AnimatePresence>
          {showScaleFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <div className="pt-2 pb-1 flex flex-col gap-2">
                {/* Key row */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {rootNotes.filter(r => !r.includes("b") || ["Bb", "Eb", "Ab", "Db", "Gb"].includes(r)).map(r => (
                    <button
                      key={r}
                      onClick={() => setScaleKey(prev => prev === r ? null : r)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        scaleKey === r
                          ? "bg-green-500 text-white"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {/* Scale type row */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {Object.keys(SCALE_INTERVALS).map(s => (
                    <button
                      key={s}
                      onClick={() => setScaleType(s)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                        scaleType === s
                          ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/40"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {SCALE_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chord grid with inline voicing expansion */}
      <main className="max-w-lg mx-auto px-4 py-4 lg:max-w-none">
        {/* Surprise me — shown when no recents yet */}
        {recent.length === 0 && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => {
                const rand = allChords[Math.floor(Math.random() * allChords.length)];
                if (rand) handleChordSelect(rand);
              }}
              className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Surprise me ↗
            </button>
          </div>
        )}

        {/* Recently played */}
        {recent.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recently played</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearRecent}
                  className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    const rand = allChords[Math.floor(Math.random() * allChords.length)];
                    if (rand) handleChordSelect(rand);
                  }}
                  className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Surprise me ↗
                </button>
              </div>
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {recent.map(r => {
                const chord = allChords.find(c => c.key === r.chordKey && c.suffix === r.suffix);
                return chord ? (
                  <button
                    key={`${r.chordKey}-${r.suffix}`}
                    onClick={() => handleChordSelect(chord)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 ${
                      expandedChordId === `${r.chordKey}-${r.suffix}`
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-surface-elevated"
                    }`}
                  >
                    {r.label}
                  </button>
                ) : null;
              })}
            </div>
          </div>
        )}
        {chordRows.map((row, rowIdx) => (
          <div key={rowIdx}>
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 mb-2">
              {row.map(chord => {
                const id = `${chord.key}-${chord.suffix}`;
                const isExpanded = expandedChordId === id;
                const fav = isFavorite(id);
                const sounsdLike = capoLabel(chord);
                const inScale = !scaleKey || chordFitsScale(chord.key, chord.suffix, scaleKey, scaleType);
                return (
                  <div key={id} className={`relative group transition-opacity ${!inScale ? "opacity-25" : ""}`}>
                    <button
                      onClick={() => handleChordSelect(chord)}
                      className={`w-full p-2.5 rounded-xl text-center transition-all ${
                        isExpanded
                          ? "bg-primary text-primary-foreground ring-2 ring-primary shadow-lg scale-105"
                          : inScale && scaleKey
                          ? "bg-card hover:bg-surface-elevated border border-green-500/40 ring-1 ring-green-500/20"
                          : "bg-card hover:bg-surface-elevated border border-border/30"
                      }`}
                    >
                      <p className={`text-base font-bold leading-tight ${isExpanded ? "" : "text-foreground"}`}>{chord.label}</p>
                      {sounsdLike ? (
                        <p className={`text-[10px] mt-0.5 font-semibold ${isExpanded ? "text-primary-foreground/80" : "text-primary"}`}>
                          → {sounsdLike}
                        </p>
                      ) : (
                        <p className={`text-[10px] mt-0.5 ${isExpanded ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {chord.voicings.length} voicing{chord.voicings.length !== 1 ? "s" : ""}
                        </p>
                      )}
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

            {/* Inline expansion for this row — hidden on desktop (right panel used instead) */}
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
                    <InlineVoicingPanel chord={chord} playChord={playChord} capoFret={capoFret} allChords={allChords} onSelectChord={handleChordSelect} activeScaleKey={scaleKey} activeScaleType={scaleType} onAddToSheet={addToSheet} />
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
            <p className="text-muted-foreground/60 text-xs mt-1">Try a different search or create your own voicing</p>
            <button
              onClick={() => setShowCreator(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
            >
              Create Voicing
            </button>
          </motion.div>
        )}

        <div className="h-20" />
      </main>
      </div>{/* end left column */}

      {/* Right panel — desktop only */}
      <div className="hidden lg:flex lg:flex-col lg:w-[400px] lg:flex-shrink-0 lg:border-l lg:border-border/50 lg:h-screen">
        <div className="p-4 flex-shrink-0 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {expandedChord ? expandedChord.label : "Select a chord"}
            </p>
            <div className="flex items-center gap-1.5">
              {expandedChord && scaleKey && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                  chordFitsScale(expandedChord.key, expandedChord.suffix, scaleKey, scaleType)
                    ? "bg-green-500/20 text-green-400"
                    : "bg-muted text-muted-foreground line-through"
                }`}>
                  {scaleKey} {SCALE_LABELS[scaleType]}
                </span>
              )}
              {expandedChord && capoFret > 0 && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                  → {transposeNote(expandedChord.key, capoFret) + expandedChord.suffix} (capo {capoFret})
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-16">
          {expandedChord ? (
            <InlineVoicingPanel chord={expandedChord} playChord={playChord} capoFret={capoFret} allChords={allChords} onSelectChord={handleChordSelect} activeScaleKey={scaleKey} activeScaleType={scaleType} onAddToSheet={addToSheet} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground/50 gap-2 mt-16">
              <Guitar className="w-10 h-10" />
              <p className="text-sm">Click any chord to see voicings</p>
            </div>
          )}
        </div>
      </div>

      {/* Practice timer overlay */}
      <AnimatePresence>
        {showTimer && <PracticeTimer onClose={() => setShowTimer(false)} />}
      </AnimatePresence>

      {/* Creator overlay */}
      <AnimatePresence>
        {showCreator && (
          <VoicingCreator
            onClose={() => setShowCreator(false)}
            onSaved={handleVoicingSaved}
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

      {/* Sheet overlay */}
      {showSheet && createPortal(
        <GuitarSheetOverlay
          key={"sheet-overlay-" + refreshCounter}
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

/** Inline voicing expansion panel showing all voicings with diagrams */
function InlineVoicingPanel({
  chord, playChord, capoFret = 0, allChords = [], onSelectChord, activeScaleKey, activeScaleType, onAddToSheet,
}: {
  chord: Chord;
  playChord: (v: any) => void;
  capoFret?: number;
  allChords?: Chord[];
  onSelectChord?: (chord: Chord) => void;
  activeScaleKey?: string | null;
  activeScaleType?: string;
  onAddToSheet?: (chord: Chord, voicingIdx: number) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [showFretboard, setShowFretboard] = useState(false);

  const existingKeys = useMemo(
    () => new Set(allChords.map(c => `${c.key}-${c.suffix}`)),
    [allChords],
  );

  const substitutions = useMemo(
    () => getSubstitutions(chord.key, chord.suffix, existingKeys),
    [chord.key, chord.suffix, existingKeys],
  );

  const scaleMatches = useMemo(
    () => getChordInScales(chord.key, chord.suffix),
    [chord.key, chord.suffix],
  );

  return (
    <div className="bg-secondary/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-bold text-foreground">{chord.label}</span>
        {capoFret > 0 && (
          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
            capo {capoFret}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground ml-auto">
          {chord.voicings.length} voicing{chord.voicings.length !== 1 ? "s" : ""}
        </span>
        {onAddToSheet && (
          <button
            onClick={() => onAddToSheet(chord, activeIdx)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 text-[10px] font-semibold transition-colors ml-2"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
      </div>

      {/* Large active diagram */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="flex justify-center mb-3"
        >
          <ChordDiagram voicing={chord.voicings[activeIdx]} size="lg" capoFret={capoFret} />
        </motion.div>
      </AnimatePresence>

      {/* Play button + positions */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <button
          onClick={() => playChord(chord.voicings[activeIdx])}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
        >
          <Volume2 className="w-4 h-4" />
          Play
        </button>
        <p className="text-xs text-muted-foreground font-mono tracking-wide">
          {chord.voicings[activeIdx].positions.map(p =>
            p === -1 ? "x" : p.toString()
          ).join(" · ")}
        </p>
        <button
          onClick={() => setShowFretboard(p => !p)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            showFretboard ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Neck
        </button>
      </div>

      {/* Fretboard map */}
      <AnimatePresence>
        {showFretboard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
            className="mb-3"
          >
            <FretboardMap chordKey={chord.key} suffix={chord.suffix} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voicing thumbnails */}
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
            <div className="w-[60px]">
              <ChordDiagram voicing={v} size="sm" />
            </div>
            <span className="text-[9px] text-muted-foreground mt-1 truncate max-w-[60px]">{v.name}</span>
          </button>
        ))}
      </div>

      {/* Substitution suggestions */}
      {substitutions.length > 0 && onSelectChord && (
        <div className="mt-4 pt-3 border-t border-border/30">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Try instead</p>
          <div className="flex flex-col gap-1.5">
            {substitutions.map(sub => {
              const target = allChords.find(c => c.key === sub.key && c.suffix === sub.suffix);
              return (
                <button
                  key={`${sub.key}-${sub.suffix}`}
                  onClick={() => target && onSelectChord(target)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors text-left"
                >
                  <span className="text-sm font-bold text-foreground">{sub.label}</span>
                  <span className="text-[10px] text-muted-foreground ml-2 text-right leading-tight max-w-[160px]">{sub.reason}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scale context — "Works in" */}
      {scaleMatches.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/30">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Works in</p>
          <div className="flex flex-wrap gap-1.5">
            {scaleMatches.map(m => {
              const isActive = activeScaleKey === m.scaleKey && activeScaleType === m.scaleType;
              return (
                <span
                  key={`${m.scaleKey}-${m.scaleType}`}
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors ${
                    isActive
                      ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/30"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <span>{m.scaleKey} {SCALE_LABELS[m.scaleType]}</span>
                  <span className="font-mono opacity-70">{m.degreeLabel}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );


}

// ── Guitar Sheet overlay ──────────────────────────────────────────────────────────

function GuitarSheetOverlay({
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
  handleImportSheet: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [localEntries, setLocalEntries] = useState<SheetEntry[]>(entries);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

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

  function handleAddSection() {
    const newEntry: SheetSectionHeader = { type: "section" as const, id: Date.now().toString() + Math.random(), label: "New Section" };
    const newOrder = [...localEntries, newEntry];
    setLocalEntries(newOrder);
    onReorder(newOrder);
    // Auto-edit the label
    setEditingSectionId(newEntry.id);
    setEditingLabel("New Section");
  }

  function handleSectionLabelChange(id: string, label: string) {
    setLocalEntries(prev => prev.map(e => e.type === "section" && e.id === id ? { ...e, label } : e));
  }

  function handleSectionLabelBlur() {
    // Propagate changes to parent
    onReorder(localEntries);
    setEditingSectionId(null);
    setEditingLabel("");
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* Header — hidden during print */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-2 piano-sheet-no-print">
        <button onClick={onClose} className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground shrink-0">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-foreground flex-1 min-w-0 truncate">Chord Reference Sheet</h2>
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
            <Guitar className="w-10 h-10 opacity-30" />
            <p>No chords added yet.</p>
            <p className="text-xs opacity-60">Go back and click "Add to Sheet" on any voicing.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3 piano-sheet-no-print">
              <h1 className="text-lg font-bold text-foreground">Guitar Chord Reference Sheet</h1>
              <button
                onClick={handleAddSection}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Add Section
              </button>
            </div>
            <h1 className="piano-sheet-print-title hidden text-2xl font-bold text-black mb-6">Guitar Chord Reference Sheet</h1>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-1.5">
              {localEntries.map((entry, i) => {
                if (entry.type === "section") {
                  const isEditing = editingSectionId === entry.id;
                  return (
                    <div
                      key={entry.id}
                      className="col-span-full flex items-center gap-2"
                      draggable
                      onDragStart={(e) => handleDragStart(e, i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDrop={(e) => handleDrop(e, i)}
                      onDragEnd={handleDragEnd}
                      style={{ opacity: dragIndex === i ? 0.3 : 1, cursor: "grab" }}
                    >
                      <div className="flex items-center text-muted-foreground cursor-grab shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                        </svg>
                      </div>
                      <div className="flex-1 flex items-center gap-2 bg-accent/15 rounded-lg px-4 py-2 border-l-4 border-accent">
                        {isEditing ? (
                          <input
                            autoFocus
                            type="text"
                            value={editingLabel}
                            onChange={(e) => { setEditingLabel(e.target.value); handleSectionLabelChange(entry.id, e.target.value); }}
                            onBlur={handleSectionLabelBlur}
                            onKeyDown={(e) => { if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); } }}
                            className="flex-1 bg-transparent text-sm font-bold text-foreground outline-none"
                          />
                        ) : (
                          <span
                            className="flex-1 text-sm font-bold text-foreground cursor-text"
                            onClick={() => { setEditingSectionId(entry.id); setEditingLabel(entry.label); }}
                          >
                            {entry.label}
                          </span>
                        )}
                        <button
                          onClick={() => onRemove(i)}
                          className="w-5 h-5 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center hover:bg-destructive transition-colors shrink-0"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                }

                // Chord entry
                const chord = entry.chord;
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
                    <div className="piano-sheet-no-print absolute -top-1.5 -left-1.5 flex flex-col gap-0.5 z-10">
                      <button
                        onClick={(e) => { e.stopPropagation(); if (i > 0) { const newOrder = [...localEntries]; const [moved] = newOrder.splice(i, 1); newOrder.splice(i - 1, 0, moved); setLocalEntries(newOrder); onReorder(newOrder); } }}
                        className="w-4 h-4 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                        title="Move up"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7"/></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (i < localEntries.length - 1) { const newOrder = [...localEntries]; const [moved] = newOrder.splice(i, 1); newOrder.splice(i + 1, 0, moved); setLocalEntries(newOrder); onReorder(newOrder); } }}
                        className="w-4 h-4 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                        title="Move down"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l7-7m-7 7l-7-7"/></svg>
                      </button>
                    </div>
                    <div className="piano-sheet-no-print absolute -top-1.5 -right-1.5 flex gap-0.5 z-10">
                      <button
                        onClick={(e) => { e.stopPropagation(); const copy = { ...entry, chord: entry.chord }; const newOrder = [...localEntries]; newOrder.splice(i + 1, 0, copy); setLocalEntries(newOrder); onReorder(newOrder); }}
                        className="w-4 h-4 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                        title="Duplicate chord"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      </button>
                      <button
                        onClick={() => onRemove(i)}
                        className="w-4 h-4 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center hover:bg-destructive transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <ChordDiagram voicing={chord.voicings[entry.voicingIdx]} size="sm" />
                    <p className="text-[10px] font-semibold text-foreground text-center leading-tight mt-0.5">{chord.label}</p>
                    <p className="text-[8px] text-muted-foreground font-mono text-center leading-tight">
                      {chord.voicings[entry.voicingIdx]?.positions.map(p => p === -1 ? "x" : p.toString()).join("·") || ""}
                    </p>
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
export default Index;