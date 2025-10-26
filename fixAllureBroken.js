import fs from 'fs';
import path from 'path';

const resultsDir = './allure-results';

// Read all files from allure-results
for (const file of fs.readdirSync(resultsDir)) {
  if (file.endsWith('-result.json')) {
    const filePath = path.join(resultsDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (content.status === 'broken') {
      console.log(`Converting ${file} from broken → failed`);
      content.status = 'failed';
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    }
  }
}

console.log('✅ All "broken" statuses converted to "failed".');
