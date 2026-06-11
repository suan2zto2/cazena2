// 구글 시트에 설명 행(row2) 삽입
// 엑셀 row[2]=설명, row[4]=영문키 → 영문키 기준으로 설명 맵 생성
// 현재 2행(한글+영문) 구조인 시트를 3행(한글+설명+영문) 구조로 변환

import { google } from 'googleapis';
import * as path from 'path';
import * as XLSX from 'xlsx';

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'service-account.json');
const SPREADSHEET_ID   = '1SRpzgAzrPeH7GlxGkBo3hs83RiYDknOo3uXKJkeRubM';
const EXCEL_PATH       = path.join(__dirname, '..', 'data', 'DataList.xlsm');

// 이미 완료됐거나 특수 구조인 시트
const SKIP_SHEETS = new Set(['CardTBL', 'GlobalEnum', 'info']);

async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// 엑셀 각 시트에서 영문키 → 설명 맵 추출
function buildDescMaps(): Record<string, Record<string, string>> {
  const wb = XLSX.readFile(EXCEL_PATH);
  const maps: Record<string, Record<string, string>> = {};

  for (const sheetName of wb.SheetNames) {
    if (sheetName === 'info') continue;
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' }) as string[][];
    if (data.length < 5) continue;

    const englishRow = data[4]; // row[4] = 영문키
    const descRow    = data[2]; // row[2] = 설명
    const map: Record<string, string> = {};
    englishRow.forEach((en, i) => {
      const key = String(en).trim();
      if (key) map[key] = String(descRow[i] ?? '').trim();
    });
    maps[sheetName] = map;
  }
  return maps;
}

// row 안에 descMap의 키가 하나라도 있으면 영문 헤더행으로 판단
function isEnglishRow(row: string[], descMap: Record<string, string>): boolean {
  return row.some(v => v.trim() !== '' && v.trim() in descMap);
}

async function main() {
  console.log('엑셀 설명 맵 구성 중...');
  const descMaps = buildDescMaps();

  console.log('Google Sheets 연결 중...');
  const sheets = await getSheets();

  // 스프레드시트의 모든 시트 탭 목록 조회
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetTitles = (meta.data.sheets ?? []).map(s => s.properties?.title ?? '');

  for (const sheetName of sheetTitles) {
    if (SKIP_SHEETS.has(sheetName)) {
      console.log(`  ⏩ ${sheetName} (건너뜀)`);
      continue;
    }

    const descMap = descMaps[sheetName] ?? {};
    if (Object.keys(descMap).length === 0) {
      console.log(`  ⚠ ${sheetName}: 엑셀 설명 맵 없음, 건너뜀`);
      continue;
    }

    // 현재 시트 데이터 읽기
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
    });
    const values: string[][] = (res.data.values ?? []) as string[][];
    if (values.length < 2) {
      console.log(`  ⚠ ${sheetName}: 데이터 부족, 건너뜀`);
      continue;
    }

    const row0 = values[0] ?? []; // 한글 헤더
    const row1 = values[1] ?? []; // 영문 헤더 OR 설명행
    const row2 = values[2] ?? []; // 데이터 OR 영문 헤더

    // row1이 영문 키 행이면 → 2행 구조 → 삽입 필요
    // row2가 영문 키 행이면 → 이미 3행 구조 → 건너뜀
    if (isEnglishRow(row2, descMap)) {
      console.log(`  ⏩ ${sheetName}: 이미 3행 헤더 적용됨`);
      continue;
    }

    if (!isEnglishRow(row1, descMap)) {
      console.log(`  ⚠ ${sheetName}: 영문 헤더를 row1/row2 모두에서 찾지 못함`);
      continue;
    }

    // row1 = 영문 헤더, 설명 행 생성
    const englishRow    = row1;
    const descRow       = englishRow.map(en => descMap[en.trim()] ?? '');
    const dataRows      = values.slice(2);

    // 새 구조: [한글, 설명, 영문, ...data]
    const newValues = [row0, descRow, englishRow, ...dataRows];

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: newValues },
    });

    const filled = descRow.filter(d => d !== '').length;
    console.log(`  ✓ ${sheetName}: 설명 행 삽입 (${filled}/${englishRow.length}개 채워짐)`);
  }

  console.log('\n완료!');
}

main().catch(console.error);
