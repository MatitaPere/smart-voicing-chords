export interface PianoChordVoicing {
  name: string;
  notes: number[]; // MIDI note numbers (e.g. 60 = C4)
}

export interface PianoChord {
  key: string;
  suffix: string;
  label: string;
  voicings: PianoChordVoicing[];
}

// MIDI note mapping: C4 = 60
const NOTE_MAP: Record<string, number> = {
  "C": 60, "C#": 61, "Db": 61, "D": 62, "D#": 63, "Eb": 63,
  "E": 64, "F": 65, "F#": 66, "Gb": 66, "G": 67, "G#": 68, "Ab": 68,
  "A": 69, "A#": 70, "Bb": 70, "B": 71,
};

function pv(name: string, notes: number[]): PianoChordVoicing {
  return { name, notes };
}

function n(root: string, ...intervals: number[]): number[] {
  const base = NOTE_MAP[root] ?? 60;
  return intervals.map(i => base + i);
}

const pianoChordData: PianoChord[] = [
  // === MAJOR ===
  { key: "C", suffix: "major", label: "C", voicings: [
    pv("Root", n("C", 0, 4, 7)),
    pv("1st Inv", n("C", 4, 7, 12)),
    pv("2nd Inv", n("C", 7, 12, 16)),
  ]},
  { key: "C#", suffix: "major", label: "C#", voicings: [
    pv("Root", n("C#", 0, 4, 7)),
    pv("1st Inv", n("C#", 4, 7, 12)),
    pv("2nd Inv", n("C#", 7, 12, 16)),
  ]},
  { key: "D", suffix: "major", label: "D", voicings: [
    pv("Root", n("D", 0, 4, 7)),
    pv("1st Inv", n("D", 4, 7, 12)),
    pv("2nd Inv", n("D", 7, 12, 16)),
  ]},
  { key: "Eb", suffix: "major", label: "Eb", voicings: [
    pv("Root", n("Eb", 0, 4, 7)),
    pv("1st Inv", n("Eb", 4, 7, 12)),
    pv("2nd Inv", n("Eb", 7, 12, 16)),
  ]},
  { key: "E", suffix: "major", label: "E", voicings: [
    pv("Root", n("E", 0, 4, 7)),
    pv("1st Inv", n("E", 4, 7, 12)),
    pv("2nd Inv", n("E", 7, 12, 16)),
  ]},
  { key: "F", suffix: "major", label: "F", voicings: [
    pv("Root", n("F", 0, 4, 7)),
    pv("1st Inv", n("F", 4, 7, 12)),
    pv("2nd Inv", n("F", 7, 12, 16)),
  ]},
  { key: "F#", suffix: "major", label: "F#", voicings: [
    pv("Root", n("F#", 0, 4, 7)),
    pv("1st Inv", n("F#", 4, 7, 12)),
    pv("2nd Inv", n("F#", 7, 12, 16)),
  ]},
  { key: "G", suffix: "major", label: "G", voicings: [
    pv("Root", n("G", 0, 4, 7)),
    pv("1st Inv", n("G", 4, 7, 12)),
    pv("2nd Inv", n("G", 7, 12, 16)),
  ]},
  { key: "Ab", suffix: "major", label: "Ab", voicings: [
    pv("Root", n("Ab", 0, 4, 7)),
    pv("1st Inv", n("Ab", 4, 7, 12)),
    pv("2nd Inv", n("Ab", 7, 12, 16)),
  ]},
  { key: "A", suffix: "major", label: "A", voicings: [
    pv("Root", n("A", 0, 4, 7)),
    pv("1st Inv", n("A", 4, 7, 12)),
    pv("2nd Inv", n("A", 7, 12, 16)),
  ]},
  { key: "Bb", suffix: "major", label: "Bb", voicings: [
    pv("Root", n("Bb", 0, 4, 7)),
    pv("1st Inv", n("Bb", 4, 7, 12)),
    pv("2nd Inv", n("Bb", 7, 12, 16)),
  ]},
  { key: "B", suffix: "major", label: "B", voicings: [
    pv("Root", n("B", 0, 4, 7)),
    pv("1st Inv", n("B", 4, 7, 12)),
    pv("2nd Inv", n("B", 7, 12, 16)),
  ]},

  // === MINOR ===
  { key: "C", suffix: "minor", label: "Cm", voicings: [
    pv("Root", n("C", 0, 3, 7)),
    pv("1st Inv", n("C", 3, 7, 12)),
    pv("2nd Inv", n("C", 7, 12, 15)),
  ]},
  { key: "C#", suffix: "minor", label: "C#m", voicings: [
    pv("Root", n("C#", 0, 3, 7)),
    pv("1st Inv", n("C#", 3, 7, 12)),
    pv("2nd Inv", n("C#", 7, 12, 15)),
  ]},
  { key: "D", suffix: "minor", label: "Dm", voicings: [
    pv("Root", n("D", 0, 3, 7)),
    pv("1st Inv", n("D", 3, 7, 12)),
    pv("2nd Inv", n("D", 7, 12, 15)),
  ]},
  { key: "Eb", suffix: "minor", label: "Ebm", voicings: [
    pv("Root", n("Eb", 0, 3, 7)),
    pv("1st Inv", n("Eb", 3, 7, 12)),
    pv("2nd Inv", n("Eb", 7, 12, 15)),
  ]},
  { key: "E", suffix: "minor", label: "Em", voicings: [
    pv("Root", n("E", 0, 3, 7)),
    pv("1st Inv", n("E", 3, 7, 12)),
    pv("2nd Inv", n("E", 7, 12, 15)),
  ]},
  { key: "F", suffix: "minor", label: "Fm", voicings: [
    pv("Root", n("F", 0, 3, 7)),
    pv("1st Inv", n("F", 3, 7, 12)),
    pv("2nd Inv", n("F", 7, 12, 15)),
  ]},
  { key: "F#", suffix: "minor", label: "F#m", voicings: [
    pv("Root", n("F#", 0, 3, 7)),
    pv("1st Inv", n("F#", 3, 7, 12)),
    pv("2nd Inv", n("F#", 7, 12, 15)),
  ]},
  { key: "G", suffix: "minor", label: "Gm", voicings: [
    pv("Root", n("G", 0, 3, 7)),
    pv("1st Inv", n("G", 3, 7, 12)),
    pv("2nd Inv", n("G", 7, 12, 15)),
  ]},
  { key: "Ab", suffix: "minor", label: "Abm", voicings: [
    pv("Root", n("Ab", 0, 3, 7)),
    pv("1st Inv", n("Ab", 3, 7, 12)),
    pv("2nd Inv", n("Ab", 7, 12, 15)),
  ]},
  { key: "A", suffix: "minor", label: "Am", voicings: [
    pv("Root", n("A", 0, 3, 7)),
    pv("1st Inv", n("A", 3, 7, 12)),
    pv("2nd Inv", n("A", 7, 12, 15)),
  ]},
  { key: "Bb", suffix: "minor", label: "Bbm", voicings: [
    pv("Root", n("Bb", 0, 3, 7)),
    pv("1st Inv", n("Bb", 3, 7, 12)),
    pv("2nd Inv", n("Bb", 7, 12, 15)),
  ]},
  { key: "B", suffix: "minor", label: "Bm", voicings: [
    pv("Root", n("B", 0, 3, 7)),
    pv("1st Inv", n("B", 3, 7, 12)),
    pv("2nd Inv", n("B", 7, 12, 15)),
  ]},

  // === DOMINANT 7 ===
  { key: "C", suffix: "7", label: "C7", voicings: [
    pv("Root", n("C", 0, 4, 7, 10)),
    pv("1st Inv", n("C", 4, 7, 10, 12)),
  ]},
  { key: "C#", suffix: "7", label: "C#7", voicings: [
    pv("Root", n("C#", 0, 4, 7, 10)),
    pv("1st Inv", n("C#", 4, 7, 10, 12)),
  ]},
  { key: "D", suffix: "7", label: "D7", voicings: [
    pv("Root", n("D", 0, 4, 7, 10)),
    pv("1st Inv", n("D", 4, 7, 10, 12)),
  ]},
  { key: "Eb", suffix: "7", label: "Eb7", voicings: [
    pv("Root", n("Eb", 0, 4, 7, 10)),
    pv("1st Inv", n("Eb", 4, 7, 10, 12)),
  ]},
  { key: "E", suffix: "7", label: "E7", voicings: [
    pv("Root", n("E", 0, 4, 7, 10)),
    pv("1st Inv", n("E", 4, 7, 10, 12)),
  ]},
  { key: "F", suffix: "7", label: "F7", voicings: [
    pv("Root", n("F", 0, 4, 7, 10)),
    pv("1st Inv", n("F", 4, 7, 10, 12)),
  ]},
  { key: "F#", suffix: "7", label: "F#7", voicings: [
    pv("Root", n("F#", 0, 4, 7, 10)),
    pv("1st Inv", n("F#", 4, 7, 10, 12)),
  ]},
  { key: "G", suffix: "7", label: "G7", voicings: [
    pv("Root", n("G", 0, 4, 7, 10)),
    pv("1st Inv", n("G", 4, 7, 10, 12)),
  ]},
  { key: "Ab", suffix: "7", label: "Ab7", voicings: [
    pv("Root", n("Ab", 0, 4, 7, 10)),
    pv("1st Inv", n("Ab", 4, 7, 10, 12)),
  ]},
  { key: "A", suffix: "7", label: "A7", voicings: [
    pv("Root", n("A", 0, 4, 7, 10)),
    pv("1st Inv", n("A", 4, 7, 10, 12)),
  ]},
  { key: "Bb", suffix: "7", label: "Bb7", voicings: [
    pv("Root", n("Bb", 0, 4, 7, 10)),
    pv("1st Inv", n("Bb", 4, 7, 10, 12)),
  ]},
  { key: "B", suffix: "7", label: "B7", voicings: [
    pv("Root", n("B", 0, 4, 7, 10)),
    pv("1st Inv", n("B", 4, 7, 10, 12)),
  ]},

  // === MINOR 7 ===
  { key: "C", suffix: "m7", label: "Cm7", voicings: [
    pv("Root", n("C", 0, 3, 7, 10)),
    pv("1st Inv", n("C", 3, 7, 10, 12)),
  ]},
  { key: "C#", suffix: "m7", label: "C#m7", voicings: [
    pv("Root", n("C#", 0, 3, 7, 10)),
    pv("1st Inv", n("C#", 3, 7, 10, 12)),
  ]},
  { key: "D", suffix: "m7", label: "Dm7", voicings: [
    pv("Root", n("D", 0, 3, 7, 10)),
    pv("1st Inv", n("D", 3, 7, 10, 12)),
  ]},
  { key: "Eb", suffix: "m7", label: "Ebm7", voicings: [
    pv("Root", n("Eb", 0, 3, 7, 10)),
    pv("1st Inv", n("Eb", 3, 7, 10, 12)),
  ]},
  { key: "E", suffix: "m7", label: "Em7", voicings: [
    pv("Root", n("E", 0, 3, 7, 10)),
    pv("1st Inv", n("E", 3, 7, 10, 12)),
  ]},
  { key: "F", suffix: "m7", label: "Fm7", voicings: [
    pv("Root", n("F", 0, 3, 7, 10)),
    pv("1st Inv", n("F", 3, 7, 10, 12)),
  ]},
  { key: "F#", suffix: "m7", label: "F#m7", voicings: [
    pv("Root", n("F#", 0, 3, 7, 10)),
    pv("1st Inv", n("F#", 3, 7, 10, 12)),
  ]},
  { key: "G", suffix: "m7", label: "Gm7", voicings: [
    pv("Root", n("G", 0, 3, 7, 10)),
    pv("1st Inv", n("G", 3, 7, 10, 12)),
  ]},
  { key: "Ab", suffix: "m7", label: "Abm7", voicings: [
    pv("Root", n("Ab", 0, 3, 7, 10)),
    pv("1st Inv", n("Ab", 3, 7, 10, 12)),
  ]},
  { key: "A", suffix: "m7", label: "Am7", voicings: [
    pv("Root", n("A", 0, 3, 7, 10)),
    pv("1st Inv", n("A", 3, 7, 10, 12)),
  ]},
  { key: "Bb", suffix: "m7", label: "Bbm7", voicings: [
    pv("Root", n("Bb", 0, 3, 7, 10)),
    pv("1st Inv", n("Bb", 3, 7, 10, 12)),
  ]},
  { key: "B", suffix: "m7", label: "Bm7", voicings: [
    pv("Root", n("B", 0, 3, 7, 10)),
    pv("1st Inv", n("B", 3, 7, 10, 12)),
  ]},

  // === MAJ7 ===
  { key: "C", suffix: "maj7", label: "Cmaj7", voicings: [pv("Root", n("C", 0, 4, 7, 11)), pv("1st Inv", n("C", 4, 7, 11, 12))] },
  { key: "C#", suffix: "maj7", label: "C#maj7", voicings: [pv("Root", n("C#", 0, 4, 7, 11)), pv("1st Inv", n("C#", 4, 7, 11, 12))] },
  { key: "D", suffix: "maj7", label: "Dmaj7", voicings: [pv("Root", n("D", 0, 4, 7, 11)), pv("1st Inv", n("D", 4, 7, 11, 12))] },
  { key: "Eb", suffix: "maj7", label: "Ebmaj7", voicings: [pv("Root", n("Eb", 0, 4, 7, 11)), pv("1st Inv", n("Eb", 4, 7, 11, 12))] },
  { key: "E", suffix: "maj7", label: "Emaj7", voicings: [pv("Root", n("E", 0, 4, 7, 11)), pv("1st Inv", n("E", 4, 7, 11, 12))] },
  { key: "F", suffix: "maj7", label: "Fmaj7", voicings: [pv("Root", n("F", 0, 4, 7, 11)), pv("1st Inv", n("F", 4, 7, 11, 12))] },
  { key: "F#", suffix: "maj7", label: "F#maj7", voicings: [pv("Root", n("F#", 0, 4, 7, 11)), pv("1st Inv", n("F#", 4, 7, 11, 12))] },
  { key: "G", suffix: "maj7", label: "Gmaj7", voicings: [pv("Root", n("G", 0, 4, 7, 11)), pv("1st Inv", n("G", 4, 7, 11, 12))] },
  { key: "Ab", suffix: "maj7", label: "Abmaj7", voicings: [pv("Root", n("Ab", 0, 4, 7, 11)), pv("1st Inv", n("Ab", 4, 7, 11, 12))] },
  { key: "A", suffix: "maj7", label: "Amaj7", voicings: [pv("Root", n("A", 0, 4, 7, 11)), pv("1st Inv", n("A", 4, 7, 11, 12))] },
  { key: "Bb", suffix: "maj7", label: "Bbmaj7", voicings: [pv("Root", n("Bb", 0, 4, 7, 11)), pv("1st Inv", n("Bb", 4, 7, 11, 12))] },
  { key: "B", suffix: "maj7", label: "Bmaj7", voicings: [pv("Root", n("B", 0, 4, 7, 11)), pv("1st Inv", n("B", 4, 7, 11, 12))] },

  // === DIM ===
  { key: "C", suffix: "dim", label: "Cdim", voicings: [pv("Root", n("C", 0, 3, 6))] },
  { key: "C#", suffix: "dim", label: "C#dim", voicings: [pv("Root", n("C#", 0, 3, 6))] },
  { key: "D", suffix: "dim", label: "Ddim", voicings: [pv("Root", n("D", 0, 3, 6))] },
  { key: "Eb", suffix: "dim", label: "Ebdim", voicings: [pv("Root", n("Eb", 0, 3, 6))] },
  { key: "E", suffix: "dim", label: "Edim", voicings: [pv("Root", n("E", 0, 3, 6))] },
  { key: "F", suffix: "dim", label: "Fdim", voicings: [pv("Root", n("F", 0, 3, 6))] },
  { key: "F#", suffix: "dim", label: "F#dim", voicings: [pv("Root", n("F#", 0, 3, 6))] },
  { key: "G", suffix: "dim", label: "Gdim", voicings: [pv("Root", n("G", 0, 3, 6))] },
  { key: "Ab", suffix: "dim", label: "Abdim", voicings: [pv("Root", n("Ab", 0, 3, 6))] },
  { key: "A", suffix: "dim", label: "Adim", voicings: [pv("Root", n("A", 0, 3, 6))] },
  { key: "Bb", suffix: "dim", label: "Bbdim", voicings: [pv("Root", n("Bb", 0, 3, 6))] },
  { key: "B", suffix: "dim", label: "Bdim", voicings: [pv("Root", n("B", 0, 3, 6))] },

  // === AUG ===
  { key: "C", suffix: "aug", label: "Caug", voicings: [pv("Root", n("C", 0, 4, 8))] },
  { key: "C#", suffix: "aug", label: "C#aug", voicings: [pv("Root", n("C#", 0, 4, 8))] },
  { key: "D", suffix: "aug", label: "Daug", voicings: [pv("Root", n("D", 0, 4, 8))] },
  { key: "Eb", suffix: "aug", label: "Ebaug", voicings: [pv("Root", n("Eb", 0, 4, 8))] },
  { key: "E", suffix: "aug", label: "Eaug", voicings: [pv("Root", n("E", 0, 4, 8))] },
  { key: "F", suffix: "aug", label: "Faug", voicings: [pv("Root", n("F", 0, 4, 8))] },
  { key: "F#", suffix: "aug", label: "F#aug", voicings: [pv("Root", n("F#", 0, 4, 8))] },
  { key: "G", suffix: "aug", label: "Gaug", voicings: [pv("Root", n("G", 0, 4, 8))] },
  { key: "Ab", suffix: "aug", label: "Abaug", voicings: [pv("Root", n("Ab", 0, 4, 8))] },
  { key: "A", suffix: "aug", label: "Aaug", voicings: [pv("Root", n("A", 0, 4, 8))] },
  { key: "Bb", suffix: "aug", label: "Bbaug", voicings: [pv("Root", n("Bb", 0, 4, 8))] },
  { key: "B", suffix: "aug", label: "Baug", voicings: [pv("Root", n("B", 0, 4, 8))] },

  // === SUS4 ===
  { key: "C", suffix: "sus4", label: "Csus4", voicings: [pv("Root", n("C", 0, 5, 7))] },
  { key: "C#", suffix: "sus4", label: "C#sus4", voicings: [pv("Root", n("C#", 0, 5, 7))] },
  { key: "D", suffix: "sus4", label: "Dsus4", voicings: [pv("Root", n("D", 0, 5, 7))] },
  { key: "Eb", suffix: "sus4", label: "Ebsus4", voicings: [pv("Root", n("Eb", 0, 5, 7))] },
  { key: "E", suffix: "sus4", label: "Esus4", voicings: [pv("Root", n("E", 0, 5, 7))] },
  { key: "F", suffix: "sus4", label: "Fsus4", voicings: [pv("Root", n("F", 0, 5, 7))] },
  { key: "F#", suffix: "sus4", label: "F#sus4", voicings: [pv("Root", n("F#", 0, 5, 7))] },
  { key: "G", suffix: "sus4", label: "Gsus4", voicings: [pv("Root", n("G", 0, 5, 7))] },
  { key: "Ab", suffix: "sus4", label: "Absus4", voicings: [pv("Root", n("Ab", 0, 5, 7))] },
  { key: "A", suffix: "sus4", label: "Asus4", voicings: [pv("Root", n("A", 0, 5, 7))] },
  { key: "Bb", suffix: "sus4", label: "Bbsus4", voicings: [pv("Root", n("Bb", 0, 5, 7))] },
  { key: "B", suffix: "sus4", label: "Bsus4", voicings: [pv("Root", n("B", 0, 5, 7))] },

  // === SUS2 ===
  { key: "C", suffix: "sus2", label: "Csus2", voicings: [pv("Root", n("C", 0, 2, 7))] },
  { key: "C#", suffix: "sus2", label: "C#sus2", voicings: [pv("Root", n("C#", 0, 2, 7))] },
  { key: "D", suffix: "sus2", label: "Dsus2", voicings: [pv("Root", n("D", 0, 2, 7))] },
  { key: "Eb", suffix: "sus2", label: "Ebsus2", voicings: [pv("Root", n("Eb", 0, 2, 7))] },
  { key: "E", suffix: "sus2", label: "Esus2", voicings: [pv("Root", n("E", 0, 2, 7))] },
  { key: "F", suffix: "sus2", label: "Fsus2", voicings: [pv("Root", n("F", 0, 2, 7))] },
  { key: "F#", suffix: "sus2", label: "F#sus2", voicings: [pv("Root", n("F#", 0, 2, 7))] },
  { key: "G", suffix: "sus2", label: "Gsus2", voicings: [pv("Root", n("G", 0, 2, 7))] },
  { key: "Ab", suffix: "sus2", label: "Absus2", voicings: [pv("Root", n("Ab", 0, 2, 7))] },
  { key: "A", suffix: "sus2", label: "Asus2", voicings: [pv("Root", n("A", 0, 2, 7))] },
  { key: "Bb", suffix: "sus2", label: "Bbsus2", voicings: [pv("Root", n("Bb", 0, 2, 7))] },
  { key: "B", suffix: "sus2", label: "Bsus2", voicings: [pv("Root", n("B", 0, 2, 7))] },
  // === 9 ===
  { key: "C", suffix: "9", label: "C9", voicings: [pv("Root", n("C", 0, 4, 7, 10, 14))] },
  { key: "C#", suffix: "9", label: "C#9", voicings: [pv("Root", n("C#", 0, 4, 7, 10, 14))] },
  { key: "D", suffix: "9", label: "D9", voicings: [pv("Root", n("D", 0, 4, 7, 10, 14))] },
  { key: "Eb", suffix: "9", label: "Eb9", voicings: [pv("Root", n("Eb", 0, 4, 7, 10, 14))] },
  { key: "E", suffix: "9", label: "E9", voicings: [pv("Root", n("E", 0, 4, 7, 10, 14))] },
  { key: "F", suffix: "9", label: "F9", voicings: [pv("Root", n("F", 0, 4, 7, 10, 14))] },
  { key: "F#", suffix: "9", label: "F#9", voicings: [pv("Root", n("F#", 0, 4, 7, 10, 14))] },
  { key: "G", suffix: "9", label: "G9", voicings: [pv("Root", n("G", 0, 4, 7, 10, 14))] },
  { key: "Ab", suffix: "9", label: "Ab9", voicings: [pv("Root", n("Ab", 0, 4, 7, 10, 14))] },
  { key: "A", suffix: "9", label: "A9", voicings: [pv("Root", n("A", 0, 4, 7, 10, 14))] },
  { key: "Bb", suffix: "9", label: "Bb9", voicings: [pv("Root", n("Bb", 0, 4, 7, 10, 14))] },
  { key: "B", suffix: "9", label: "B9", voicings: [pv("Root", n("B", 0, 4, 7, 10, 14))] },
  // === M9 ===
  { key: "C", suffix: "m9", label: "Cm9", voicings: [pv("Root", n("C", 0, 3, 7, 10, 14))] },
  { key: "C#", suffix: "m9", label: "C#m9", voicings: [pv("Root", n("C#", 0, 3, 7, 10, 14))] },
  { key: "D", suffix: "m9", label: "Dm9", voicings: [pv("Root", n("D", 0, 3, 7, 10, 14))] },
  { key: "Eb", suffix: "m9", label: "Ebm9", voicings: [pv("Root", n("Eb", 0, 3, 7, 10, 14))] },
  { key: "E", suffix: "m9", label: "Em9", voicings: [pv("Root", n("E", 0, 3, 7, 10, 14))] },
  { key: "F", suffix: "m9", label: "Fm9", voicings: [pv("Root", n("F", 0, 3, 7, 10, 14))] },
  { key: "F#", suffix: "m9", label: "F#m9", voicings: [pv("Root", n("F#", 0, 3, 7, 10, 14))] },
  { key: "G", suffix: "m9", label: "Gm9", voicings: [pv("Root", n("G", 0, 3, 7, 10, 14))] },
  { key: "Ab", suffix: "m9", label: "Abm9", voicings: [pv("Root", n("Ab", 0, 3, 7, 10, 14))] },
  { key: "A", suffix: "m9", label: "Am9", voicings: [pv("Root", n("A", 0, 3, 7, 10, 14))] },
  { key: "Bb", suffix: "m9", label: "Bbm9", voicings: [pv("Root", n("Bb", 0, 3, 7, 10, 14))] },
  { key: "B", suffix: "m9", label: "Bm9", voicings: [pv("Root", n("B", 0, 3, 7, 10, 14))] },
  // === MAJ9 ===
  { key: "C", suffix: "maj9", label: "Cmaj9", voicings: [pv("Root", n("C", 0, 4, 7, 11, 14))] },
  { key: "C#", suffix: "maj9", label: "C#maj9", voicings: [pv("Root", n("C#", 0, 4, 7, 11, 14))] },
  { key: "D", suffix: "maj9", label: "Dmaj9", voicings: [pv("Root", n("D", 0, 4, 7, 11, 14))] },
  { key: "Eb", suffix: "maj9", label: "Ebmaj9", voicings: [pv("Root", n("Eb", 0, 4, 7, 11, 14))] },
  { key: "E", suffix: "maj9", label: "Emaj9", voicings: [pv("Root", n("E", 0, 4, 7, 11, 14))] },
  { key: "F", suffix: "maj9", label: "Fmaj9", voicings: [pv("Root", n("F", 0, 4, 7, 11, 14))] },
  { key: "F#", suffix: "maj9", label: "F#maj9", voicings: [pv("Root", n("F#", 0, 4, 7, 11, 14))] },
  { key: "G", suffix: "maj9", label: "Gmaj9", voicings: [pv("Root", n("G", 0, 4, 7, 11, 14))] },
  { key: "Ab", suffix: "maj9", label: "Abmaj9", voicings: [pv("Root", n("Ab", 0, 4, 7, 11, 14))] },
  { key: "A", suffix: "maj9", label: "Amaj9", voicings: [pv("Root", n("A", 0, 4, 7, 11, 14))] },
  { key: "Bb", suffix: "maj9", label: "Bbmaj9", voicings: [pv("Root", n("Bb", 0, 4, 7, 11, 14))] },
  { key: "B", suffix: "maj9", label: "Bmaj9", voicings: [pv("Root", n("B", 0, 4, 7, 11, 14))] },
  // === 11 ===
  { key: "C", suffix: "11", label: "C11", voicings: [pv("Root", n("C", 0, 4, 7, 10, 14, 17))] },
  { key: "C#", suffix: "11", label: "C#11", voicings: [pv("Root", n("C#", 0, 4, 7, 10, 14, 17))] },
  { key: "D", suffix: "11", label: "D11", voicings: [pv("Root", n("D", 0, 4, 7, 10, 14, 17))] },
  { key: "Eb", suffix: "11", label: "Eb11", voicings: [pv("Root", n("Eb", 0, 4, 7, 10, 14, 17))] },
  { key: "E", suffix: "11", label: "E11", voicings: [pv("Root", n("E", 0, 4, 7, 10, 14, 17))] },
  { key: "F", suffix: "11", label: "F11", voicings: [pv("Root", n("F", 0, 4, 7, 10, 14, 17))] },
  { key: "F#", suffix: "11", label: "F#11", voicings: [pv("Root", n("F#", 0, 4, 7, 10, 14, 17))] },
  { key: "G", suffix: "11", label: "G11", voicings: [pv("Root", n("G", 0, 4, 7, 10, 14, 17))] },
  { key: "Ab", suffix: "11", label: "Ab11", voicings: [pv("Root", n("Ab", 0, 4, 7, 10, 14, 17))] },
  { key: "A", suffix: "11", label: "A11", voicings: [pv("Root", n("A", 0, 4, 7, 10, 14, 17))] },
  { key: "Bb", suffix: "11", label: "Bb11", voicings: [pv("Root", n("Bb", 0, 4, 7, 10, 14, 17))] },
  { key: "B", suffix: "11", label: "B11", voicings: [pv("Root", n("B", 0, 4, 7, 10, 14, 17))] },
  // === M11 ===
  { key: "C", suffix: "m11", label: "Cm11", voicings: [pv("Root", n("C", 0, 3, 7, 10, 14, 17))] },
  { key: "C#", suffix: "m11", label: "C#m11", voicings: [pv("Root", n("C#", 0, 3, 7, 10, 14, 17))] },
  { key: "D", suffix: "m11", label: "Dm11", voicings: [pv("Root", n("D", 0, 3, 7, 10, 14, 17))] },
  { key: "Eb", suffix: "m11", label: "Ebm11", voicings: [pv("Root", n("Eb", 0, 3, 7, 10, 14, 17))] },
  { key: "E", suffix: "m11", label: "Em11", voicings: [pv("Root", n("E", 0, 3, 7, 10, 14, 17))] },
  { key: "F", suffix: "m11", label: "Fm11", voicings: [pv("Root", n("F", 0, 3, 7, 10, 14, 17))] },
  { key: "F#", suffix: "m11", label: "F#m11", voicings: [pv("Root", n("F#", 0, 3, 7, 10, 14, 17))] },
  { key: "G", suffix: "m11", label: "Gm11", voicings: [pv("Root", n("G", 0, 3, 7, 10, 14, 17))] },
  { key: "Ab", suffix: "m11", label: "Abm11", voicings: [pv("Root", n("Ab", 0, 3, 7, 10, 14, 17))] },
  { key: "A", suffix: "m11", label: "Am11", voicings: [pv("Root", n("A", 0, 3, 7, 10, 14, 17))] },
  { key: "Bb", suffix: "m11", label: "Bbm11", voicings: [pv("Root", n("Bb", 0, 3, 7, 10, 14, 17))] },
  { key: "B", suffix: "m11", label: "Bm11", voicings: [pv("Root", n("B", 0, 3, 7, 10, 14, 17))] },
  // === 13 ===
  { key: "C", suffix: "13", label: "C13", voicings: [pv("Root", n("C", 0, 4, 7, 10, 14, 21))] },
  { key: "C#", suffix: "13", label: "C#13", voicings: [pv("Root", n("C#", 0, 4, 7, 10, 14, 21))] },
  { key: "D", suffix: "13", label: "D13", voicings: [pv("Root", n("D", 0, 4, 7, 10, 14, 21))] },
  { key: "Eb", suffix: "13", label: "Eb13", voicings: [pv("Root", n("Eb", 0, 4, 7, 10, 14, 21))] },
  { key: "E", suffix: "13", label: "E13", voicings: [pv("Root", n("E", 0, 4, 7, 10, 14, 21))] },
  { key: "F", suffix: "13", label: "F13", voicings: [pv("Root", n("F", 0, 4, 7, 10, 14, 21))] },
  { key: "F#", suffix: "13", label: "F#13", voicings: [pv("Root", n("F#", 0, 4, 7, 10, 14, 21))] },
  { key: "G", suffix: "13", label: "G13", voicings: [pv("Root", n("G", 0, 4, 7, 10, 14, 21))] },
  { key: "Ab", suffix: "13", label: "Ab13", voicings: [pv("Root", n("Ab", 0, 4, 7, 10, 14, 21))] },
  { key: "A", suffix: "13", label: "A13", voicings: [pv("Root", n("A", 0, 4, 7, 10, 14, 21))] },
  { key: "Bb", suffix: "13", label: "Bb13", voicings: [pv("Root", n("Bb", 0, 4, 7, 10, 14, 21))] },
  { key: "B", suffix: "13", label: "B13", voicings: [pv("Root", n("B", 0, 4, 7, 10, 14, 21))] },
  // === M13 ===
  { key: "C", suffix: "m13", label: "Cm13", voicings: [pv("Root", n("C", 0, 3, 7, 10, 14, 21))] },
  { key: "C#", suffix: "m13", label: "C#m13", voicings: [pv("Root", n("C#", 0, 3, 7, 10, 14, 21))] },
  { key: "D", suffix: "m13", label: "Dm13", voicings: [pv("Root", n("D", 0, 3, 7, 10, 14, 21))] },
  { key: "Eb", suffix: "m13", label: "Ebm13", voicings: [pv("Root", n("Eb", 0, 3, 7, 10, 14, 21))] },
  { key: "E", suffix: "m13", label: "Em13", voicings: [pv("Root", n("E", 0, 3, 7, 10, 14, 21))] },
  { key: "F", suffix: "m13", label: "Fm13", voicings: [pv("Root", n("F", 0, 3, 7, 10, 14, 21))] },
  { key: "F#", suffix: "m13", label: "F#m13", voicings: [pv("Root", n("F#", 0, 3, 7, 10, 14, 21))] },
  { key: "G", suffix: "m13", label: "Gm13", voicings: [pv("Root", n("G", 0, 3, 7, 10, 14, 21))] },
  { key: "Ab", suffix: "m13", label: "Abm13", voicings: [pv("Root", n("Ab", 0, 3, 7, 10, 14, 21))] },
  { key: "A", suffix: "m13", label: "Am13", voicings: [pv("Root", n("A", 0, 3, 7, 10, 14, 21))] },
  { key: "Bb", suffix: "m13", label: "Bbm13", voicings: [pv("Root", n("Bb", 0, 3, 7, 10, 14, 21))] },
  { key: "B", suffix: "m13", label: "Bm13", voicings: [pv("Root", n("B", 0, 3, 7, 10, 14, 21))] },
  // === MAJ13 ===
  { key: "C", suffix: "maj13", label: "Cmaj13", voicings: [pv("Root", n("C", 0, 4, 7, 11, 14, 21))] },
  { key: "C#", suffix: "maj13", label: "C#maj13", voicings: [pv("Root", n("C#", 0, 4, 7, 11, 14, 21))] },
  { key: "D", suffix: "maj13", label: "Dmaj13", voicings: [pv("Root", n("D", 0, 4, 7, 11, 14, 21))] },
  { key: "Eb", suffix: "maj13", label: "Ebmaj13", voicings: [pv("Root", n("Eb", 0, 4, 7, 11, 14, 21))] },
  { key: "E", suffix: "maj13", label: "Emaj13", voicings: [pv("Root", n("E", 0, 4, 7, 11, 14, 21))] },
  { key: "F", suffix: "maj13", label: "Fmaj13", voicings: [pv("Root", n("F", 0, 4, 7, 11, 14, 21))] },
  { key: "F#", suffix: "maj13", label: "F#maj13", voicings: [pv("Root", n("F#", 0, 4, 7, 11, 14, 21))] },
  { key: "G", suffix: "maj13", label: "Gmaj13", voicings: [pv("Root", n("G", 0, 4, 7, 11, 14, 21))] },
  { key: "Ab", suffix: "maj13", label: "Abmaj13", voicings: [pv("Root", n("Ab", 0, 4, 7, 11, 14, 21))] },
  { key: "A", suffix: "maj13", label: "Amaj13", voicings: [pv("Root", n("A", 0, 4, 7, 11, 14, 21))] },
  { key: "Bb", suffix: "maj13", label: "Bbmaj13", voicings: [pv("Root", n("Bb", 0, 4, 7, 11, 14, 21))] },
  { key: "B", suffix: "maj13", label: "Bmaj13", voicings: [pv("Root", n("B", 0, 4, 7, 11, 14, 21))] },
  // === 6 ===
  { key: "C", suffix: "6", label: "C6", voicings: [pv("Root", n("C", 0, 4, 7, 9))] },
  { key: "C#", suffix: "6", label: "C#6", voicings: [pv("Root", n("C#", 0, 4, 7, 9))] },
  { key: "D", suffix: "6", label: "D6", voicings: [pv("Root", n("D", 0, 4, 7, 9))] },
  { key: "Eb", suffix: "6", label: "Eb6", voicings: [pv("Root", n("Eb", 0, 4, 7, 9))] },
  { key: "E", suffix: "6", label: "E6", voicings: [pv("Root", n("E", 0, 4, 7, 9))] },
  { key: "F", suffix: "6", label: "F6", voicings: [pv("Root", n("F", 0, 4, 7, 9))] },
  { key: "F#", suffix: "6", label: "F#6", voicings: [pv("Root", n("F#", 0, 4, 7, 9))] },
  { key: "G", suffix: "6", label: "G6", voicings: [pv("Root", n("G", 0, 4, 7, 9))] },
  { key: "Ab", suffix: "6", label: "Ab6", voicings: [pv("Root", n("Ab", 0, 4, 7, 9))] },
  { key: "A", suffix: "6", label: "A6", voicings: [pv("Root", n("A", 0, 4, 7, 9))] },
  { key: "Bb", suffix: "6", label: "Bb6", voicings: [pv("Root", n("Bb", 0, 4, 7, 9))] },
  { key: "B", suffix: "6", label: "B6", voicings: [pv("Root", n("B", 0, 4, 7, 9))] },
  // === M6 ===
  { key: "C", suffix: "m6", label: "Cm6", voicings: [pv("Root", n("C", 0, 3, 7, 9))] },
  { key: "C#", suffix: "m6", label: "C#m6", voicings: [pv("Root", n("C#", 0, 3, 7, 9))] },
  { key: "D", suffix: "m6", label: "Dm6", voicings: [pv("Root", n("D", 0, 3, 7, 9))] },
  { key: "Eb", suffix: "m6", label: "Ebm6", voicings: [pv("Root", n("Eb", 0, 3, 7, 9))] },
  { key: "E", suffix: "m6", label: "Em6", voicings: [pv("Root", n("E", 0, 3, 7, 9))] },
  { key: "F", suffix: "m6", label: "Fm6", voicings: [pv("Root", n("F", 0, 3, 7, 9))] },
  { key: "F#", suffix: "m6", label: "F#m6", voicings: [pv("Root", n("F#", 0, 3, 7, 9))] },
  { key: "G", suffix: "m6", label: "Gm6", voicings: [pv("Root", n("G", 0, 3, 7, 9))] },
  { key: "Ab", suffix: "m6", label: "Abm6", voicings: [pv("Root", n("Ab", 0, 3, 7, 9))] },
  { key: "A", suffix: "m6", label: "Am6", voicings: [pv("Root", n("A", 0, 3, 7, 9))] },
  { key: "Bb", suffix: "m6", label: "Bbm6", voicings: [pv("Root", n("Bb", 0, 3, 7, 9))] },
  { key: "B", suffix: "m6", label: "Bm6", voicings: [pv("Root", n("B", 0, 3, 7, 9))] },
  // === DIM7 ===
  { key: "C", suffix: "dim7", label: "Cdim7", voicings: [pv("Root", n("C", 0, 3, 6, 9))] },
  { key: "C#", suffix: "dim7", label: "C#dim7", voicings: [pv("Root", n("C#", 0, 3, 6, 9))] },
  { key: "D", suffix: "dim7", label: "Ddim7", voicings: [pv("Root", n("D", 0, 3, 6, 9))] },
  { key: "Eb", suffix: "dim7", label: "Ebdim7", voicings: [pv("Root", n("Eb", 0, 3, 6, 9))] },
  { key: "E", suffix: "dim7", label: "Edim7", voicings: [pv("Root", n("E", 0, 3, 6, 9))] },
  { key: "F", suffix: "dim7", label: "Fdim7", voicings: [pv("Root", n("F", 0, 3, 6, 9))] },
  { key: "F#", suffix: "dim7", label: "F#dim7", voicings: [pv("Root", n("F#", 0, 3, 6, 9))] },
  { key: "G", suffix: "dim7", label: "Gdim7", voicings: [pv("Root", n("G", 0, 3, 6, 9))] },
  { key: "Ab", suffix: "dim7", label: "Abdim7", voicings: [pv("Root", n("Ab", 0, 3, 6, 9))] },
  { key: "A", suffix: "dim7", label: "Adim7", voicings: [pv("Root", n("A", 0, 3, 6, 9))] },
  { key: "Bb", suffix: "dim7", label: "Bbdim7", voicings: [pv("Root", n("Bb", 0, 3, 6, 9))] },
  { key: "B", suffix: "dim7", label: "Bdim7", voicings: [pv("Root", n("B", 0, 3, 6, 9))] },
  // === ADD9 ===
  { key: "C", suffix: "add9", label: "Cadd9", voicings: [pv("Root", n("C", 0, 4, 7, 14))] },
  { key: "C#", suffix: "add9", label: "C#add9", voicings: [pv("Root", n("C#", 0, 4, 7, 14))] },
  { key: "D", suffix: "add9", label: "Dadd9", voicings: [pv("Root", n("D", 0, 4, 7, 14))] },
  { key: "Eb", suffix: "add9", label: "Ebadd9", voicings: [pv("Root", n("Eb", 0, 4, 7, 14))] },
  { key: "E", suffix: "add9", label: "Eadd9", voicings: [pv("Root", n("E", 0, 4, 7, 14))] },
  { key: "F", suffix: "add9", label: "Fadd9", voicings: [pv("Root", n("F", 0, 4, 7, 14))] },
  { key: "F#", suffix: "add9", label: "F#add9", voicings: [pv("Root", n("F#", 0, 4, 7, 14))] },
  { key: "G", suffix: "add9", label: "Gadd9", voicings: [pv("Root", n("G", 0, 4, 7, 14))] },
  { key: "Ab", suffix: "add9", label: "Abadd9", voicings: [pv("Root", n("Ab", 0, 4, 7, 14))] },
  { key: "A", suffix: "add9", label: "Aadd9", voicings: [pv("Root", n("A", 0, 4, 7, 14))] },
  { key: "Bb", suffix: "add9", label: "Bbadd9", voicings: [pv("Root", n("Bb", 0, 4, 7, 14))] },
  { key: "B", suffix: "add9", label: "Badd9", voicings: [pv("Root", n("B", 0, 4, 7, 14))] },
  // === M(ADD9) ===
  { key: "C", suffix: "m(add9)", label: "Cm(add9)", voicings: [pv("Root", n("C", 0, 3, 7, 14))] },
  { key: "C#", suffix: "m(add9)", label: "C#m(add9)", voicings: [pv("Root", n("C#", 0, 3, 7, 14))] },
  { key: "D", suffix: "m(add9)", label: "Dm(add9)", voicings: [pv("Root", n("D", 0, 3, 7, 14))] },
  { key: "Eb", suffix: "m(add9)", label: "Ebm(add9)", voicings: [pv("Root", n("Eb", 0, 3, 7, 14))] },
  { key: "E", suffix: "m(add9)", label: "Em(add9)", voicings: [pv("Root", n("E", 0, 3, 7, 14))] },
  { key: "F", suffix: "m(add9)", label: "Fm(add9)", voicings: [pv("Root", n("F", 0, 3, 7, 14))] },
  { key: "F#", suffix: "m(add9)", label: "F#m(add9)", voicings: [pv("Root", n("F#", 0, 3, 7, 14))] },
  { key: "G", suffix: "m(add9)", label: "Gm(add9)", voicings: [pv("Root", n("G", 0, 3, 7, 14))] },
  { key: "Ab", suffix: "m(add9)", label: "Abm(add9)", voicings: [pv("Root", n("Ab", 0, 3, 7, 14))] },
  { key: "A", suffix: "m(add9)", label: "Am(add9)", voicings: [pv("Root", n("A", 0, 3, 7, 14))] },
  { key: "Bb", suffix: "m(add9)", label: "Bbm(add9)", voicings: [pv("Root", n("Bb", 0, 3, 7, 14))] },
  { key: "B", suffix: "m(add9)", label: "Bm(add9)", voicings: [pv("Root", n("B", 0, 3, 7, 14))] },
  // === 7SUS4 ===
  { key: "C", suffix: "7sus4", label: "C7sus4", voicings: [pv("Root", n("C", 0, 5, 7, 10))] },
  { key: "C#", suffix: "7sus4", label: "C#7sus4", voicings: [pv("Root", n("C#", 0, 5, 7, 10))] },
  { key: "D", suffix: "7sus4", label: "D7sus4", voicings: [pv("Root", n("D", 0, 5, 7, 10))] },
  { key: "Eb", suffix: "7sus4", label: "Eb7sus4", voicings: [pv("Root", n("Eb", 0, 5, 7, 10))] },
  { key: "E", suffix: "7sus4", label: "E7sus4", voicings: [pv("Root", n("E", 0, 5, 7, 10))] },
  { key: "F", suffix: "7sus4", label: "F7sus4", voicings: [pv("Root", n("F", 0, 5, 7, 10))] },
  { key: "F#", suffix: "7sus4", label: "F#7sus4", voicings: [pv("Root", n("F#", 0, 5, 7, 10))] },
  { key: "G", suffix: "7sus4", label: "G7sus4", voicings: [pv("Root", n("G", 0, 5, 7, 10))] },
  { key: "Ab", suffix: "7sus4", label: "Ab7sus4", voicings: [pv("Root", n("Ab", 0, 5, 7, 10))] },
  { key: "A", suffix: "7sus4", label: "A7sus4", voicings: [pv("Root", n("A", 0, 5, 7, 10))] },
  { key: "Bb", suffix: "7sus4", label: "Bb7sus4", voicings: [pv("Root", n("Bb", 0, 5, 7, 10))] },
  { key: "B", suffix: "7sus4", label: "B7sus4", voicings: [pv("Root", n("B", 0, 5, 7, 10))] },
  // === 7SUS2 ===
  { key: "C", suffix: "7sus2", label: "C7sus2", voicings: [pv("Root", n("C", 0, 2, 7, 10))] },
  { key: "C#", suffix: "7sus2", label: "C#7sus2", voicings: [pv("Root", n("C#", 0, 2, 7, 10))] },
  { key: "D", suffix: "7sus2", label: "D7sus2", voicings: [pv("Root", n("D", 0, 2, 7, 10))] },
  { key: "Eb", suffix: "7sus2", label: "Eb7sus2", voicings: [pv("Root", n("Eb", 0, 2, 7, 10))] },
  { key: "E", suffix: "7sus2", label: "E7sus2", voicings: [pv("Root", n("E", 0, 2, 7, 10))] },
  { key: "F", suffix: "7sus2", label: "F7sus2", voicings: [pv("Root", n("F", 0, 2, 7, 10))] },
  { key: "F#", suffix: "7sus2", label: "F#7sus2", voicings: [pv("Root", n("F#", 0, 2, 7, 10))] },
  { key: "G", suffix: "7sus2", label: "G7sus2", voicings: [pv("Root", n("G", 0, 2, 7, 10))] },
  { key: "Ab", suffix: "7sus2", label: "Ab7sus2", voicings: [pv("Root", n("Ab", 0, 2, 7, 10))] },
  { key: "A", suffix: "7sus2", label: "A7sus2", voicings: [pv("Root", n("A", 0, 2, 7, 10))] },
  { key: "Bb", suffix: "7sus2", label: "Bb7sus2", voicings: [pv("Root", n("Bb", 0, 2, 7, 10))] },
  { key: "B", suffix: "7sus2", label: "B7sus2", voicings: [pv("Root", n("B", 0, 2, 7, 10))] },
  // === M7B5 ===
  { key: "C", suffix: "m7b5", label: "Cm7b5", voicings: [pv("Root", n("C", 0, 3, 6, 10))] },
  { key: "C#", suffix: "m7b5", label: "C#m7b5", voicings: [pv("Root", n("C#", 0, 3, 6, 10))] },
  { key: "D", suffix: "m7b5", label: "Dm7b5", voicings: [pv("Root", n("D", 0, 3, 6, 10))] },
  { key: "Eb", suffix: "m7b5", label: "Ebm7b5", voicings: [pv("Root", n("Eb", 0, 3, 6, 10))] },
  { key: "E", suffix: "m7b5", label: "Em7b5", voicings: [pv("Root", n("E", 0, 3, 6, 10))] },
  { key: "F", suffix: "m7b5", label: "Fm7b5", voicings: [pv("Root", n("F", 0, 3, 6, 10))] },
  { key: "F#", suffix: "m7b5", label: "F#m7b5", voicings: [pv("Root", n("F#", 0, 3, 6, 10))] },
  { key: "G", suffix: "m7b5", label: "Gm7b5", voicings: [pv("Root", n("G", 0, 3, 6, 10))] },
  { key: "Ab", suffix: "m7b5", label: "Abm7b5", voicings: [pv("Root", n("Ab", 0, 3, 6, 10))] },
  { key: "A", suffix: "m7b5", label: "Am7b5", voicings: [pv("Root", n("A", 0, 3, 6, 10))] },
  { key: "Bb", suffix: "m7b5", label: "Bbm7b5", voicings: [pv("Root", n("Bb", 0, 3, 6, 10))] },
  { key: "B", suffix: "m7b5", label: "Bm7b5", voicings: [pv("Root", n("B", 0, 3, 6, 10))] },
  // === MINMAJ7 ===
  { key: "C", suffix: "minmaj7", label: "Cm(maj7)", voicings: [pv("Root", n("C", 0, 3, 7, 11))] },
  { key: "C#", suffix: "minmaj7", label: "C#m(maj7)", voicings: [pv("Root", n("C#", 0, 3, 7, 11))] },
  { key: "D", suffix: "minmaj7", label: "Dm(maj7)", voicings: [pv("Root", n("D", 0, 3, 7, 11))] },
  { key: "Eb", suffix: "minmaj7", label: "Ebm(maj7)", voicings: [pv("Root", n("Eb", 0, 3, 7, 11))] },
  { key: "E", suffix: "minmaj7", label: "Em(maj7)", voicings: [pv("Root", n("E", 0, 3, 7, 11))] },
  { key: "F", suffix: "minmaj7", label: "Fm(maj7)", voicings: [pv("Root", n("F", 0, 3, 7, 11))] },
  { key: "F#", suffix: "minmaj7", label: "F#m(maj7)", voicings: [pv("Root", n("F#", 0, 3, 7, 11))] },
  { key: "G", suffix: "minmaj7", label: "Gm(maj7)", voicings: [pv("Root", n("G", 0, 3, 7, 11))] },
  { key: "Ab", suffix: "minmaj7", label: "Abm(maj7)", voicings: [pv("Root", n("Ab", 0, 3, 7, 11))] },
  { key: "A", suffix: "minmaj7", label: "Am(maj7)", voicings: [pv("Root", n("A", 0, 3, 7, 11))] },
  { key: "Bb", suffix: "minmaj7", label: "Bbm(maj7)", voicings: [pv("Root", n("Bb", 0, 3, 7, 11))] },
  { key: "B", suffix: "minmaj7", label: "Bm(maj7)", voicings: [pv("Root", n("B", 0, 3, 7, 11))] },
  // === 7B9 ===
  { key: "C", suffix: "7b9", label: "C7b9", voicings: [pv("Root", n("C", 0, 4, 7, 10, 13))] },
  { key: "C#", suffix: "7b9", label: "C#7b9", voicings: [pv("Root", n("C#", 0, 4, 7, 10, 13))] },
  { key: "D", suffix: "7b9", label: "D7b9", voicings: [pv("Root", n("D", 0, 4, 7, 10, 13))] },
  { key: "Eb", suffix: "7b9", label: "Eb7b9", voicings: [pv("Root", n("Eb", 0, 4, 7, 10, 13))] },
  { key: "E", suffix: "7b9", label: "E7b9", voicings: [pv("Root", n("E", 0, 4, 7, 10, 13))] },
  { key: "F", suffix: "7b9", label: "F7b9", voicings: [pv("Root", n("F", 0, 4, 7, 10, 13))] },
  { key: "F#", suffix: "7b9", label: "F#7b9", voicings: [pv("Root", n("F#", 0, 4, 7, 10, 13))] },
  { key: "G", suffix: "7b9", label: "G7b9", voicings: [pv("Root", n("G", 0, 4, 7, 10, 13))] },
  { key: "Ab", suffix: "7b9", label: "Ab7b9", voicings: [pv("Root", n("Ab", 0, 4, 7, 10, 13))] },
  { key: "A", suffix: "7b9", label: "A7b9", voicings: [pv("Root", n("A", 0, 4, 7, 10, 13))] },
  { key: "Bb", suffix: "7b9", label: "Bb7b9", voicings: [pv("Root", n("Bb", 0, 4, 7, 10, 13))] },
  { key: "B", suffix: "7b9", label: "B7b9", voicings: [pv("Root", n("B", 0, 4, 7, 10, 13))] },
  // === 7#9 ===
  { key: "C", suffix: "7#9", label: "C7#9", voicings: [pv("Root", n("C", 0, 4, 7, 10, 15))] },
  { key: "C#", suffix: "7#9", label: "C#7#9", voicings: [pv("Root", n("C#", 0, 4, 7, 10, 15))] },
  { key: "D", suffix: "7#9", label: "D7#9", voicings: [pv("Root", n("D", 0, 4, 7, 10, 15))] },
  { key: "Eb", suffix: "7#9", label: "Eb7#9", voicings: [pv("Root", n("Eb", 0, 4, 7, 10, 15))] },
  { key: "E", suffix: "7#9", label: "E7#9", voicings: [pv("Root", n("E", 0, 4, 7, 10, 15))] },
  { key: "F", suffix: "7#9", label: "F7#9", voicings: [pv("Root", n("F", 0, 4, 7, 10, 15))] },
  { key: "F#", suffix: "7#9", label: "F#7#9", voicings: [pv("Root", n("F#", 0, 4, 7, 10, 15))] },
  { key: "G", suffix: "7#9", label: "G7#9", voicings: [pv("Root", n("G", 0, 4, 7, 10, 15))] },
  { key: "Ab", suffix: "7#9", label: "Ab7#9", voicings: [pv("Root", n("Ab", 0, 4, 7, 10, 15))] },
  { key: "A", suffix: "7#9", label: "A7#9", voicings: [pv("Root", n("A", 0, 4, 7, 10, 15))] },
  { key: "Bb", suffix: "7#9", label: "Bb7#9", voicings: [pv("Root", n("Bb", 0, 4, 7, 10, 15))] },
  { key: "B", suffix: "7#9", label: "B7#9", voicings: [pv("Root", n("B", 0, 4, 7, 10, 15))] },
  // === 7B5 ===
  { key: "C", suffix: "7b5", label: "C7b5", voicings: [pv("Root", n("C", 0, 4, 6, 10))] },
  { key: "C#", suffix: "7b5", label: "C#7b5", voicings: [pv("Root", n("C#", 0, 4, 6, 10))] },
  { key: "D", suffix: "7b5", label: "D7b5", voicings: [pv("Root", n("D", 0, 4, 6, 10))] },
  { key: "Eb", suffix: "7b5", label: "Eb7b5", voicings: [pv("Root", n("Eb", 0, 4, 6, 10))] },
  { key: "E", suffix: "7b5", label: "E7b5", voicings: [pv("Root", n("E", 0, 4, 6, 10))] },
  { key: "F", suffix: "7b5", label: "F7b5", voicings: [pv("Root", n("F", 0, 4, 6, 10))] },
  { key: "F#", suffix: "7b5", label: "F#7b5", voicings: [pv("Root", n("F#", 0, 4, 6, 10))] },
  { key: "G", suffix: "7b5", label: "G7b5", voicings: [pv("Root", n("G", 0, 4, 6, 10))] },
  { key: "Ab", suffix: "7b5", label: "Ab7b5", voicings: [pv("Root", n("Ab", 0, 4, 6, 10))] },
  { key: "A", suffix: "7b5", label: "A7b5", voicings: [pv("Root", n("A", 0, 4, 6, 10))] },
  { key: "Bb", suffix: "7b5", label: "Bb7b5", voicings: [pv("Root", n("Bb", 0, 4, 6, 10))] },
  { key: "B", suffix: "7b5", label: "B7b5", voicings: [pv("Root", n("B", 0, 4, 6, 10))] },
  // === 7#5 ===
  { key: "C", suffix: "7#5", label: "C7#5", voicings: [pv("Root", n("C", 0, 4, 8, 10))] },
  { key: "C#", suffix: "7#5", label: "C#7#5", voicings: [pv("Root", n("C#", 0, 4, 8, 10))] },
  { key: "D", suffix: "7#5", label: "D7#5", voicings: [pv("Root", n("D", 0, 4, 8, 10))] },
  { key: "Eb", suffix: "7#5", label: "Eb7#5", voicings: [pv("Root", n("Eb", 0, 4, 8, 10))] },
  { key: "E", suffix: "7#5", label: "E7#5", voicings: [pv("Root", n("E", 0, 4, 8, 10))] },
  { key: "F", suffix: "7#5", label: "F7#5", voicings: [pv("Root", n("F", 0, 4, 8, 10))] },
  { key: "F#", suffix: "7#5", label: "F#7#5", voicings: [pv("Root", n("F#", 0, 4, 8, 10))] },
  { key: "G", suffix: "7#5", label: "G7#5", voicings: [pv("Root", n("G", 0, 4, 8, 10))] },
  { key: "Ab", suffix: "7#5", label: "Ab7#5", voicings: [pv("Root", n("Ab", 0, 4, 8, 10))] },
  { key: "A", suffix: "7#5", label: "A7#5", voicings: [pv("Root", n("A", 0, 4, 8, 10))] },
  { key: "Bb", suffix: "7#5", label: "Bb7#5", voicings: [pv("Root", n("Bb", 0, 4, 8, 10))] },
  { key: "B", suffix: "7#5", label: "B7#5", voicings: [pv("Root", n("B", 0, 4, 8, 10))] },
  // === 7#11 ===
  { key: "C", suffix: "7#11", label: "C7#11", voicings: [pv("Root", n("C", 0, 4, 7, 10, 18))] },
  { key: "C#", suffix: "7#11", label: "C#7#11", voicings: [pv("Root", n("C#", 0, 4, 7, 10, 18))] },
  { key: "D", suffix: "7#11", label: "D7#11", voicings: [pv("Root", n("D", 0, 4, 7, 10, 18))] },
  { key: "Eb", suffix: "7#11", label: "Eb7#11", voicings: [pv("Root", n("Eb", 0, 4, 7, 10, 18))] },
  { key: "E", suffix: "7#11", label: "E7#11", voicings: [pv("Root", n("E", 0, 4, 7, 10, 18))] },
  { key: "F", suffix: "7#11", label: "F7#11", voicings: [pv("Root", n("F", 0, 4, 7, 10, 18))] },
  { key: "F#", suffix: "7#11", label: "F#7#11", voicings: [pv("Root", n("F#", 0, 4, 7, 10, 18))] },
  { key: "G", suffix: "7#11", label: "G7#11", voicings: [pv("Root", n("G", 0, 4, 7, 10, 18))] },
  { key: "Ab", suffix: "7#11", label: "Ab7#11", voicings: [pv("Root", n("Ab", 0, 4, 7, 10, 18))] },
  { key: "A", suffix: "7#11", label: "A7#11", voicings: [pv("Root", n("A", 0, 4, 7, 10, 18))] },
  { key: "Bb", suffix: "7#11", label: "Bb7#11", voicings: [pv("Root", n("Bb", 0, 4, 7, 10, 18))] },
  { key: "B", suffix: "7#11", label: "B7#11", voicings: [pv("Root", n("B", 0, 4, 7, 10, 18))] },
  // === 7B13 ===
  { key: "C", suffix: "7b13", label: "C7b13", voicings: [pv("Root", n("C", 0, 4, 7, 10, 20))] },
  { key: "C#", suffix: "7b13", label: "C#7b13", voicings: [pv("Root", n("C#", 0, 4, 7, 10, 20))] },
  { key: "D", suffix: "7b13", label: "D7b13", voicings: [pv("Root", n("D", 0, 4, 7, 10, 20))] },
  { key: "Eb", suffix: "7b13", label: "Eb7b13", voicings: [pv("Root", n("Eb", 0, 4, 7, 10, 20))] },
  { key: "E", suffix: "7b13", label: "E7b13", voicings: [pv("Root", n("E", 0, 4, 7, 10, 20))] },
  { key: "F", suffix: "7b13", label: "F7b13", voicings: [pv("Root", n("F", 0, 4, 7, 10, 20))] },
  { key: "F#", suffix: "7b13", label: "F#7b13", voicings: [pv("Root", n("F#", 0, 4, 7, 10, 20))] },
  { key: "G", suffix: "7b13", label: "G7b13", voicings: [pv("Root", n("G", 0, 4, 7, 10, 20))] },
  { key: "Ab", suffix: "7b13", label: "Ab7b13", voicings: [pv("Root", n("Ab", 0, 4, 7, 10, 20))] },
  { key: "A", suffix: "7b13", label: "A7b13", voicings: [pv("Root", n("A", 0, 4, 7, 10, 20))] },
  { key: "Bb", suffix: "7b13", label: "Bb7b13", voicings: [pv("Root", n("Bb", 0, 4, 7, 10, 20))] },
  { key: "B", suffix: "7b13", label: "B7b13", voicings: [pv("Root", n("B", 0, 4, 7, 10, 20))] },
  // === 69 ===
  { key: "C", suffix: "69", label: "C69", voicings: [pv("Root", n("C", 0, 4, 7, 9, 14))] },
  { key: "C#", suffix: "69", label: "C#69", voicings: [pv("Root", n("C#", 0, 4, 7, 9, 14))] },
  { key: "D", suffix: "69", label: "D69", voicings: [pv("Root", n("D", 0, 4, 7, 9, 14))] },
  { key: "Eb", suffix: "69", label: "Eb69", voicings: [pv("Root", n("Eb", 0, 4, 7, 9, 14))] },
  { key: "E", suffix: "69", label: "E69", voicings: [pv("Root", n("E", 0, 4, 7, 9, 14))] },
  { key: "F", suffix: "69", label: "F69", voicings: [pv("Root", n("F", 0, 4, 7, 9, 14))] },
  { key: "F#", suffix: "69", label: "F#69", voicings: [pv("Root", n("F#", 0, 4, 7, 9, 14))] },
  { key: "G", suffix: "69", label: "G69", voicings: [pv("Root", n("G", 0, 4, 7, 9, 14))] },
  { key: "Ab", suffix: "69", label: "Ab69", voicings: [pv("Root", n("Ab", 0, 4, 7, 9, 14))] },
  { key: "A", suffix: "69", label: "A69", voicings: [pv("Root", n("A", 0, 4, 7, 9, 14))] },
  { key: "Bb", suffix: "69", label: "Bb69", voicings: [pv("Root", n("Bb", 0, 4, 7, 9, 14))] },
  { key: "B", suffix: "69", label: "B69", voicings: [pv("Root", n("B", 0, 4, 7, 9, 14))] },
  // === 9#11 ===
  { key: "C", suffix: "9#11", label: "C9#11", voicings: [pv("Root", n("C", 0, 4, 7, 10, 14, 18))] },
  { key: "C#", suffix: "9#11", label: "C#9#11", voicings: [pv("Root", n("C#", 0, 4, 7, 10, 14, 18))] },
  { key: "D", suffix: "9#11", label: "D9#11", voicings: [pv("Root", n("D", 0, 4, 7, 10, 14, 18))] },
  { key: "Eb", suffix: "9#11", label: "Eb9#11", voicings: [pv("Root", n("Eb", 0, 4, 7, 10, 14, 18))] },
  { key: "E", suffix: "9#11", label: "E9#11", voicings: [pv("Root", n("E", 0, 4, 7, 10, 14, 18))] },
  { key: "F", suffix: "9#11", label: "F9#11", voicings: [pv("Root", n("F", 0, 4, 7, 10, 14, 18))] },
  { key: "F#", suffix: "9#11", label: "F#9#11", voicings: [pv("Root", n("F#", 0, 4, 7, 10, 14, 18))] },
  { key: "G", suffix: "9#11", label: "G9#11", voicings: [pv("Root", n("G", 0, 4, 7, 10, 14, 18))] },
  { key: "Ab", suffix: "9#11", label: "Ab9#11", voicings: [pv("Root", n("Ab", 0, 4, 7, 10, 14, 18))] },
  { key: "A", suffix: "9#11", label: "A9#11", voicings: [pv("Root", n("A", 0, 4, 7, 10, 14, 18))] },
  { key: "Bb", suffix: "9#11", label: "Bb9#11", voicings: [pv("Root", n("Bb", 0, 4, 7, 10, 14, 18))] },
  { key: "B", suffix: "9#11", label: "B9#11", voicings: [pv("Root", n("B", 0, 4, 7, 10, 14, 18))] },
];

export const pianoRootNotes = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
export const pianoSuffixes = ["major", "minor", "7", "m7", "maj7", "dim", "aug", "sus4", "sus2", "9", "m9", "maj9", "11", "m11", "13", "m13", "maj13", "6", "m6", "dim7", "add9", "m(add9)", "7sus4", "7sus2", "m7b5", "minmaj7", "7b9", "7#9", "7b5", "7#5", "7#11", "7b13", "69", "9#11"];
export const pianoSuffixLabels: Record<string, string> = {
  major: "Major", minor: "Minor", "7": "7", m7: "m7", maj7: "maj7",
  dim: "dim", aug: "aug", sus4: "sus4", sus2: "sus2",
  "9": "9", m9: "m9", maj9: "maj9", "11": "11", m11: "m11",
  "13": "13", m13: "m13", maj13: "maj13", "6": "6", m6: "m6",
  dim7: "dim7", add9: "add9", "m(add9)": "m(add9)", "7sus4": "7sus4",
  "7sus2": "7sus2", m7b5: "m7b5", minmaj7: "m(maj7)", "7b9": "7b9",
  "7#9": "7#9", "7b5": "7b5", "7#5": "7#5", "7#11": "7#11",
  "7b13": "7b13", "69": "69", "9#11": "9#11",
};

export function getAllPianoChords(): PianoChord[] {
  const customs = getCustomPianoVoicings();
  if (customs.length === 0) return pianoChordData;

  const merged = pianoChordData.map(c => ({ ...c, voicings: [...c.voicings] }));

  for (const custom of customs) {
    const existing = merged.find(c => c.key === custom.chordKey && c.suffix === custom.suffix);
    if (existing) {
      existing.voicings.push(custom.voicing);
    } else {
      merged.push({
        key: custom.chordKey,
        suffix: custom.suffix,
        label: custom.label,
        voicings: [custom.voicing],
      });
    }
  }

  return merged;
}

export interface CustomPianoChordData {
  chordKey: string;
  suffix: string;
  label: string;
  voicing: PianoChordVoicing;
}

const CUSTOM_PIANO_KEY = "custom-piano-voicings";

export function getCustomPianoVoicings(): CustomPianoChordData[] {
  try {
    const data = localStorage.getItem(CUSTOM_PIANO_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function saveCustomPianoVoicing(data: CustomPianoChordData) {
  const existing = getCustomPianoVoicings();
  existing.push(data);
  localStorage.setItem(CUSTOM_PIANO_KEY, JSON.stringify(existing));
}

export function deleteCustomPianoVoicing(index: number) {
  const existing = getCustomPianoVoicings();
  existing.splice(index, 1);
  localStorage.setItem(CUSTOM_PIANO_KEY, JSON.stringify(existing));
}

export function searchPianoChords(query: string): PianoChord[] {
  const q = query.toLowerCase().trim();
  return pianoChordData.filter(c =>
    c.label.toLowerCase().includes(q) ||
    c.key.toLowerCase().includes(q) ||
    `${c.key}${c.suffix}`.toLowerCase().includes(q)
  );
}
