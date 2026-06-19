export interface SheetEntry {
  label: string;
  chordKey: string;
  suffix: string;
  voicingIndex: number;
}

export interface SavedSheet {
  id: string;
  name: string;
  createdAt: string;
  source: "guitar" | "piano";
  entries: SheetEntry[];
}

const GUITAR_SHEETS_KEY = "guitar-saved-sheets";
const PIANO_SHEETS_KEY = "piano-saved-sheets";

export function getGuitarSavedSheets(): SavedSheet[] {
  try {
    const data = localStorage.getItem(GUITAR_SHEETS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function getPianoSavedSheets(): SavedSheet[] {
  try {
    const data = localStorage.getItem(PIANO_SHEETS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function getAllSavedSheets(): SavedSheet[] {
  return [...getGuitarSavedSheets(), ...getPianoSavedSheets()];
}
