import { google } from 'googleapis';
import * as path from 'path';

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'service-account.json');
const SPREADSHEET_ID = '1SRpzgAzrPeH7GlxGkBo3hs83RiYDknOo3uXKJkeRubM';

// ─── ID 체계 ──────────────────────────────────────────────────────────────────
//  Chapter    1 ~ 99       순번 그대로
//  Character  1001 ~ 1099  1 + 순번3자리         (seedCharacters.ts)
//  Monster    2101 ~ 2399  2 + 타입(1/2/3) + 순번2자리
//  Card       3101 ~ 3999  3 + 캐릭터순번(1자리) + 카드순번(2자리)
//  StoryScene 4101 ~ 4999  4 + 챕터(1자리) + 씬순번(2자리)
//  Stage      10101~80305  챕터(1자리) + 막(1자리) + 스테이지순번(2자리)

// ─── Chapter: id | title | storyType | actCount
const CHAPTERS = [
  [1, '도시의 균열', 'MAIN', 2],
];

// ─── ActConfig: chapterId | actNumber | stageCount | supplyPositions | bossMonsterId
const ACT_CONFIGS = [
  [1, 1, 4, '',  2301],  // 1막 보스: 제1감시자(2301)
  [1, 2, 4, '2', 2302],  // 2막 보스: 구역 사령관(2302)
];

// ─── Stage: id | chapterId | actNumber | stageType | maxSlides | tileValues | tileWeights
// id: 챕터(1자리) + 막(1자리) + 순번(2자리)
const STAGES = [
  [10101, 1, 1, 'NORMAL',  5, '2,4', '8,2'],
  [10102, 1, 1, 'NORMAL',  5, '2,4', '8,2'],
  [10103, 1, 1, 'NORMAL',  4, '2,4', '7,3'],
  [10104, 1, 1, 'ELITE',   4, '2,4', '7,3'],
  [10105, 1, 1, 'BOSS',    5, '2,4', '6,4'],  // 1막 보스
  [10201, 1, 2, 'NORMAL',  5, '2,4', '7,3'],
  [10202, 1, 2, 'SUPPLY',  '', '', ''],
  [10203, 1, 2, 'UNKNOWN', '', '', ''],
  [10204, 1, 2, 'ELITE',   4, '2,4', '6,4'],
  [10205, 1, 2, 'BOSS',    6, '2,4', '5,5'],  // 2막 보스
];

// ─── StageMonster: stageId | monsterId | position
const STAGE_MONSTERS = [
  [10101, 2101, 1],  // 경비 드론
  [10101, 2102, 2],  // 순찰 유닛
  [10102, 2101, 1],
  [10102, 2101, 2],
  [10103, 2102, 1],
  [10103, 2101, 2],
  [10103, 2102, 3],
  [10104, 2201, 1],  // 집행 병력(ELITE)
  [10105, 2301, 1],  // 제1감시자(BOSS)
  [10201, 2101, 1],
  [10201, 2102, 2],
  [10204, 2201, 1],
  [10204, 2201, 2],
  [10205, 2302, 1],  // 구역 사령관(BOSS)
];

// ─── Card: id | ownerCharacterId | name | tileRank | effectType | targetType
//          | damage | healAmount | buffId | debuffId | duration | upgradedTileRank
// id: 3 + 캐릭터순번(1자리) + 카드순번(2자리)
// ownerCharacterId: 캐릭터 id (1001~1005)
const CARDS = [
  // ── 케스트럴(1001, 순번1): 3101~3104 ─────────────────────────────────────
  [3101, 1001, '방패 강타',    'BASIC',    'ATTACK', 'SINGLE_ENEMY',  22, '',  '',          '',            '',  'NORMAL'],
  [3102, 1001, '베스천 전개',  'NORMAL',   'BUFF',   'ALL_ALLIES',     '', '',  'shield_up', '',             2,  'ENHANCED'],
  [3103, 1001, '충격파',       'NORMAL',   'ATTACK', 'ALL_ENEMIES',   15, '',  '',          '',            '',  'ENHANCED'],
  [3104, 1001, '방어 태세',    'ENHANCED', 'BUFF',   'ALL_ALLIES',     '', '',  'def_up',    '',             2,  'POWERFUL'],

  // ── 주베(1002, 순번2): 3201~3204 ─────────────────────────────────────────
  [3201, 1002, '연속 타격',    'BASIC',    'ATTACK', 'SINGLE_ENEMY',  14, '',  '',          '',            '',  'NORMAL'],
  [3202, 1002, '슬라이드 킥',  'BASIC',    'ATTACK', 'SINGLE_ENEMY',  18, '',  '',          '',            '',  'NORMAL'],
  [3203, 1002, '섬광 대시',    'NORMAL',   'ATTACK', 'ALL_ENEMIES',   10, '',  '',          '',            '',  'ENHANCED'],
  [3204, 1002, '조커 돌격',    'ENHANCED', 'ATTACK', 'SINGLE_ENEMY',  35, '',  '',          '',            '',  'POWERFUL'],

  // ── 베인(1003, 순번3): 3301~3304 ─────────────────────────────────────────
  [3301, 1003, '속사',         'BASIC',    'ATTACK', 'SINGLE_ENEMY',  16, '',  '',          '',            '',  'NORMAL'],
  [3302, 1003, '정밀 사격',    'NORMAL',   'ATTACK', 'SINGLE_ENEMY',  28, '',  '',          '',            '',  'ENHANCED'],
  [3303, 1003, '라스트 노트',  'ENHANCED', 'ATTACK', 'SINGLE_ENEMY',  55, '',  '',          '',            '',  'POWERFUL'],
  [3304, 1003, '관통탄',       'POWERFUL', 'ATTACK', 'SINGLE_ENEMY',  85, '',  '',          '',            '',  'LETHAL'],

  // ── 사이퍼(1004, 순번4): 3401~3404 ──────────────────────────────────────
  [3401, 1004, '데이터 해킹',  'BASIC',    'ATTACK', 'SINGLE_ENEMY',  15, '',  '',          '',            '',  'NORMAL'],
  [3402, 1004, '취약 분석',    'BASIC',    'DEBUFF', 'SINGLE_ENEMY',   '', '',  '',          'vulnerable',   2,  'NORMAL'],
  [3403, 1004, '시스템 교란',  'NORMAL',   'DEBUFF', 'ALL_ENEMIES',    '', '',  '',          'slow',         1,  'ENHANCED'],
  [3404, 1004, '헤르메스 스캔','NORMAL',   'DEBUFF', 'ALL_ENEMIES',    '', '',  '',          'expose',       1,  'ENHANCED'],

  // ── 펄스(1005, 순번5): 3501~3504 ─────────────────────────────────────────
  [3501, 1005, '나노 수복',    'BASIC',    'HEAL',   'SINGLE_ALLY',    '', 20,  '',          '',            '',  'NORMAL'],
  [3502, 1005, '바이오 필드',  'BASIC',    'HEAL',   'SINGLE_ALLY',    '', 30,  '',          '',            '',  'NORMAL'],
  [3503, 1005, '펄스 웨이브',  'NORMAL',   'HEAL',   'ALL_ALLIES',     '', 18,  '',          '',            '',  'ENHANCED'],
  [3504, 1005, '긴급 소생',    'ENHANCED', 'HEAL',   'ALL_ALLIES',     '', 25,  '',          '',            '',  'POWERFUL'],
];

// ─── Monster: id | displayName | enemyType | maxHp | initialShield | initialCount
// id: 2 + 타입(1:NORMAL/2:ELITE/3:BOSS) + 순번2자리
const MONSTERS = [
  [2101, '경비 드론',   'NORMAL',  50,   0, 3],  // NORMAL 1번
  [2102, '순찰 유닛',   'NORMAL',  65,   0, 2],  // NORMAL 2번
  [2201, '집행 병력',   'ELITE',  110,  10, 2],  // ELITE  1번
  [2301, '제1감시자',   'BOSS',   200,  20, 3],  // BOSS   1번
  [2302, '구역 사령관', 'BOSS',   280,  30, 3],  // BOSS   2번
];

// ─── MonsterAction: monsterId | phase | role | orderIndex | actionType | targetMode
//                   | power | effectId | effectDuration | resetCount | scheduledTurns
const MONSTER_ACTIONS = [
  [2101, '1', 'default', 0, 'ATTACK_SINGLE', 'SINGLE', 12, '',       '', 3, ''],
  [2101, '1', 'action',  0, 'ATTACK_SINGLE', 'SINGLE', 12, '',       '', 3, ''],

  [2102, '1', 'default', 0, 'ATTACK_SINGLE', 'SINGLE',  8, '',       '', 2, ''],
  [2102, '1', 'action',  0, 'ATTACK_SINGLE', 'SINGLE',  8, '',       '', 2, ''],
  [2102, '1', 'action',  1, 'BUFF_SELF',     'SINGLE',  0, 'def_up',  1, 3, ''],

  [2201, '1', 'default', 0, 'ATTACK_SINGLE', 'SINGLE', 18, '',       '', 2, ''],
  [2201, '1', 'action',  0, 'ATTACK_AOE',    'ALL',    10, '',       '', 4, ''],
  [2201, '1', 'action',  1, 'DEBUFF',        'SINGLE',  0, 'slow',    2, 3, ''],

  [2301, '1', 'default',    0, 'ATTACK_SINGLE', 'SINGLE', 22, '',       '', 3, ''],
  [2301, '1', 'action',     0, 'ATTACK_SINGLE', 'SINGLE', 22, '',       '', 3, ''],
  [2301, '1', 'action',     1, 'ATTACK_AOE',    'ALL',    14, '',       '', 5, ''],
  [2301, '1', 'action',     2, 'BUFF_SELF',     'SINGLE',  0, 'shield',  1, 4, ''],
  [2301, '2', 'default',    0, 'ATTACK_AOE',    'ALL',    18, '',       '', 2, ''],
  [2301, '2', 'action',     0, 'ATTACK_AOE',    'ALL',    18, '',       '', 2, ''],
  [2301, '2', 'action',     1, 'DEBUFF',        'SINGLE',  0, 'blind',   2, 3, ''],
  [2301, '2', 'transition', 0, 'ATTACK_AOE',    'ALL',    25, '',       '', 0, ''],

  [2302, '1', 'default',    0, 'ATTACK_SINGLE', 'SINGLE', 28, '',       '', 3, ''],
  [2302, '1', 'action',     0, 'ATTACK_SINGLE', 'SINGLE', 28, '',       '', 3, ''],
  [2302, '1', 'action',     1, 'ATTACK_AOE',    'ALL',    16, '',       '', 4, ''],
  [2302, '1', 'action',     2, 'DEBUFF',        'SINGLE',  0, 'bleed',   3, 5, ''],
  [2302, '2', 'default',    0, 'ATTACK_AOE',    'ALL',    20, '',       '', 2, ''],
  [2302, '2', 'action',     0, 'ATTACK_AOE',    'ALL',    20, '',       '', 2, ''],
  [2302, '2', 'action',     1, 'DEBUFF',        'ALL',     0, 'exhaust', 1, 3, ''],
  [2302, '2', 'transition', 0, 'ATTACK_AOE',    'ALL',    30, '',       '', 0, ''],
];

// ─── BossPhase: monsterId | phaseNumber | triggerValue | initialCount
const BOSS_PHASES = [
  [2301, 2, 0.5, 2],
  [2302, 2, 0.5, 2],
];

// ─── StoryScene: id | chapterId | triggerType | sceneAssetId | monsterId | stageId
// id: 4 + 챕터(1자리) + 씬순번(2자리)
const STORY_SCENES = [
  [4101, 1, 'CHAPTER_START', 'scene_ch1_intro',         '',    ''],
  [4102, 1, 'BOSS_START',    'scene_ch1_boss1_start',   2301,  ''],
  [4103, 1, 'BOSS_CLEAR',    'scene_ch1_boss1_clear',   2301,  ''],
  [4104, 1, 'BOSS_START',    'scene_ch1_boss2_start',   2302,  ''],
  [4105, 1, 'BOSS_CLEAR',    'scene_ch1_ending',        2302,  ''],
];

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.batchClear({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      ranges: [
        'Chapter!A2:Z1000', 'ActConfig!A2:Z1000', 'Stage!A2:Z1000',
        'StageMonster!A2:Z1000', 'Card!A2:Z1000', 'Monster!A2:Z1000',
        'MonsterAction!A2:Z1000', 'BossPhase!A2:Z1000', 'StoryScene!A2:Z1000',
      ],
    },
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: 'Chapter!A2',       values: CHAPTERS },
        { range: 'ActConfig!A2',     values: ACT_CONFIGS },
        { range: 'Stage!A2',         values: STAGES },
        { range: 'StageMonster!A2',  values: STAGE_MONSTERS },
        { range: 'Card!A2',          values: CARDS },
        { range: 'Monster!A2',       values: MONSTERS },
        { range: 'MonsterAction!A2', values: MONSTER_ACTIONS },
        { range: 'BossPhase!A2',     values: BOSS_PHASES },
        { range: 'StoryScene!A2',    values: STORY_SCENES },
      ],
    },
  });

  console.log('✓ 시드 데이터 입력 완료 (시맨틱 숫자 ID 체계)');
  console.log(`  Chapter      : ${CHAPTERS.length}개      id: 1`);
  console.log(`  ActConfig    : ${ACT_CONFIGS.length}개`);
  console.log(`  Stage        : ${STAGES.length}개     id: 10101~10205`);
  console.log(`  StageMonster : ${STAGE_MONSTERS.length}개`);
  console.log(`  Card         : ${CARDS.length}장     id: 3101~3504`);
  console.log(`  Monster      : ${MONSTERS.length}종      id: 2101, 2102, 2201, 2301, 2302`);
  console.log(`  MonsterAction: ${MONSTER_ACTIONS.length}행`);
  console.log(`  BossPhase    : ${BOSS_PHASES.length}개`);
  console.log(`  StoryScene   : ${STORY_SCENES.length}개      id: 4101~4105`);
}

main().catch(console.error);
