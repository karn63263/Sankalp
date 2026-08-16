import * as XLSX from 'xlsx';

export interface SheetData {
  columns: string[];
  rows: Record<string, string>[];
}

/** Read an Excel/CSV file and return all columns + all rows as strings. */
export async function extractAllData(file: File): Promise<SheetData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (raw.length === 0) return resolve({ columns: [], rows: [] });

        const columns = Object.keys(raw[0]);
        const rows = raw.map(r =>
          Object.fromEntries(columns.map(c => [c, String(r[c] ?? '').trim()]))
        );
        resolve({ columns, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}
