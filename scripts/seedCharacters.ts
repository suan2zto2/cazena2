import { google } from 'googleapis';
import * as path from 'path';

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'service-account.json');
const SPREADSHEET_ID = '1SRpzgAzrPeH7GlxGkBo3hs83RiYDknOo3uXKJkeRubM';

// id | nameStringId | baseHp | isDlc
// id 규칙: 1 + 순번3자리 (1001~1099)
// nameStringId 규칙: 10001~10999 (StringTBL_KR)
const CHARACTERS = [
  [1001, 10001, 120, 'FALSE'],  // 케스트럴 (Kestrel)
  [1002, 10002,  90, 'FALSE'],  // 주베 (Jube)
  [1003, 10003,  85, 'FALSE'],  // 베인 (Vane)
  [1004, 10004,  95, 'FALSE'],  // 사이퍼 (Cipher)
  [1005, 10005, 100, 'FALSE'],  // 펄스 (Pulse)
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
