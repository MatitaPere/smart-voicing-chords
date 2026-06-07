import type { TabMeasure, Subdivision } from "@/data/tab";
import { STRING_LABELS, columnsForSubdivision } from "@/data/tab";

interface ExportOptions {
  measures: TabMeasure[];
  meter: string;
  subdivision: Subdivision;
  bpm: number;
  beatsPerMeasure: number;
  title?: string;
}

const PAGE_W = 595; // A4 pt
const PAGE_H = 842;
const MARGIN = 40;
const STRING_GAP = 14;
const CELL_W = 18;
const STAFF_H = STRING_GAP * 5; // 5 gaps between 6 lines
const STAFF_MARGIN_TOP = 36;
const STAFF_MARGIN_BOTTOM = 24;
const LABEL_W = 16;

function escPdf(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function exportTabPdf(opts: ExportOptions) {
  const { measures, meter, subdivision, bpm, beatsPerMeasure, title } = opts;
  const cols = columnsForSubdivision(subdivision, beatsPerMeasure);
  const colsPerBeat = subdivision === "quarter" ? 1 : subdivision === "eighth" ? 2 : 4;
  const measureW = cols * CELL_W + 2; // +2 for bar lines
  const usableW = PAGE_W - 2 * MARGIN - LABEL_W;
  const measuresPerRow = Math.max(1, Math.floor(usableW / measureW));

  // Group measures into rows
  const rows: TabMeasure[][] = [];
  for (let i = 0; i < measures.length; i += measuresPerRow) {
    rows.push(measures.slice(i, i + measuresPerRow));
  }

  // Calculate pages
  const headerH = title ? 50 : 20;
  const rowH = STAFF_H + STAFF_MARGIN_TOP + STAFF_MARGIN_BOTTOM;
  const usableH = PAGE_H - 2 * MARGIN - headerH;
  const rowsPerPage = Math.max(1, Math.floor(usableH / rowH));

  const pages: TabMeasure[][][] = [];
  for (let i = 0; i < rows.length; i += rowsPerPage) {
    pages.push(rows.slice(i, i + rowsPerPage));
  }

  // Build PDF
  const objects: string[] = [];
  let objCount = 0;
  const offsets: number[] = [];

  function addObj(content: string) {
    objCount++;
    offsets.push(-1); // placeholder
    objects.push(content);
    return objCount;
  }

  // Obj 1: Catalog
  addObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  // Obj 2: Pages (placeholder, updated later)
  addObj("");

  // Obj 3: Font (created early so its ID is known for page resources)
  const fontId = addObj("");

  const pageObjIds: number[] = [];
  const streamObjIds: number[] = [];

  for (let pi = 0; pi < pages.length; pi++) {
    const pageRows = pages[pi];
    let stream = "";

    // Set font
    stream += "BT /F1 10 Tf ET\n";

    const isFirstPage = pi === 0;
    let yStart = PAGE_H - MARGIN;

    if (isFirstPage) {
      // Title
      if (title) {
        stream += `BT /F1 16 Tf ${MARGIN} ${yStart - 16} Td (${escPdf(title)}) Tj ET\n`;
        yStart -= 28;
      }
      // Meta line
      stream += `BT /F1 8 Tf ${MARGIN} ${yStart - 10} Td (${escPdf(`Time: ${meter}  |  Grid: ${subdivision}  |  BPM: ${bpm}`)}) Tj ET\n`;
      yStart -= 22;
    }

    for (let ri = 0; ri < pageRows.length; ri++) {
      const row = pageRows[ri];
      const baseY = yStart - ri * rowH - STAFF_MARGIN_TOP;

      // String labels
      for (let s = 0; s < 6; s++) {
        const y = baseY - s * STRING_GAP;
        stream += `BT /F1 7 Tf ${MARGIN} ${y - 3} Td (${escPdf(STRING_LABELS[s])}) Tj ET\n`;
      }

      let xOff = MARGIN + LABEL_W;

      for (let mi = 0; mi < row.length; mi++) {
        const meas = row[mi];
        const mw = cols * CELL_W;

        // Draw 6 string lines
        for (let s = 0; s < 6; s++) {
          const y = baseY - s * STRING_GAP;
          stream += `0.7 G ${xOff} ${y} m ${xOff + mw} ${y} l S\n`;
        }

        // Bar lines (left and right)
        const topY = baseY;
        const botY = baseY - 5 * STRING_GAP;
        stream += `0.3 G 0.5 w ${xOff} ${topY} m ${xOff} ${botY} l S\n`;
        stream += `0.3 G 0.5 w ${xOff + mw} ${topY} m ${xOff + mw} ${botY} l S\n`;

        // Beat dividers
        for (let b = 1; b < beatsPerMeasure; b++) {
          const bx = xOff + b * colsPerBeat * CELL_W;
          stream += `0.85 G 0.3 w ${bx} ${topY} m ${bx} ${botY} l S\n`;
        }

        // Fret numbers
        for (let s = 0; s < 6; s++) {
          for (let c = 0; c < cols; c++) {
            const val = meas.grid[s]?.[c];
            if (val !== null && val !== undefined) {
              const cx = xOff + c * CELL_W + CELL_W / 2;
              const cy = baseY - s * STRING_GAP;
              // White background behind number
              const tw = val >= 10 ? 8 : 5;
              stream += `1 G ${cx - tw} ${cy - 4} ${tw * 2} 8 re f\n`;
              // Number
              const text = String(val);
              const textX = cx - (val >= 10 ? 4 : 2);
              stream += `BT /F1 7 Tf 0 G ${textX} ${cy - 3} Td (${escPdf(text)}) Tj ET\n`;
            }
          }
        }

        xOff += mw;
      }
    }

    // Create stream object
    const streamId = addObj("");
    streamObjIds.push(streamId);
    objects[streamId - 1] = `${streamId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj`;

    // Create page object
    const pageId = addObj("");
    pageObjIds.push(pageId);
    objects[pageId - 1] = `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${streamId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>\nendobj`;
  }

  // Font object (fill in the placeholder created earlier)
  objects[fontId - 1] = `${fontId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj`;

  // Update Pages object
  const kids = pageObjIds.map(id => `${id} 0 R`).join(" ");
  objects[1] = `2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pageObjIds.length} >>\nendobj`;

  // Assemble PDF
  let pdf = "%PDF-1.4\n";
  for (let i = 0; i < objects.length; i++) {
    offsets[i] = pdf.length;
    pdf += objects[i] + "\n";
  }

  const xrefOff = pdf.length;
  pdf += `xref\n0 ${objCount + 1}\n0000000000 65535 f \n`;
  for (let i = 0; i < objCount; i++) {
    pdf += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }
  pdf += `trailer\n<< /Size ${objCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOff}\n%%EOF`;

  // Download
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title || "guitar-tab"}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
