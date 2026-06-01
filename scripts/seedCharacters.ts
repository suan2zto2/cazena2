import { google } from 'googleapis';
import * as path from 'path';

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'service-account.json');
const SPREADSHEET_ID = '1SRpzgAzrPeH7GlxGkBo3hs83RiYDknOo3uXKJkeRubM';

// id | name | baseHp | isDlc
// id 규칙: 1 + 순번3자리 (1001~1099)
const CHARACTERS = [
  [1001, '케스트럴 (Kestrel)', 120, 'FALSE'],
  [1002, '주베 (Jube)',        90,  'FALSE'],
  [1003, '베인 (Vane)',        85,  'FALSE'],
  [1004, '사이퍼 (Cipher)',    95,  'FALSE'],
  [1005, '펄스 (Pulse)',       100, 'FALSE'],
];

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Character!A2',
    valueInputOption: 'RAW',
    requestBody: { values: CHARACTERS },
  });

  console.log(`✓ Character 탭 ${CHARACTERS.length}명 (1001~1005)`);
}

main().catch(console.error);
