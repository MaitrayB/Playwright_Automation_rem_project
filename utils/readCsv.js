import fs from 'fs';
import { parse } from 'csv-parse/sync';

export function readCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return parse(content, {
    columns: true,      // returns objects instead of arrays
    skip_empty_lines: true,
    trim: true
  });
}