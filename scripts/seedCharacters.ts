import { google } from 'googleapis';
import * as path from 'path';

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'service-account.json');
const SPREADSHEET_ID = '1SRpzgAzrPeH7GlxGkBo3hs83RiYDknOo3uXKJkeRubM';

// id | name | baseHp | isDlc
// 위버는 플레이어 캐릭터라 제외. 파티 동료 5인만 등록.
// baseHp는 미정 — 밸런스 확정 후 수정 필요
const CHARACTERS = [
  ['kestrel', '케스트럴 (Kestrel)', 120, 'FALSE'],
  ['jube',    '주베 (Jube)',        90,  'FALSE'],
  ['vane',    '베인 (Vane)',        85,  'FALSE'],
  ['cipher',  '사이퍼 (Cipher)',    95,  'FALSE'],
  ['pulse',   '펄스 (Pulse)',       100, 'FALSE'],
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

  // 이전에 위버가 차지하던 6번째 행 클리어
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Character!A7:D7',
  });

  console.log(`✓ Character 탭 ${CHARACTERS.length}명 (파티 동료만, 위버 제외)`);
  console.log('  baseHp는 밸런스 미정 플레이스홀더 — 확정 후 수정 필요');
}

main().catch(console.error);
