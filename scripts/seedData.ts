import { google } from 'googleapis';
import * as path from 'path';

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'service-account.json');
const SPREADSHEET_ID = '1SRpzgAzrPeH7GlxGkBo3hs83RiYDknOo3uXKJkeRubM';

// ─── Stage: id | chapterId | orderInChapter | stageType | maxSlides | tileValues | tileWeights
// tileValues/tileWeights: 스폰될 타일 숫자 및 확률 가중치 (2→8:2 = 2가 80%, 4가 20%)
const STAGES = [
  ['ch1_s01', 'ch1',  1, 'NORMAL', 5, '2,4', '8,2'],
  ['ch1_s02', 'ch1',  2, 'NORMAL', 5, '2,4', '8,2'],
  ['ch1_s03', 'ch1',  3, 'NORMAL', 4, '2,4', '7,3'],
  ['ch1_s04', 'ch1',  4, 'NORMAL', 4, '2,4', '7,3'],
  ['ch1_s05', 'ch1',  5, 'BOSS',   5, '2,4', '6,4'],  // 1차 보스
  ['ch1_s06', 'ch1',  6, 'NORMAL', 5, '2,4', '7,3'],
  ['ch1_s07', 'ch1',  7, 'NORMAL', 4, '2,4', '7,3'],
  ['ch1_s08', 'ch1',  8, 'ELITE',  4, '2,4', '7,3'],
  ['ch1_s09', 'ch1',  9, 'ELITE',  4, '2,4', '6,4'],
  ['ch1_s10', 'ch1', 10, 'BOSS',   6, '2,4', '5,5'],  // 2차 보스
];

// ─── StageMonster: stageId | monsterId | position
const STAGE_MONSTERS = [
  ['ch1_s01', 'grunt',     1],
  ['ch1_s01', 'patrol',    2],
  ['ch1_s02', 'grunt',     1],
  ['ch1_s02', 'grunt',     2],
  ['ch1_s03', 'patrol',    1],
  ['ch1_s03', 'grunt',     2],
  ['ch1_s03', 'patrol',    3],
  ['ch1_s04', 'enforcer',  1],
  ['ch1_s05', 'warden',    1],   // 1차 보스
  ['ch1_s06', 'grunt',     1],
  ['ch1_s06', 'patrol',    2],
  ['ch1_s07', 'patrol',    1],
  ['ch1_s07', 'enforcer',  2],
  ['ch1_s08', 'enforcer',  1],
  ['ch1_s08', 'grunt',     2],
  ['ch1_s09', 'enforcer',  1],
  ['ch1_s09', 'enforcer',  2],
  ['ch1_s10', 'commander', 1],   // 2차 보스
];

// ─── Card: id | ownerCharacterId | name | tileRank | effectType | targetType
//          | damage | healAmount | buffId | debuffId | duration | upgradedTileRank
// 위버는 플레이어 캐릭터라 카드 테이블 제외
// 캐릭터당 4장: 3인 파티 기준 12장 덱 → 드로우 5장 후 대기덱 7장 확보
// BUFF/DEBUFF effectId는 플레이스홀더 — 실제 수치 정의는 추후
const CARDS = [
  // ── 케스트럴 (탱커): 방어·광역 위주 ─────────────────────────────────────────
  ['kestrel_c01', 'kestrel', '방패 강타',    'BASIC',    'ATTACK', 'SINGLE_ENEMY',  22, '',  '',          '',            '',  'NORMAL'],
  ['kestrel_c02', 'kestrel', '베스천 전개',  'NORMAL',   'BUFF',   'ALL_ALLIES',     '', '',  'shield_up', '',             2,  'ENHANCED'],
  ['kestrel_c03', 'kestrel', '충격파',       'NORMAL',   'ATTACK', 'ALL_ENEMIES',   15, '',  '',          '',            '',  'ENHANCED'],
  ['kestrel_c04', 'kestrel', '방어 태세',    'ENHANCED', 'BUFF',   'ALL_ALLIES',     '', '',  'def_up',    '',             2,  'POWERFUL'],

  // ── 주베 (스카우트): 저타일 다타 위주 ───────────────────────────────────────
  ['jube_c01',   'jube',    '연속 타격',     'BASIC',    'ATTACK', 'SINGLE_ENEMY',  14, '',  '',          '',            '',  'NORMAL'],
  ['jube_c02',   'jube',    '슬라이드 킥',   'BASIC',    'ATTACK', 'SINGLE_ENEMY',  18, '',  '',          '',            '',  'NORMAL'],
  ['jube_c03',   'jube',    '섬광 대시',     'NORMAL',   'ATTACK', 'ALL_ENEMIES',   10, '',  '',          '',            '',  'ENHANCED'],
  ['jube_c04',   'jube',    '조커 돌격',     'ENHANCED', 'ATTACK', 'SINGLE_ENEMY',  35, '',  '',          '',            '',  'POWERFUL'],

  // ── 베인 (스나이퍼): 고타일 단일 강타 ──────────────────────────────────────
  ['vane_c01',   'vane',    '속사',          'BASIC',    'ATTACK', 'SINGLE_ENEMY',  16, '',  '',          '',            '',  'NORMAL'],
  ['vane_c02',   'vane',    '정밀 사격',     'NORMAL',   'ATTACK', 'SINGLE_ENEMY',  28, '',  '',          '',            '',  'ENHANCED'],
  ['vane_c03',   'vane',    '라스트 노트',   'ENHANCED', 'ATTACK', 'SINGLE_ENEMY',  55, '',  '',          '',            '',  'POWERFUL'],
  ['vane_c04',   'vane',    '관통탄',        'POWERFUL', 'ATTACK', 'SINGLE_ENEMY',  85, '',  '',          '',            '',  'LETHAL'],

  // ── 사이퍼 (호크): 단타 + 디버프 ───────────────────────────────────────────
  ['cipher_c01', 'cipher',  '데이터 해킹',   'BASIC',    'ATTACK', 'SINGLE_ENEMY',  15, '',  '',          '',            '',  'NORMAL'],
  ['cipher_c02', 'cipher',  '취약 분석',     'BASIC',    'DEBUFF', 'SINGLE_ENEMY',   '', '',  '',          'vulnerable',   2,  'NORMAL'],
  ['cipher_c03', 'cipher',  '시스템 교란',   'NORMAL',   'DEBUFF', 'ALL_ENEMIES',    '', '',  '',          'slow',         1,  'ENHANCED'],
  ['cipher_c04', 'cipher',  '헤르메스 스캔', 'NORMAL',   'DEBUFF', 'ALL_ENEMIES',    '', '',  '',          'expose',       1,  'ENHANCED'],

  // ── 펄스 (서스테이너): 힐 위주 ──────────────────────────────────────────────
  ['pulse_c01',  'pulse',   '나노 수복',     'BASIC',    'HEAL',   'SINGLE_ALLY',    '', 20,  '',          '',            '',  'NORMAL'],
  ['pulse_c02',  'pulse',   '바이오 필드',   'BASIC',    'HEAL',   'SINGLE_ALLY',    '', 30,  '',          '',            '',  'NORMAL'],
  ['pulse_c03',  'pulse',   '펄스 웨이브',   'NORMAL',   'HEAL',   'ALL_ALLIES',     '', 18,  '',          '',            '',  'ENHANCED'],
  ['pulse_c04',  'pulse',   '긴급 소생',     'ENHANCED', 'HEAL',   'ALL_ALLIES',     '', 25,  '',          '',            '',  'POWERFUL'],
];

// ─── Monster: id | displayName | enemyType | maxHp | initialShield | initialCount
const MONSTERS = [
  ['grunt',     '경비 드론',   'NORMAL',  50,   0, 3],
  ['patrol',    '순찰 유닛',   'NORMAL',  65,   0, 2],
  ['enforcer',  '집행 병력',   'ELITE',  110,  10, 2],
  ['warden',    '제1감시자',   'BOSS',   200,  20, 3],
  ['commander', '구역 사령관', 'BOSS',   280,  30, 3],
];

// ─── MonsterAction: monsterId | phase | role | orderIndex | actionType | targetMode
//                   | power | effectId | effectDuration | resetCount | scheduledTurns
// role: 'default' = 기본 행동(패턴 없을 때), 'action' = 순서 행동, 'transition' = 페이즈 전환 즉발
const MONSTER_ACTIONS = [
  // grunt — 단순 단타
  ['grunt',     '1', 'default', 0, 'ATTACK_SINGLE', 'SINGLE', 12, '',       '', 3, ''],
  ['grunt',     '1', 'action',  0, 'ATTACK_SINGLE', 'SINGLE', 12, '',       '', 3, ''],

  // patrol — 단타 + 자기강화
  ['patrol',    '1', 'default', 0, 'ATTACK_SINGLE', 'SINGLE',  8, '',       '', 2, ''],
  ['patrol',    '1', 'action',  0, 'ATTACK_SINGLE', 'SINGLE',  8, '',       '', 2, ''],
  ['patrol',    '1', 'action',  1, 'BUFF_SELF',     'SINGLE',  0, 'def_up',  1, 3, ''],

  // enforcer — 광역 + 디버프
  ['enforcer',  '1', 'default', 0, 'ATTACK_SINGLE', 'SINGLE', 18, '',       '', 2, ''],
  ['enforcer',  '1', 'action',  0, 'ATTACK_AOE',    'ALL',    10, '',       '', 4, ''],
  ['enforcer',  '1', 'action',  1, 'DEBUFF',        'SINGLE',  0, 'slow',    2, 3, ''],

  // warden (보스1) — 페이즈1: 단타+광역+자강
  ['warden',    '1', 'default',    0, 'ATTACK_SINGLE', 'SINGLE', 22, '',       '', 3, ''],
  ['warden',    '1', 'action',     0, 'ATTACK_SINGLE', 'SINGLE', 22, '',       '', 3, ''],
  ['warden',    '1', 'action',     1, 'ATTACK_AOE',    'ALL',    14, '',       '', 5, ''],
  ['warden',    '1', 'action',     2, 'BUFF_SELF',     'SINGLE',  0, 'shield',  1, 4, ''],
  // warden — 페이즈2 (HP 50% 이하): 광역 강화 + 블라인드
  ['warden',    '2', 'default',    0, 'ATTACK_AOE',    'ALL',    18, '',       '', 2, ''],
  ['warden',    '2', 'action',     0, 'ATTACK_AOE',    'ALL',    18, '',       '', 2, ''],
  ['warden',    '2', 'action',     1, 'DEBUFF',        'SINGLE',  0, 'blind',   2, 3, ''],
  ['warden',    '2', 'transition', 0, 'ATTACK_AOE',    'ALL',    25, '',       '', 0, ''],

  // commander (보스2) — 페이즈1: 강타+광역+출혈
  ['commander', '1', 'default',    0, 'ATTACK_SINGLE', 'SINGLE', 28, '',       '', 3, ''],
  ['commander', '1', 'action',     0, 'ATTACK_SINGLE', 'SINGLE', 28, '',       '', 3, ''],
  ['commander', '1', 'action',     1, 'ATTACK_AOE',    'ALL',    16, '',       '', 4, ''],
  ['commander', '1', 'action',     2, 'DEBUFF',        'SINGLE',  0, 'bleed',   3, 5, ''],
  // commander — 페이즈2 (HP 50% 이하): 전체 광역 + 전체 소진
  ['commander', '2', 'default',    0, 'ATTACK_AOE',    'ALL',    20, '',       '', 2, ''],
  ['commander', '2', 'action',     0, 'ATTACK_AOE',    'ALL',    20, '',       '', 2, ''],
  ['commander', '2', 'action',     1, 'DEBUFF',        'ALL',     0, 'exhaust', 1, 3, ''],
  ['commander', '2', 'transition', 0, 'ATTACK_AOE',    'ALL',    30, '',       '', 0, ''],
];

// ─── BossPhase: monsterId | phaseNumber | triggerValue (0.0~1.0 체력 비율) | initialCount
const BOSS_PHASES = [
  ['warden',     2, 0.5, 2],
  ['commander',  2, 0.5, 2],
];

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: 'Stage!A2',         values: STAGES },
        { range: 'StageMonster!A2',  values: STAGE_MONSTERS },
        { range: 'Card!A2',          values: CARDS },
        { range: 'Monster!A2',       values: MONSTERS },
        { range: 'MonsterAction!A2', values: MONSTER_ACTIONS },
        { range: 'BossPhase!A2',     values: BOSS_PHASES },
      ],
    },
  });

  console.log('✓ 시드 데이터 입력 완료');
  console.log(`  Stage        : ${STAGES.length}개`);
  console.log(`  StageMonster : ${STAGE_MONSTERS.length}개`);
  console.log(`  Card         : ${CARDS.length}장`);
  console.log(`  Monster      : ${MONSTERS.length}종`);
  console.log(`  MonsterAction: ${MONSTER_ACTIONS.length}행`);
  console.log(`  BossPhase    : ${BOSS_PHASES.length}개`);
}

main().catch(console.error);
