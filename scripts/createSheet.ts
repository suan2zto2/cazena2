import { google } from 'googleapis';
import * as path from 'path';

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'service-account.json');
const SPREADSHEET_ID = '1SRpzgAzrPeH7GlxGkBo3hs83RiYDknOo3uXKJkeRubM';

const SHEET_HEADERS: Record<string, string[]> = {
  Chapter:      ['id', 'title', 'storyType', 'actCount'],
  ActConfig:    ['chapterId', 'actNumber', 'stageCount', 'supplyPositions', 'bossMonsterId'],
  Stage:        ['id', 'chapterId', 'actNumber', 'stageType', 'maxSlides', 'tileValues', 'tileWeights'],
  StageMonster: ['stageId', 'monsterId', 'position'],
  Character:    ['id', 'name', 'baseHp', 'isDlc'],
  Card:         ['id', 'ownerCharacterId', 'name', 'tileRank', 'effectType', 'targetType', 'damage', 'healAmount', 'buffId', 'debuffId', 'duration', 'upgradedTileRank'],
  Monster:      ['id', 'displayName', 'enemyType', 'maxHp', 'initialShield', 'initialCount'],
  MonsterAction:['monsterId', 'phase', 'role', 'orderIndex', 'actionType', 'targetMode', 'power', 'effectId', 'effectDuration', 'resetCount', 'scheduledTurns'],
  BossPhase:    ['monsterId', 'phaseNumber', 'triggerValue', 'initialCount'],
  StoryScene:   ['id', 'chapterId', 'triggerType', 'sceneAssetId', 'monsterId', 'stageId'],
};

const SHEET_NAMES = ['Chapter', 'ActConfig', 'Stage', 'StageMonster', 'Character', 'Card', 'Monster', 'MonsterAction', 'BossPhase', 'StoryScene'];

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // 기존 시트 정보 조회
  console.log('시트 정보 조회 중...');
  const info = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingTitles = (info.data.sheets ?? []).map(s => s.properties?.title ?? '');

  // 없는 탭만 추가
  const sheetsToAdd = SHEET_NAMES.filter(name => !existingTitles.includes(name));
  if (sheetsToAdd.length > 0) {
    console.log(`탭 추가 중: ${sheetsToAdd.join(', ')}`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: sheetsToAdd.map(name => ({
          addSheet: { properties: { title: name } },
        })),
      },
    });
  }

  // 각 탭에 헤더 입력
  console.log('헤더 입력 중...');
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: SHEET_NAMES.map(name => ({
        range: `${name}!A1`,
        values: [SHEET_HEADERS[name]],
      })),
    },
  });

  console.log('\n✓ 완료');
  console.log(`URL: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`);
}

main().catch(console.error);
