/**
 * Lightweight CSV parser / serializer — no external dependencies.
 * Handles quoted fields, commas inside quotes, and pipe-delimited arrays.
 */

/** Parse a CSV string into an array of row objects keyed by header names. */
export function parseCSV(csv: string): Record<string, string>[] {
  // Strip BOM if present
  const clean = csv.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into logical rows (respecting quoted fields that span multiple lines)
  const rows = splitCSVRows(clean);
  if (rows.length < 2) return [];

  const headers = parseLine(rows[0]);
  const result: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const line = rows[i].trim();
    if (!line) continue;
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h.trim()] = (values[idx] ?? '').trim(); });
    result.push(row);
  }
  return result;
}

/** Split CSV text into logical rows, keeping quoted multi-line fields intact. */
function splitCSVRows(text: string): string[] {
  const rows: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < text.length && text[i + 1] === '"') {
        current += '""';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if (ch === '\n' && !inQuotes) {
      rows.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) rows.push(current);
  return rows;
}

/** Parse a single CSV line respecting quoted fields. */
function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

/** Serialize an array of objects to a CSV string. */
export function toCSV(rows: Record<string, unknown>[], headers?: string[]): string {
  if (!rows.length) return '';
  const keys = headers ?? Object.keys(rows[0]);
  const lines: string[] = [keys.join(',')];

  for (const row of rows) {
    const values = keys.map(k => {
      const val = row[k];
      if (val == null) return '';
      const str = Array.isArray(val) ? val.join('|') : String(val);
      // Quote if contains comma, quote, or newline
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    });
    lines.push(values.join(','));
  }
  return lines.join('\n');
}
