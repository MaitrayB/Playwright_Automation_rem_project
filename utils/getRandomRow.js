import fs from 'fs';
import { parse } from 'csv-parse/sync';

export function getRandomRow(csvPath) {
  const fileContent = fs.readFileSync(csvPath);
  const csvData = parse(fileContent, { columns: true, skip_empty_lines: true });

  const randomIndex = process.env.RANDOM_INDEX
    ? Number(process.env.RANDOM_INDEX)
    : Math.floor(Math.random() * csvData.length);

  const randomRow = csvData[randomIndex];
  //const randomRow = csvData[794];
  console.log(`🎯 Selected row index: ${randomIndex} 📦 Postcode: ${randomRow.Postcodes}, WasteType: ${randomRow.WasteType}`);

  return randomRow;
}
