import { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, Undo2, Sparkles } from "lucide-react";
import { saveCustomPianoVoicing } from "@/data/pianoChords";

interface PianoVoicingCreatorProps {
  onClose: () => void;
  onSaved: () => void;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BLACK_SEMITONES = [1, 3, 6, 8, 10];

function midiToName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[midi % 12]}${octave}`;
}

function isBlackKey(semitone: number): boolean {
  return BLACK_SEMITONES.includes(semitone % 12);
}

// Chord detection from MIDI note pitch classes
const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const PREFERRED_ROOT: Record<number, string> = {
  0: "C", 1: "C#", 2: "D", 3: "Eb", 4: "E", 5: "F",
  6: "F#", 7: "G", 8: "Ab", 9: "A", 10: "Bb", 11: "B",
};

function mod12(n: number) { return ((n % 12) + 12) % 12; }

function getPitchClasses(midi: number[]): number[] {
  const pcs = new Set(midi.map(m => mod12(m)));
  return [...pcs].sort((a, b) => a - b);
}

interface ChordTemplate {
  name: string;
  intervals: number[];
  optional?: number[];
  priority: number;
}

const CHORD_TEMPLATES: ChordTemplate[] = [
  // Triads (require root, 3rd; 5th optional)
  { name: "", intervals: [0, 4], optional: [7], priority: 10 },
  { name: "m", intervals: [0, 3], optional: [7], priority: 10 },
  { name: "dim", intervals: [0, 3, 6], priority: 12 },
  { name: "aug", intervals: [0, 4, 8], priority: 12 },
  { name: "sus4", intervals: [0, 5], optional: [7], priority: 11 },
  { name: "sus2", intervals: [0, 2], optional: [7], priority: 11 },
  // Sevenths (require root, 3rd, 7th; 5th optional)
  { name: "maj7", intervals: [0, 4, 11], optional: [7], priority: 5 },
  { name: "7", intervals: [0, 4, 10], optional: [7], priority: 5 },
  { name: "m7", intervals: [0, 3, 10], optional: [7], priority: 5 },
  { name: "minmaj7", intervals: [0, 3, 11], optional: [7], priority: 5 },
  { name: "dim7", intervals: [0, 3, 6, 9], priority: 6 },
  { name: "m7b5", intervals: [0, 3, 6, 10], priority: 6 },
  { name: "7sus4", intervals: [0, 5, 10], optional: [7], priority: 6 },
  { name: "7sus2", intervals: [0, 2, 10], optional: [7], priority: 6 },
  // Sixths
  { name: "6", intervals: [0, 4, 9], optional: [7], priority: 7 },
  { name: "m6", intervals: [0, 3, 9], optional: [7], priority: 7 },
  // Dominant 7th with alterations
  { name: "7b5", intervals: [0, 4, 6, 10], priority: 4 },
  { name: "7#5", intervals: [0, 4, 8, 10], priority: 4 },
  // Extended
  { name: "9", intervals: [0, 4, 10, 14], optional: [7], priority: 3 },
  { name: "maj9", intervals: [0, 4, 11, 14], optional: [7], priority: 3 },
  { name: "m9", intervals: [0, 3, 10, 14], optional: [7], priority: 3 },
  { name: "add9", intervals: [0, 4, 14], optional: [7], priority: 4 },
  { name: "7b9", intervals: [0, 4, 10, 13], optional: [7], priority: 3 },
  { name: "7#9", intervals: [0, 4, 10, 15], optional: [7], priority: 3 },
  { name: "69", intervals: [0, 4, 9, 14], optional: [7], priority: 3 },
];

function noteName(pc: number): string {
  return PREFERRED_ROOT[pc] ?? NOTE_NAMES_SHARP[pc];
}

interface DetectedChord { label: string; root: string; suffix: string; bass: string | null; }

function detectPianoChord(midiNotes: number[]): DetectedChord[] {
  if (midiNotes.length < 2) return [];
  const pitchClasses = getPitchClasses(midiNotes);
  const bassPc = mod12(Math.min(...midiNotes));
  const matches: { label: string; root: string; suffix: string; bass: string | null; score: number }[] = [];

  for (let rootPc = 0; rootPc < 12; rootPc++) {
    if (!pitchClasses.includes(rootPc)) continue;
    for (const template of CHORD_TEMPLATES) {
      const requiredPcs = template.intervals.map(i => mod12(rootPc + i));
      if (!requiredPcs.every(rpc => pitchClasses.includes(rpc))) continue;
      // Include optional intervals in the template set
      const allTemplatePcs = new Set(requiredPcs);
      if (template.optional) {
        template.optional.forEach(i => allTemplatePcs.add(mod12(rootPc + i)));
      }
      const unmatched = pitchClasses.filter(pc => !allTemplatePcs.has(pc)).length;
      const score = template.priority + unmatched * 5;
      const rootName = noteName(rootPc);
      const bassName = noteName(bassPc);
      const isInversion = bassPc !== rootPc;
      const label = isInversion ? `${rootName}${template.name}/${bassName}` : `${rootName}${template.name}`;
      matches.push({ root: rootName, suffix: template.name, bass: isInversion ? bassName : null, label, score: score + (isInversion ? 3 : 0) });
    }
  }

  matches.sort((a, b) => a.score - b.score);
  const seen = new Set<string>();
  return matches.filter(m => { if (!seen.has(m.label)) { seen.add(m.label); return true; } return false; }).slice(0, 8);
}

export default function PianoVoicingCreator({ onClose, onSaved }: PianoVoicingCreatorProps) {
  const [notes, setNotes] = useState<number[]>([]);
  const [chordLabel, setChordLabel] = useState("");
  const [voicingName, setVoicingName] = useState("Custom");
  const [suggestions, setSuggestions] = useState<DetectedChord[]>([]);
  const [suggestionIdx, setSuggestionIdx] = useState(0);

  // Build keyboard: C3 (48) to B5 (83) = 36 semitones
  const whiteKeys: number[] = [];
  const blackKeys: { midi: number; whiteIndex: number }[] = [];

  for (let midi = 48; midi < 84; midi++) {
    if (!isBlackKey(midi)) whiteKeys.push(midi);
  }
  for (let midi = 48; midi < 84; midi++) {
    if (isBlackKey(midi)) {
      let wkIdx = 0;
      for (let j = 0; j < whiteKeys.length; j++) {
        if (whiteKeys[j] < midi) wkIdx = j;
      }
      blackKeys.push({ midi, whiteIndex: wkIdx });
    }
  }

  function handleDetect() {
    const detected = detectPianoChord(notes);
    setSuggestions(detected);
    setSuggestionIdx(0);
    if (detected.length > 0) {
      setChordLabel(detected[0].label);
    }
  }

  function handlePickSuggestion(i: number) {
    setSuggestionIdx(i);
    setChordLabel(suggestions[i].label);
  }

  function toggleNote(midi: number) {
    setNotes(prev =>
      prev.includes(midi)
        ? prev.filter(n => n !== midi)
        : [...prev, midi].sort((a, b) => a - b)
    );
    setSuggestions([]);
  }

  function parseLabel(label: string): { key: string; suffix: string } {
    const mainPart = label.replace(/\/.*$/, "").trim();
    let root = mainPart[0] || "C";
    let suffix = mainPart.substring(1);
    if (mainPart.length >= 2 && (mainPart[1] === "#" || mainPart[1] === "b")) {
      root = mainPart.substring(0, 2);
      suffix = mainPart.substring(2);
    }
    if (!suffix) suffix = "major";
    return { key: root, suffix };
  }

  function handleSave() {
    if (notes.length < 2 || !chordLabel.trim()) return;
    const { key, suffix } = parseLabel(chordLabel.trim());
    saveCustomPianoVoicing({
      chordKey: key,
      suffix,
      label: chordLabel.trim(),
      voicing: { name: voicingName || "Custom", notes },
    });
    onSaved();
    onClose();
  }

  const whiteKeyW = 26;
  const whiteKeyH = 100;
  const blackKeyW = 16;
  const blackKeyH = 60;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto"
    >
      <div className="max-w-lg mx-auto px-4 py-4 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold tracking-tighter text-foreground">
            Create Piano Voicing
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chord name */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Chord Name</p>
          <input
            type="text"
            value={chordLabel}
            onChange={e => setChordLabel(e.target.value)}
            placeholder="e.g. Cmaj7, Am, G7/B"
            className="w-full px-3 py-2 bg-surface rounded-xl text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Detect + suggestions */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={handleDetect}
            disabled={notes.length < 2}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent/20 text-accent-foreground hover:bg-accent/30 text-sm font-semibold transition-colors disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4" />
            Detect Chord
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {suggestions.map((s, i) => (
              <button
                key={s.label}
                onClick={() => handlePickSuggestion(i)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  i === suggestionIdx
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Voicing name */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Voicing Name</p>
          <input
            type="text"
            value={voicingName}
            onChange={e => setVoicingName(e.target.value)}
            placeholder="e.g. Root, Open Voicing"
            className="w-full px-3 py-2 bg-surface rounded-xl text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Chord label + selected notes */}
        {chordLabel && (
          <div className="text-center mb-2">
            <span className="text-3xl font-semibold tracking-tighter text-foreground">{chordLabel}</span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3 flex-wrap min-h-[32px]">
          {notes.length > 0 ? (
            <>
              {notes.map(midi => (
                <span
                  key={midi}
                  onClick={() => toggleNote(midi)}
                  className="px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs font-mono font-bold cursor-pointer hover:bg-primary/30 transition-colors"
                >
                  {midiToName(midi)}
                </span>
              ))}
              <button onClick={() => setNotes([])} className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Clear all">
                <Undo2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Click keys on the piano below to add notes</p>
          )}
        </div>

        {/* Interactive piano */}
        <div className="w-full overflow-x-auto pb-2 mb-4 touch-pan-x">
          <div className="relative" style={{ width: whiteKeys.length * whiteKeyW, height: whiteKeyH + 10 }}>
            {whiteKeys.map((midi, i) => {
              const active = notes.includes(midi);
              return (
                <button
                  key={`w-${midi}`}
                  onClick={() => toggleNote(midi)}
                  className={`absolute rounded-b-md border border-border/40 transition-all ${
                    active ? "bg-primary text-primary-foreground shadow-lg z-10" : "bg-foreground/90 text-background hover:bg-foreground/70"
                  }`}
                  style={{ left: i * whiteKeyW, top: 0, width: whiteKeyW - 1, height: whiteKeyH }}
                >
                  <span className="text-[7px] font-bold font-mono absolute bottom-1 left-1/2 -translate-x-1/2">
                    {midiToName(midi)}
                  </span>
                </button>
              );
            })}
            {blackKeys.map(({ midi, whiteIndex }) => {
              const active = notes.includes(midi);
              return (
                <button
                  key={`b-${midi}`}
                  onClick={() => toggleNote(midi)}
                  className={`absolute rounded-b-md border border-border/30 transition-all z-20 ${
                    active ? "bg-accent text-accent-foreground shadow-lg" : "bg-background text-foreground/70 hover:bg-background/80"
                  }`}
                  style={{ left: (whiteIndex + 1) * whiteKeyW - blackKeyW / 2, top: 0, width: blackKeyW, height: blackKeyH }}
                >
                  <span className="text-[5px] font-bold font-mono absolute bottom-1 left-1/2 -translate-x-1/2">
                    {midiToName(midi).replace(/\d/, "")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-xs text-muted-foreground">
            {notes.length} note{notes.length !== 1 ? "s" : ""} selected
            {notes.length > 0 && <span className="font-mono ml-2">[{notes.join(", ")}]</span>}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={notes.length < 2 || !chordLabel.trim()}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          <Save className="w-4 h-4" />
          Save {chordLabel || "Voicing"}
        </button>
      </div>
    </motion.div>
  );
}
