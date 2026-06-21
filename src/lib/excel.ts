import * as XLSX from "xlsx";
import type { SourceDocument } from "./types";

interface ExcelRow {
  지문?: string;
  passage?: string;
  해설?: string;
  explanation?: string;
  제목?: string;
  title?: string;
}

export function parseExcelFile(file: File): Promise<
  Omit<SourceDocument, "id" | "createdAt">[]
> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

        const sources = rows
          .map((row, i) => {
            const passage = (row.지문 || row.passage || "").trim();
            if (!passage) return null;
            const title =
              (row.제목 || row.title || `지문 ${i + 1}`).trim() || `지문 ${i + 1}`;
            const explanation = (row.해설 || row.explanation || "").trim();
            return {
              title,
              passage,
              explanation: explanation || undefined,
            };
          })
          .filter(Boolean) as Omit<SourceDocument, "id" | "createdAt">[];

        resolve(sources);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function downloadExcelTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ["제목", "지문", "해설"],
    ["Sample Passage 1", "Enter English passage here...", "Optional explanation"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "원본지문");
  XLSX.writeFile(wb, "원본지문_템플릿.xlsx");
}
