import { google } from 'googleapis';
import * as path from 'path';

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'service-account.json');
const SPREADSHEET_ID = '1SRpzgAzrPeH7GlxGkBo3hs83RiYDknOo3uXKJkeRubM';

const SHEET_HEADERS: Record<string, string[]> = {
  StringTBL_KR:       ['Name', 'UID', 'KR'],

  CardAbilityTBL:     ['Name', 'Type', 'ID', 'selectTrigger', 'trigger',
                        'trigCond1', 'trigCond2', 'trigCond3',
                        'selectTarget', 'target', 'tgtCond1', 'tgtCond2', 'tgtCond3',
                        'effect1', 'effect2', 'status1', 'status2',
                        'effectValue', 'upgradeValue', 'selectUpBonus', 'upgradeBonus',
                        'chainAbility', 'targetFx'],
  CardStatusTBL:      ['Name', 'ID', 'selectEffect', 'statusEffect',
                        'selectDuration', 'statusDuration', 'isNegative',
                        'titleStringId', 'descStringId', 'icon', 'fx', 'animation'],
  CardTraitTBL:       ['Name', 'ID', 'titleStringId', 'descStringId', 'icon'],
  CardTeamTBL:        ['Name', 'ID', 'titleStringId', 'icon', 'color'],
  CardRarityTBL:      ['Name', 'ID', 'titleStringId', 'icon', 'probability'],
  CardIntentTBL:      ['Name', 'ID', 'isShow', 'priority', 'titleStringId', 'descStringId', 'icon'],

  CardTBL:            ['Name', 'ID', 'titleStringId', 'descStringId',
                        'cardType', 'team', 'rarity', 'mana',
                        'trait1', 'trait2',
                        'ability1', 'ability2', 'ability3', 'ability4',
                        'upgradeMax', 'upgradeMana', 'shopCost', 'intent',
                        'tileRank', 'upgradedTileRank'],

  ChampionTBL:        ['Name', 'ID', 'titleStringId',
                        'hp', 'speed', 'hand', 'energy',
                        'lvUpHp', 'lvUpSpeed', 'lvUpHand', 'lvUpEnergy',
                        'team', 'startDeck', 'rewardCard1', 'rewardCard2'],
  EnemyTBL:           ['Name', 'ID', 'titleStringId',
                        'hp', 'speed', 'hand', 'energy',
                        'lvUpMax', 'lvUpHp', 'lvUpSpeed', 'lvUpHand', 'lvUpEnergy',
                        'behavior', 'trait1', 'ability1', 'cardDeck',
                        'rewardGold', 'rewardXP', 'spawnFx'],
  DeckTBL:            ['Name', 'Type', 'ID',
                        'slot1', 'slot2', 'slot3', 'slot4', 'slot5',
                        'slot6', 'slot7', 'slot8', 'slot9', 'slot10'],

  MapTBL:             ['Name', 'ID', 'titleStringId',
                        'depth', 'widthMin', 'widthMax', 'forkProbability',
                        'randomEventId', 'fixedEventId'],
  MapRandomEventTBL:  ['Name', 'ID', 'selectType', 'type', 'eventId'],
  MapFixedEventTBL:   ['Name', 'ID', 'depth', 'indexMin', 'indexMax', 'eventId'],
  MapEvent_BattleTBL: ['Name', 'ID', 'depthMin', 'depthMax', 'enemyLevel',
                        'enemy1', 'enemy2', 'enemy3', 'enemy4', 'extraEnemy',
                        'rewardGold', 'rewardXP', 'isRewardCards', 'cardRarity', 'winEvent'],
  MapEvent_ChoiceTBL: ['Name', 'ID', 'depthMin', 'depthMax', 'descStringId',
                        'choice1Title', 'choice1Desc', 'choice1Effect',
                        'choice2Title', 'choice2Desc', 'choice2Effect',
                        'choice3Title', 'choice3Desc', 'choice3Effect',
                        'choice4Title', 'choice4Desc', 'choice4Effect'],
  MapEvent_TradeTBL:  ['Name', 'ID', 'selectEventTarget', 'eventTarget',
                        'spendGold', 'spendHp', 'gainGold', 'gainXp', 'gainHeal',
                        'descStringId'],
  MapEvent_EffectTBL: ['Name', 'ID', 'selectEventTarget', 'eventTarget',
                        'effect1', 'effect2', 'value', 'chainEventId', 'descStringId'],
  MapEvent_OtherTBL:  ['Name', 'ID', 'selectType', 'eventType', 'icon', 'rarity', 'worldState'],
  MapEvent_ShopTBL:   ['Name', 'ID', 'depthMin', 'depthMax',
                        'buyMult', 'sellyMult', 'cardsRand', 'itemsRand'],
  ExtraEnemyTBL:      ['Name', 'ID', 'championMin', 'enemy1', 'enemy2', 'enemy3', 'enemy4'],

  GlobalEnum:         ['group', 'id', 'enum', 'desc'],
};

const SHEET_NAMES = [
  'StringTBL_KR',
  'CardAbilityTBL', 'CardStatusTBL', 'CardTraitTBL', 'CardTeamTBL', 'CardRarityTBL', 'CardIntentTBL',
  'CardTBL',
  'ChampionTBL', 'EnemyTBL', 'DeckTBL',
  'MapTBL', 'MapRandomEventTBL', 'MapFixedEventTBL',
  'MapEvent_BattleTBL', 'MapEvent_ChoiceTBL', 'MapEvent_TradeTBL',
  'MapEvent_EffectTBL', 'MapEvent_OtherTBL', 'MapEvent_ShopTBL',
  'ExtraEnemyTBL', 'GlobalEnum',
];

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  console.log('시트 정보 조회 중...');
  const info = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingTitles = (info.data.sheets ?? []).map(s => s.properties?.title ?? '');

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

  console.log(`\n✓ 완료 (${SHEET_NAMES.length}개 시트)`);
  SHEET_NAMES.forEach(n => console.log(`  ${n.padEnd(22)} ${SHEET_HEADERS[n].length}열`));
  console.log(`\nURL: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`);
}

main().catch(console.error);
