import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { Plus, Trash2, ChevronLeft, FileText, LayoutGrid, FolderOpen, BookOpen, Download, Copy, Play, Square, GripVertical } from "lucide-react";
import type { Song, SongSection, SongChord, Meter, MeterType } from "@/data/songs";
import { SECTION_TYPES, PRESET_METERS, createId, saveSong, getSongs, exportSongAsJSON } from "@/data/songs";
import { getAllChordsWithCustom, rootNotes as ROOT_NOTES } from "@/data/chords";
import { getAllSavedSheets } from "@/utils/sheetStorage";
import type { SongChord } from "@/data/songs";
import { createEmptyLeadSheet, createEmptyRow, createEmptyMeasure, createRowId, createMeasureId, flattenMeasures, getEffectiveChords } from "@/data/leadsheet";
import type { LeadSheet, LeadSheetChord } from "@/data/leadsheet";
import { useMetronome } from "@/hooks/useMetronome";
import { useChordPlayer } from "@/hooks/useChordPlayer";
import ChordDiagram from "./ChordDiagram";
import TapTempo from "./TapTempo";
import ChordPicker from "./ChordPicker";
import ChordSheet from "./ChordSheet";
import MeterSelector from "./MeterSelector";
import LeadSheetEditor from "./leadsheet/LeadSheetEditor";
import LeadSheetPlayer from "./leadsheet/LeadSheetPlayer";
import LeadSheetStaffView from "./leadsheet/LeadSheetStaffView";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";

interface SongEditorProps {
  song: Song;
  onBack: () => void;
  onSaved: () => void;
}

const DEFAULT_METER: Meter = { type: "4/4", beatsPerMeasure: 4, beatUnit: 4 };

export default function SongEditor({ song: initialSong, onBack, onSaved }: SongEditorProps) {
  const [song, setSong] = useState<Song>({
    ...initialSong,
    meter: initialSong.meter ?? DEFAULT_METER,
    bpm: initialSong.bpm ?? 120,
    sections: initialSong.sections.map(s => ({ ...s, chords: [...s.chords] })),
  });
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);
  const [expandedChord, setExpandedChord] = useState<string | null>(null);
  const [showChordSheet, setShowChordSheet] = useState(false);
  const [showLeadSheet, setShowLeadSheet] = useState(false);
  const [showStaffView, setShowStaffView] = useState(false);
  const [showMeterOverride, setShowMeterOverride] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"sections" | "leadsheet">(
    initialSong.leadSheet ? "leadsheet" : "sections"
  );

  const allChords = getAllChordsWithCustom();

  // Hide bottom nav while editor is active
  useEffect(() => {
    const nav = document.getElementById("bottom-nav");
    if (nav) nav.style.display = "none";
    return () => { if (nav) nav.style.display = ""; };
  }, []);

  function updateSong(updater: (s: Song) => Song) {
    setSong(prev => {
      const next = updater({ ...prev, sections: prev.sections.map(s => ({ ...s, chords: [...s.chords] })) });
      return next;
    });
  }

  function handleSave() {
    saveSong(song);
    onSaved();
    onBack();
  }

  function addSection(type: SongSection["type"]) {
    const count = song.sections.filter(s => s.type === type).length;
    const typeLabel = SECTION_TYPES.find(t => t.value === type)?.label ?? type;
    const label = count > 0 ? `${typeLabel} ${count + 1}` : typeLabel;
    updateSong(s => ({
      ...s,
      sections: [...s.sections, { id: createId(), type, label, chords: [] }],
    }));
  }

  function removeSection(sectionId: string) {
    updateSong(s => ({
      ...s,
      sections: s.sections.filter(sec => sec.id !== sectionId),
    }));
  }

  function addChordToSection(sectionId: string, chord: SongChord) {
    updateSong(s => ({
      ...s,
      sections: s.sections.map(sec =>
        sec.id === sectionId ? { ...sec, chords: [...sec.chords, chord] } : sec
      ),
    }));
    setPickerTarget(null);
  }

  function removeChordFromSection(sectionId: string, chordIndex: number) {
    updateSong(s => ({
      ...s,
      sections: s.sections.map(sec =>
        sec.id === sectionId ? { ...sec, chords: sec.chords.filter((_, i) => i !== chordIndex) } : sec
      ),
    }));
  }

  function moveSection(fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= song.sections.length) return;
    updateSong(s => {
      const secs = [...s.sections];
      const [moved] = secs.splice(fromIdx, 1);
      secs.splice(toIdx, 0, moved);
      return { ...s, sections: secs };
    });
  }

  function getVoicingForChord(chord: SongChord) {
    const found = allChords.find(c => c.key === chord.chordKey && c.suffix === chord.suffix);
    if (!found) return null;
    return found.voicings[chord.voicingIndex] ?? found.voicings[0] ?? null;
  }

  function setSectionMeterOverride(sectionId: string, meter: Meter | undefined) {
    updateSong(s => ({
      ...s,
      sections: s.sections.map(sec =>
        sec.id === sectionId ? { ...sec, meterOverride: meter } : sec
      ),
    }));
    setShowMeterOverride(null);
  }

  function transposeNote(note: string, semitones: number): string {
    const idx = ROOT_NOTES.indexOf(note);
    if (idx === -1) return note;
    return ROOT_NOTES[((idx + semitones) % 12 + 12) % 12];
  }

  function transposeAllChords(semitones: number) {
    updateSong(s => ({
      ...s,
      songKey: s.songKey ? transposeNote(s.songKey, semitones) : s.songKey,
      sections: s.sections.map(sec => ({
        ...sec,
        chords: sec.chords.map(ch => {
          const newKey = transposeNote(ch.chordKey, semitones);
          const displaySuffix = ch.label.slice(ch.chordKey.length);
          return { ...ch, chordKey: newKey, label: newKey + displaySuffix, voicingIndex: 0 };
        }),
      })),
    }));
  }

  function transposeToKey(targetKey: string) {
    const currentKey = song.songKey ?? song.sections.flatMap(s => s.chords)[0]?.chordKey;
    if (!currentKey) return;
    const fromIdx = ROOT_NOTES.indexOf(currentKey);
    const toIdx = ROOT_NOTES.indexOf(targetKey);
    if (fromIdx === -1 || toIdx === -1) return;
    const semitones = ((toIdx - fromIdx) % 12 + 12) % 12;
    if (semitones === 0) return;
    transposeAllChords(semitones);
  }

  if (showChordSheet) {
    saveSong(song);
    return <ChordSheet song={song} onBack={() => setShowChordSheet(false)} />;
  }

  if (showLeadSheet) {
    saveSong(song);
    return <LeadSheetPlayer song={song} onBack={() => setShowLeadSheet(false)} />;
  }

  if (showStaffView && song.leadSheet) {
    saveSong(song);
    return <RealBookViewOverlay song={song} meter={song.meter ?? DEFAULT_METER} onBack={() => setShowStaffView(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={song.title}
                onChange={e => updateSong(s => ({ ...s, title: e.target.value }))}
                placeholder="Song Title"
                className="w-full bg-transparent text-xl font-bold text-foreground placeholder:text-muted-foreground outline-none"
              />
              <input
                type="text"
                value={song.artist ?? ""}
                onChange={e => updateSong(s => ({ ...s, artist: e.target.value }))}
                placeholder="Artist (optional)"
                className="w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/50 outline-none mt-0.5"
              />
            </div>
            <button
              onClick={() => exportSongAsJSON(song)}
              className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Export song as JSON"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-32">
        {/* Tempo & Meter */}
        <div className="mb-6 p-4 bg-card rounded-2xl border border-border/50">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Tempo & Meter</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">BPM</label>
              <input
                type="number"
                min={20}
                max={300}
                value={song.bpm ?? 120}
                onChange={e => updateSong(s => ({ ...s, bpm: parseInt(e.target.value) || 120 }))}
                className="w-20 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-sm font-semibold text-center outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <MeterSelector
              meter={song.meter ?? DEFAULT_METER}
              onChange={meter => updateSong(s => ({ ...s, meter }))}
            />
          </div>
          <div className="mt-3">
            <TapTempo
              onBpmDetected={bpm => updateSong(s => ({ ...s, bpm }))}
              currentBpm={song.bpm ?? 120}
              beatsPerMeasure={(song.meter ?? DEFAULT_METER).beatsPerMeasure}
            />
          </div>

          {/* Transpose */}
          {song.sections.some(s => s.chords.length > 0) && (
            <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground">Transpose</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => transposeAllChords(-1)}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors"
                  title="Down one semitone"
                >
                  ♭ −1
                </button>
                <button
                  onClick={() => transposeAllChords(1)}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors"
                  title="Up one semitone"
                >
                  ♯ +1
                </button>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-muted-foreground">to key</span>
                <select
                  value=""
                  onChange={e => { if (e.target.value) transposeToKey(e.target.value); e.target.value = ""; }}
                  className="px-2 py-1.5 rounded-lg bg-secondary text-foreground text-sm font-semibold border-none outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">—</option>
                  {ROOT_NOTES.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Mode toggle: Sections vs Lead Sheet */}
        <div className="mb-4 flex rounded-xl bg-secondary/50 p-0.5">
          <button
            onClick={() => setEditorMode("sections")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              editorMode === "sections"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sections
          </button>
          <button
            onClick={() => {
              setEditorMode("leadsheet");
              if (!song.leadSheet) {
                updateSong(s => ({ ...s, leadSheet: createEmptyLeadSheet() }));
              }
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
              editorMode === "leadsheet"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Lead Sheet
          </button>
        </div>

        {editorMode === "sections" ? (
          <>
            {/* Sections */}
            <Reorder.Group
              axis="y"
              values={song.sections}
              onReorder={sections => updateSong(s => ({ ...s, sections }))}
              className="space-y-4 outline-none"
            >
              {song.sections.map((section, sectionIdx) => (
                <ReorderSection key={section.id} section={section}>
                  {(dragControls) => (
                  <div className="bg-card rounded-2xl overflow-hidden border border-border/50">
                  {/* Section header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-surface-elevated/50">
                    <div
                      onPointerDown={e => dragControls.start(e)}
                      className="touch-none cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={section.label}
                      onChange={e => updateSong(s => ({
                        ...s,
                        sections: s.sections.map(sec =>
                          sec.id === section.id ? { ...sec, label: e.target.value } : sec
                        ),
                      }))}
                      className="flex-1 bg-transparent text-sm font-bold text-foreground uppercase tracking-wider outline-none"
                    />

                    {/* Section meter override */}
                    <button
                      onClick={() => setShowMeterOverride(prev => prev === section.id ? null : section.id)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
                        section.meterOverride
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {section.meterOverride
                        ? `${section.meterOverride.beatsPerMeasure}/${section.meterOverride.beatUnit}`
                        : `${(song.meter ?? DEFAULT_METER).beatsPerMeasure}/${(song.meter ?? DEFAULT_METER).beatUnit}`
                      }
                    </button>

                    <button
                      onClick={() => removeSection(section.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Meter override selector */}
                  {showMeterOverride === section.id && (
                    <div className="px-4 py-2 bg-secondary/30 border-b border-border/30">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Section meter:</span>
                        <MeterSelector
                          meter={section.meterOverride ?? song.meter ?? DEFAULT_METER}
                          onChange={meter => setSectionMeterOverride(section.id, meter)}
                          compact
                        />
                        {section.meterOverride && (
                          <button
                            onClick={() => setSectionMeterOverride(section.id, undefined)}
                            className="text-[10px] text-destructive hover:underline"
                          >
                            Reset to song default
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Chords in section */}
                  <div className="px-4 py-3">
                    {section.chords.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {section.chords.map((chord, chordIdx) => {
                          const voicing = getVoicingForChord(chord);
                          const chordId = `${section.id}-${chordIdx}`;
                          const isExpanded = expandedChord === chordId;
                          return (
                            <motion.div key={chordIdx} layout className="relative group">
                              <button
                                onClick={() => setExpandedChord(prev => prev === chordId ? null : chordId)}
                                className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
                                  isExpanded ? "bg-primary/10 ring-1 ring-primary/30" : "bg-secondary/50 hover:bg-secondary"
                                }`}
                              >
                                <span className="text-sm font-bold text-foreground mb-1">{chord.label}</span>
                                {voicing && (
                                  <div className="w-[60px]">
                                    <ChordDiagram voicing={voicing} size="sm" />
                                  </div>
                                )}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeChordFromSection(section.id, chordIdx); }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <XIcon className="w-3 h-3" />
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 italic">No chords yet</p>
                    )}

                    {/* Lyrics textarea */}
                    <textarea
                      value={section.lyrics ?? ""}
                      onChange={e => updateSong(s => ({
                        ...s,
                        sections: s.sections.map(sec =>
                          sec.id === section.id ? { ...sec, lyrics: e.target.value } : sec
                        ),
                      }))}
                      placeholder="Add lyrics…"
                      rows={1}
                      onInput={e => {
                        const el = e.currentTarget;
                        el.style.height = "auto";
                        el.style.height = el.scrollHeight + "px";
                      }}
                      className="mt-3 w-full resize-none overflow-hidden bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none leading-relaxed"
                    />

                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setPickerTarget(section.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary text-xs font-medium transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Chord
                      </button>

                      {/* Load from saved song */}
                      <LoadProgressionButton
                        currentSongId={song.id}
                        currentSectionId={section.id}
                        onLoad={(chords) => {
                          updateSong(s => ({
                            ...s,
                            sections: s.sections.map(sec =>
                              sec.id === section.id ? { ...sec, chords: [...sec.chords, ...chords] } : sec
                            ),
                          }));
                        }}
                      />
                      <LoadFromSavedButton
                        onLoad={(chords) => {
                          updateSong(s => ({
                            ...s,
                            sections: s.sections.map(sec =>
                              sec.id === section.id ? { ...sec, chords: [...sec.chords, ...chords] } : sec
                            ),
                          }));
                        }}
                      />
                    </div>
                  </div>
                  </div>
                  )}
                </ReorderSection>
              ))}
            </Reorder.Group>

            {/* Add section */}
            <div className="mt-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Add Section</p>
              <div className="flex flex-wrap gap-2">
                {SECTION_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => addSection(t.value)}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 text-xs font-semibold transition-colors"
                  >
                    + {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chord Sheet button */}
            {song.sections.length > 0 && (
              <button
                onClick={() => setShowChordSheet(true)}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/20 border border-accent/30 text-foreground hover:bg-accent/30 transition-colors"
              >
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">View Chord Sheet</span>
              </button>
            )}
          </>
        ) : (
          <>
            {/* Lead Sheet Editor */}
            {song.leadSheet && (
              <>
                <div className="bg-card rounded-2xl border border-border/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Lead Sheet · tap beats to add chords
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (!song.leadSheet) return;
                          const duplicated = JSON.parse(JSON.stringify(song.leadSheet)) as LeadSheet;
                          // Regenerate IDs for duplicated rows/measures
                          const newRows = duplicated.rows.map(r => ({
                            ...r,
                            id: createRowId(),
                            measures: r.measures.map(m => ({
                              ...m,
                              id: createMeasureId(),
                            })),
                          }));
                          updateSong(s => ({
                            ...s,
                            leadSheet: {
                              ...s.leadSheet!,
                              rows: [...s.leadSheet!.rows, ...newRows],
                            },
                          }));
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary text-[10px] font-semibold transition-colors"
                        title="Duplicate entire progression"
                      >
                        <Copy className="w-3 h-3" />
                        Duplicate
                      </button>
                      <LoadSectionsToLeadSheetButton
                        song={song}
                        meter={song.meter ?? DEFAULT_METER}
                        onUpdate={leadSheet => updateSong(s => ({ ...s, leadSheet }))}
                      />
                    </div>
                  </div>
                  <LeadSheetEditor
                    sheet={song.leadSheet}
                    meter={song.meter ?? DEFAULT_METER}
                    onChange={leadSheet => updateSong(s => ({ ...s, leadSheet }))}
                  />
                </div>

                {/* Play Lead Sheet button */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setShowLeadSheet(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/20 border border-accent/30 text-foreground hover:bg-accent/30 transition-colors"
                  >
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Play</span>
                  </button>
                  <button
                    onClick={() => setShowStaffView(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 border border-primary/20 text-foreground hover:bg-primary/20 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Real Book View</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* Chord picker overlay */}
      <AnimatePresence>
        {pickerTarget && (
          <ChordPicker
            onPick={(chord) => addChordToSection(pickerTarget, chord)}
            onClose={() => setPickerTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 3L9 9M9 3L3 9" />
    </svg>
  );
}

function LoadProgressionButton({ currentSongId, currentSectionId, onLoad }: { currentSongId: string; currentSectionId?: string; onLoad: (chords: SongChord[]) => void }) {
  const [open, setOpen] = useState(false);
  const allSongs = getSongs();
  const currentSong = allSongs.find(s => s.id === currentSongId);
  const otherSongs = allSongs.filter(s => s.id !== currentSongId && s.sections.some(sec => sec.chords.length > 0));
  const currentSongSections = currentSong?.sections.filter(s => s.id !== currentSectionId && s.chords.length > 0) ?? [];

  if (currentSongSections.length === 0 && otherSongs.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary text-xs font-medium transition-colors">
          <FolderOpen className="w-3.5 h-3.5" />
          Load Saved
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-h-[300px] overflow-y-auto p-2" side="bottom" align="start">
        {currentSongSections.length > 0 && (
          <>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">
              This Song
            </p>
            <div className="space-y-1 mb-3">
              {currentSongSections.map(section => (
                <button
                  key={section.id}
                  onClick={() => { onLoad(section.chords); setOpen(false); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <p className="text-xs text-muted-foreground">
                    {section.label} · {section.chords.map(c => c.label).join(" → ")}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
        {otherSongs.length > 0 && (
          <>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">
              Other Songs
            </p>
            <div className="space-y-1">
              {otherSongs.map(song => (
                <div key={song.id}>
                  <p className="text-xs font-semibold text-foreground px-2 pt-1">{song.title || "Untitled"}</p>
                  {song.sections.filter(s => s.chords.length > 0).map(section => (
                    <button
                      key={section.id}
                      onClick={() => { onLoad(section.chords); setOpen(false); }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <p className="text-xs text-muted-foreground">
                        {section.label} · {section.chords.map(c => c.label).join(" → ")}
                      </p>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

function LoadFromSavedButton({ onLoad }: { onLoad: (chords: SongChord[]) => void }) {
  const [open, setOpen] = useState(false);
  const allSheets = getAllSavedSheets();

  if (allSheets.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary text-xs font-medium transition-colors">
          <FileText className="w-3.5 h-3.5" />
          Saved Progressions
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-h-[300px] overflow-y-auto p-2" side="bottom" align="start">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Saved Progressions</p>
        {allSheets.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2">No saved progressions yet.</p>
        ) : (
          <div className="space-y-1">
            {[...allSheets].reverse().map(sheet => (
              <button
                key={sheet.id}
                onClick={() => {
                  const chords: SongChord[] = sheet.entries.map(e => ({
                    chordKey: e.chordKey,
                    suffix: e.suffix,
                    label: e.label,
                    voicingIndex: e.voicingIndex,
                  }));
                  if (chords.length > 0) onLoad(chords);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <p className="text-xs font-medium text-foreground">{sheet.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {sheet.source} · {sheet.entries.length} chord{sheet.entries.length !== 1 ? "s" : ""} · {new Date(sheet.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function LoadSectionsToLeadSheetButton({
  song,
  meter,
  onUpdate,
}: {
  song: Song;
  meter: Meter;
  onUpdate: (sheet: LeadSheet) => void;
}) {
  const [open, setOpen] = useState(false);

  // Gather sources: current song sections + other saved songs' sections
  const otherSongs = getSongs().filter(s => s.id !== song.id && s.sections.some(sec => sec.chords.length > 0));
  const hasCurrentSections = song.sections.some(sec => sec.chords.length > 0);

  if (!hasCurrentSections && otherSongs.length === 0) return null;

  function loadChords(chords: SongChord[], label?: string) {
    const measuresPerRow = song.leadSheet?.measuresPerRow ?? 4;
    const lsChords: LeadSheetChord[] = chords.map(c => ({
      label: c.label, chordKey: c.chordKey, suffix: c.suffix, beat: 0, voicingIndex: c.voicingIndex,
    }));
    const measures = lsChords.map(chord => ({ id: createMeasureId(), chords: [chord] }));
    const rows: LeadSheet["rows"] = [];
    for (let i = 0; i < measures.length; i += measuresPerRow) {
      const rowMeasures = measures.slice(i, i + measuresPerRow);
      while (rowMeasures.length < measuresPerRow) rowMeasures.push(createEmptyMeasure());
      rows.push({ id: createRowId(), label: i === 0 ? (label || undefined) : undefined, measures: rowMeasures });
    }
    const existing = song.leadSheet ?? createEmptyLeadSheet();
    const isBlank = existing.rows.length === 1 && existing.rows[0].measures.every(m => m.chords.length === 0);
    onUpdate({ ...existing, rows: isBlank ? rows : [...existing.rows, ...rows] });
    setOpen(false);
  }

  function loadAllSections(sections: SongSection[]) {
    const measuresPerRow = song.leadSheet?.measuresPerRow ?? 4;
    const allRows: LeadSheet["rows"] = [];
    for (const section of sections) {
      const lsChords: LeadSheetChord[] = section.chords.map(c => ({
        label: c.label, chordKey: c.chordKey, suffix: c.suffix, beat: 0, voicingIndex: c.voicingIndex,
      }));
      const measures = lsChords.map(chord => ({ id: createMeasureId(), chords: [chord] }));
      for (let i = 0; i < measures.length; i += measuresPerRow) {
        const rowMeasures = measures.slice(i, i + measuresPerRow);
        while (rowMeasures.length < measuresPerRow) rowMeasures.push(createEmptyMeasure());
        allRows.push({ id: createRowId(), label: i === 0 ? section.label : undefined, measures: rowMeasures });
      }
    }
    const existing = song.leadSheet ?? createEmptyLeadSheet();
    const isBlank = existing.rows.length === 1 && existing.rows[0].measures.every(m => m.chords.length === 0);
    onUpdate({ ...existing, rows: isBlank ? allRows : [...existing.rows, ...allRows] });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary text-[10px] font-semibold transition-colors">
          <Download className="w-3 h-3" />
          Load Sections
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-h-[350px] overflow-y-auto p-2" side="bottom" align="end">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">
          Load into Lead Sheet
        </p>

        {/* Load ALL sections at once */}
        {song.sections.filter(s => s.chords.length > 0).length > 1 && (
          <button
            onClick={() => {
              const sectionsWithChords = song.sections.filter(s => s.chords.length > 0);
              loadAllSections(sectionsWithChords);
            }}
            className="w-full text-left px-3 py-2 mb-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors"
          >
            <p className="text-xs font-bold text-primary">⬇ Load All Sections</p>
            <p className="text-[10px] text-muted-foreground">
              {song.sections.filter(s => s.chords.length > 0).length} sections · {song.sections.filter(s => s.chords.length > 0).reduce((n, s) => n + s.chords.length, 0)} chords
            </p>
          </button>
        )}

        {/* Current song sections */}
        {hasCurrentSections && (
          <div className="mb-2">
            <p className="text-[10px] font-semibold text-primary px-2 mb-1">This Song</p>
            {song.sections.filter(s => s.chords.length > 0).map(section => (
              <button
                key={section.id}
                onClick={() => loadChords(section.chords, section.label)}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <p className="text-xs font-medium text-foreground">{section.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {section.chords.map(c => c.label).join(" → ")}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Other saved songs */}
        {otherSongs.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-primary px-2 mb-1">Other Songs</p>
            {otherSongs.map(s => (
              <div key={s.id}>
                <p className="text-xs font-semibold text-foreground px-2 pt-1">{s.title || "Untitled"}</p>
                {s.sections.filter(sec => sec.chords.length > 0).map(section => (
                  <button
                    key={section.id}
                    onClick={() => loadChords(section.chords, section.label)}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <p className="text-[10px] text-muted-foreground truncate">
                      {section.label} · {section.chords.map(c => c.label).join(" → ")}
                    </p>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function RealBookViewOverlay({ song, meter, onBack }: { song: Song; meter: Meter; onBack: () => void }) {
  const [clef, setClef] = useState<"treble" | "bass">("treble");
  const [songKey, setSongKey] = useState(song.songKey ?? "");
  const [countInBars, setCountInBars] = useState(0);
  const allChords = getAllChordsWithCustom();
  const metronome = useMetronome();
  const { playChord } = useChordPlayer();
  const [playing, setPlaying] = useState(false);
  const [countingIn, setCountingIn] = useState(false);
  const [activeMeasure, setActiveMeasure] = useState(-1);
  const [activeBeat, setActiveBeat] = useState(-1);
  const timerRef = useRef<number | null>(null);
  const stateRef = useRef({ measureIdx: 0, beat: 0, countInBeatsLeft: 0 });

  const sheet = song.leadSheet!;
  const bpm = song.bpm ?? 120;
  const beatsPerMeasure = meter.beatsPerMeasure;

  const flat = flattenMeasures(sheet);
  const allMeasuresList = flat.map(f => f.measure);

  function getVoicing(chord: { chordKey: string; suffix: string; voicingIndex: number }) {
    const found = allChords.find(c => c.key === chord.chordKey && c.suffix === chord.suffix);
    if (!found) return null;
    return found.voicings[chord.voicingIndex] ?? found.voicings[0] ?? null;
  }

  const stopPlayback = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    metronome.stop();
    setPlaying(false);
    setCountingIn(false);
    setActiveMeasure(-1);
    setActiveBeat(-1);
    stateRef.current = { measureIdx: 0, beat: 0, countInBeatsLeft: 0 };
  }, [metronome]);

  const startPlayback = useCallback(() => {
    if (flat.length === 0) return;
    stopPlayback();
    setPlaying(true);
    metronome.start(bpm, beatsPerMeasure);

    const totalCountInBeats = countInBars * beatsPerMeasure;

    if (totalCountInBeats > 0) {
      setCountingIn(true);
      stateRef.current = { measureIdx: 0, beat: 0, countInBeatsLeft: totalCountInBeats };
      setActiveMeasure(-1);
      setActiveBeat(-1);
    } else {
      stateRef.current = { measureIdx: 0, beat: 0, countInBeatsLeft: 0 };
      setActiveMeasure(0);
      setActiveBeat(0);
      const firstChords = getEffectiveChords(allMeasuresList[0], allMeasuresList, 0);
      const onBeat0 = firstChords.find(c => c.beat === 0);
      if (onBeat0) { const v = getVoicing(onBeat0); if (v) playChord(v); }
    }

    const interval = (60 / bpm) * 1000;
    timerRef.current = window.setInterval(() => {
      let { measureIdx, beat, countInBeatsLeft } = stateRef.current;

      // Still in count-in phase
      if (countInBeatsLeft > 1) {
        stateRef.current = { measureIdx, beat, countInBeatsLeft: countInBeatsLeft - 1 };
        return;
      }
      // Transition from count-in to song
      if (countInBeatsLeft === 1) {
        stateRef.current = { measureIdx: 0, beat: 0, countInBeatsLeft: 0 };
        setCountingIn(false);
        setActiveMeasure(0);
        setActiveBeat(0);
        const firstChords = getEffectiveChords(allMeasuresList[0], allMeasuresList, 0);
        const onBeat0 = firstChords.find(c => c.beat === 0);
        if (onBeat0) { const v = getVoicing(onBeat0); if (v) playChord(v); }
        return;
      }

      beat++;
      if (beat >= beatsPerMeasure) {
        beat = 0;
        measureIdx++;
        if (measureIdx >= flat.length) { stopPlayback(); return; }
      }
      stateRef.current = { measureIdx, beat, countInBeatsLeft: 0 };
      setActiveMeasure(measureIdx);
      setActiveBeat(beat);

      const chords = getEffectiveChords(allMeasuresList[measureIdx], allMeasuresList, measureIdx);
      const onBeat = chords.find(c => c.beat === beat);
      if (onBeat) { const v = getVoicing(onBeat); if (v) playChord(v); }
    }, interval);
  }, [flat, bpm, beatsPerMeasure, countInBars, metronome, playChord, stopPlayback, allMeasuresList]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => { stopPlayback(); onBack(); }} className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <BookOpen className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Real Book View</h1>

          {/* Song Key selector */}
          <select
            value={songKey}
            onChange={(e) => setSongKey(e.target.value)}
            className="px-2 py-1 rounded-lg bg-secondary text-foreground text-xs font-semibold border border-border/50 outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">No Key</option>
            {["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"].map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
            {["Cm", "C#m", "Dm", "Ebm", "Em", "Fm", "F#m", "Gm", "Abm", "Am", "Bbm", "Bm"].map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          {/* Count-in selector */}
          <select
            value={countInBars}
            onChange={(e) => setCountInBars(Number(e.target.value))}
            disabled={playing}
            className="px-2 py-1 rounded-lg bg-secondary text-foreground text-xs font-semibold border border-border/50 outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
          >
            <option value={0}>No count-in</option>
            <option value={1}>1 bar count-in</option>
            <option value={2}>2 bars count-in</option>
            <option value={4}>4 bars count-in</option>
            <option value={8}>8 bars count-in</option>
          </select>

          {/* Play/Stop */}
          <button
            onClick={playing ? stopPlayback : startPlayback}
            className={`p-2 rounded-xl transition-colors ${
              playing ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
            title={playing ? "Stop" : "Play"}
          >
            {playing ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          {playing && (
            <div className="flex items-center gap-2">
              {countingIn && <span className="text-xs font-bold text-primary animate-pulse">Count-in…</span>}
              <span className="text-xs font-semibold text-muted-foreground">{bpm} BPM</span>
              <div className="flex gap-1">
                {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      metronome.currentBeat === i
                        ? i === 0 ? "bg-primary scale-125" : "bg-accent-foreground"
                        : "bg-secondary"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="ml-auto flex gap-1 bg-secondary rounded-lg p-0.5">
            <button
              onClick={() => setClef("treble")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                clef === "treble" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              𝄞 Treble
            </button>
            <button
              onClick={() => setClef("bass")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                clef === "bass" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              𝄢 Bass
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 pb-24">
        <div className="bg-card rounded-2xl border border-border/50 p-4 overflow-hidden">
          <LeadSheetStaffView
            sheet={sheet}
            meter={meter}
            title={song.title || undefined}
            artist={song.artist || undefined}
            songKey={songKey || undefined}
            clef={clef}
            activeMeasureIndex={playing ? activeMeasure : undefined}
            activeBeat={playing ? activeBeat : undefined}
          />
        </div>
      </main>
    </div>
  );
}

// ── Thin wrapper so each section item can own its useDragControls hook ──
function ReorderSection({
  section,
  children,
}: {
  section: import("@/data/songs").SongSection;
  children: (dragControls: ReturnType<typeof useDragControls>) => React.ReactNode;
}) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      value={section}
      dragListener={false}
      dragControls={dragControls}
      className="list-none"
      whileDrag={{ scale: 1.02, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
    >
      {children(dragControls)}
    </Reorder.Item>
  );
}
