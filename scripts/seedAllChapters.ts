import { google } from 'googleapis';
import * as path from 'path';

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'service-account.json');
const SPREADSHEET_ID = '1SRpzgAzrPeH7GlxGkBo3hs83RiYDknOo3uXKJkeRubM';

// ─── Chapter definitions ──────────────────────────────────────────────────────

const CH_DEFS = [
  { id: 'ch1', title: '도시의 균열',   n1: 'grunt',           n2: 'patrol',         el: 'enforcer',       b1: 'field_captain',      b2: 'warden',             b3: 'commander'         },
  { id: 'ch2', title: '암호의 미로',   n1: 'scanner',         n2: 'jammer',         el: 'breacher',       b1: 'data_broker',        b2: 'signal_jammer_boss', b3: 'network_ghost'     },
  { id: 'ch3', title: '와이어 음영',   n1: 'phantom',         n2: 'void_unit',      el: 'spectre',        b1: 'shadow_commander',   b2: 'void_architect',     b3: 'phantom_sovereign' },
  { id: 'ch4', title: '거래의 흔적',   n1: 'broker_bot',      n2: 'sentry',         el: 'vault_keeper',   b1: 'black_market_king',  b2: 'vault_guardian',     b3: 'cipher_lord'       },
  { id: 'ch5', title: '내부의 적',     n1: 'corrupt_officer', n2: 'loyalist',       el: 'sentinel_mk2',   b1: 'corrupted_director', b2: 'loyalist_warlord',   b3: 'system_tyrant'     },
  { id: 'ch6', title: '앵커를 향하여', n1: 'anchor_watcher',  n2: 'phase_hound',    el: 'null_enforcer',  b1: 'anchor_sentinel',    b2: 'phase_lord',         b3: 'null_sovereign'    },
  { id: 'ch7', title: '붕괴',          n1: 'void_soldier',    n2: 'phase_warrior',  el: 'null_destroyer', b1: 'void_marshal',       b2: 'phase_emperor',      b3: 'null_archon'       },
  { id: 'ch8', title: '최후의 컴파일', n1: 'core_defender',   n2: 'final_guardian', el: 'apex_enforcer',  b1: 'core_guardian',      b2: 'final_sentinel',     b3: 'penumbra_remnant'  },
];

// ─── Monster stats: [maxHp, initialShield, initialCount] ─────────────────────

const M_STATS: Record<string, [number, number, number]> = {
  // ch1
  grunt:              [   50,   0, 3], patrol:             [   65,   0, 2], enforcer:           [  110,  10, 2],
  field_captain:      [  150,  15, 3], warden:             [  200,  20, 3], commander:          [  280,  30, 3],
  // ch2
  scanner:            [   75,   0, 3], jammer:             [   85,   0, 2], breacher:           [  145,  15, 2],
  data_broker:        [  320,  25, 4], signal_jammer_boss: [  400,  30, 3], network_ghost:      [  520,  35, 3],
  // ch3
  phantom:            [   95,   0, 3], void_unit:          [  105,   0, 2], spectre:            [  180,  20, 2],
  shadow_commander:   [  440,  35, 4], void_architect:     [  530,  40, 3], phantom_sovereign:  [  650,  45, 3],
  // ch4
  broker_bot:         [  125,   0, 3], sentry:             [  135,   0, 2], vault_keeper:       [  230,  25, 2],
  black_market_king:  [  560,  45, 4], vault_guardian:     [  650,  50, 3], cipher_lord:        [  790,  55, 3],
  // ch5
  corrupt_officer:    [  155,   0, 3], loyalist:           [  165,   0, 2], sentinel_mk2:       [  285,  30, 2],
  corrupted_director: [  680,  55, 4], loyalist_warlord:   [  780,  60, 3], system_tyrant:      [  940,  65, 3],
  // ch6
  anchor_watcher:     [  195,   0, 3], phase_hound:        [  210,   0, 2], null_enforcer:      [  355,  35, 2],
  anchor_sentinel:    [  840,  65, 4], phase_lord:         [  960,  70, 3], null_sovereign:     [ 1150,  75, 3],
  // ch7
  void_soldier:       [  240,   0, 3], phase_warrior:      [  260,   0, 2], null_destroyer:     [  430,  40, 2],
  void_marshal:       [ 1020,  75, 4], phase_emperor:      [ 1160,  80, 3], null_archon:        [ 1380,  85, 3],
  // ch8
  core_defender:      [  295,   0, 3], final_guardian:     [  315,   0, 2], apex_enforcer:      [  510,  45, 2],
  core_guardian:      [ 1240,  85, 4], final_sentinel:     [ 1400,  90, 3], penumbra_remnant:   [ 1650, 100, 3],
};

// ─── Display names ────────────────────────────────────────────────────────────

const DISPLAY_NAMES: Record<string, string> = {
  grunt: '경비 드론',         patrol: '순찰 유닛',        enforcer: '집행 병력',
  field_captain: '현장 지휘관', warden: '제1감시자',       commander: '구역 사령관',
  scanner: '정찰 스캐너',     jammer: '교란 유닛',        breacher: '침투 병력',
  data_broker: '데이터 브로커', signal_jammer_boss: '신호 교란자', network_ghost: '네트워크 유령',
  phantom: '환영 유닛',       void_unit: '공허 병사',     spectre: '스펙터',
  shadow_commander: '그림자 사령관', void_architect: '공허 건축가', phantom_sovereign: '환영 군주',
  broker_bot: '브로커봇',     sentry: '경계 초소',        vault_keeper: '금고 경비원',
  black_market_king: '암시장 왕', vault_guardian: '금고 수호자', cipher_lord: '암호 군주',
  corrupt_officer: '부패 장교', loyalist: '충성 전사',    sentinel_mk2: '센티넬 Mk.2',
  corrupted_director: '부패 국장', loyalist_warlord: '충성 군벌', system_tyrant: '시스템 폭군',
  anchor_watcher: '앵커 감시자', phase_hound: '페이즈 하운드', null_enforcer: '널 집행자',
  anchor_sentinel: '앵커 파수꾼', phase_lord: '페이즈 군주', null_sovereign: '널 주권자',
  void_soldier: '공허 전사',  phase_warrior: '페이즈 전사', null_destroyer: '널 파괴자',
  void_marshal: '공허 원수',  phase_emperor: '페이즈 황제', null_archon: '널 아르콘',
  core_defender: '코어 방어자', final_guardian: '최후 수호자', apex_enforcer: '정점 집행자',
  core_guardian: '코어 수호신', final_sentinel: '최후 파수꾼', penumbra_remnant: '페넘브라 잔재',
};

// ─── Damage scales: [normAtk, elSingle, elAoe, b1Single, b1Aoe, b2Single, b2Aoe, b3Single, b3Aoe] ──

const SCALES = [
  [12, 18, 10,  20, 12,  22, 14,  28,  16], // ch1
  [15, 22, 13,  26, 16,  30, 18,  36,  22], // ch2
  [18, 26, 16,  32, 20,  38, 24,  44,  28], // ch3
  [22, 32, 20,  40, 25,  46, 30,  54,  35], // ch4
  [26, 38, 24,  48, 30,  56, 36,  65,  42], // ch5
  [30, 44, 28,  58, 36,  66, 43,  78,  50], // ch6
  [36, 52, 33,  70, 43,  80, 52,  93,  60], // ch7
  [42, 60, 39,  82, 52,  95, 62, 110,  72], // ch8
];

// ─── Tile configs: [[normalVals, normalWts], [eliteVals, eliteWts], [bossVals, bossWts]] ──

const TILE_CFGS = [
  [['2,4',    '7,3'],   ['2,4',    '7,3'],   ['2,4',      '5,5']   ], // ch1
  [['2,4',    '7,3'],   ['2,4',    '6,4'],   ['2,4',      '5,5']   ], // ch2
  [['2,4',    '6,4'],   ['2,4',    '6,4'],   ['2,4,8',    '5,3,2'] ], // ch3
  [['2,4',    '6,4'],   ['2,4',    '5,5'],   ['2,4,8',    '4,4,2'] ], // ch4
  [['2,4,8',  '6,3,1'], ['2,4,8',  '5,3,2'], ['2,4,8',    '4,3,3'] ], // ch5
  [['2,4,8',  '5,3,2'], ['2,4,8',  '4,3,3'], ['4,8,16',   '5,3,2'] ], // ch6
  [['2,4,8',  '4,4,2'], ['4,8,16', '5,3,2'], ['4,8,16',   '4,3,3'] ], // ch7
  [['4,8,16', '5,3,2'], ['4,8,16', '4,3,3'], ['4,8,16',   '3,3,4'] ], // ch8
];

// ─── Max slides: { normal, elite, boss } ─────────────────────────────────────

const SLIDE_CFGS = [
  { normal: 5, elite: 4, boss: 6 }, // ch1
  { normal: 5, elite: 4, boss: 6 }, // ch2
  { normal: 5, elite: 4, boss: 5 }, // ch3
  { normal: 5, elite: 4, boss: 5 }, // ch4
  { normal: 4, elite: 4, boss: 5 }, // ch5
  { normal: 4, elite: 4, boss: 5 }, // ch6
  { normal: 4, elite: 3, boss: 4 }, // ch7
  { normal: 4, elite: 3, boss: 4 }, // ch8
];

// ─── Debuff IDs (index = chapter index 0~7) ───────────────────────────────────

const ELITE_DEBUFFS = ['slow', 'slow', 'void_mark', 'lock', 'corruption', 'phase_lock', 'void_collapse', 'null_state'];
const BOSS_DEBUFFS  = ['blind', 'exhaust', 'weakness', 'gold_lock', 'override', 'anchor_drain', 'phase_break', 'core_fracture'];

// ─── Act stage patterns ───────────────────────────────────────────────────────
// Acts 1 & 2: NORMAL NORMAL ELITE SUPPLY BOSS
// Act 3:      NORMAL ELITE  ELITE UNKNOWN BOSS

const ACT_PATTERNS: Record<number, string[]> = {
  1: ['NORMAL', 'NORMAL', 'ELITE', 'SUPPLY',  'BOSS'],
  2: ['NORMAL', 'NORMAL', 'ELITE', 'SUPPLY',  'BOSS'],
  3: ['NORMAL', 'ELITE',  'ELITE', 'UNKNOWN', 'BOSS'],
};

// ─── Builders ────────────────────────────────────────────────────────────────

function makeChapters(): any[][] {
  return CH_DEFS.map(ch => [ch.id, ch.title, 'MAIN', 3]);
}

function makeActConfigs(): any[][] {
  const rows: any[][] = [];
  for (const ch of CH_DEFS) {
    rows.push([ch.id, 1, 4, '4', ch.b1]); // supply at position 4 (4th of 4 non-boss stages)
    rows.push([ch.id, 2, 4, '4', ch.b2]);
    rows.push([ch.id, 3, 4, '',  ch.b3]); // no supply; unknown at position 4
  }
  return rows;
}

function makeStages(): any[][] {
  const rows: any[][] = [];
  for (let ci = 0; ci < CH_DEFS.length; ci++) {
    const ch = CH_DEFS[ci];
    const tc = TILE_CFGS[ci];
    const sc = SLIDE_CFGS[ci];
    for (let act = 1; act <= 3; act++) {
      for (let si = 0; si < 5; si++) {
        const id = `${ch.id}_a${act}_s${si + 1}`;
        const type = ACT_PATTERNS[act][si];
        if (type === 'SUPPLY' || type === 'UNKNOWN') {
          rows.push([id, ch.id, act, type, '', '', '']);
        } else if (type === 'NORMAL') {
          rows.push([id, ch.id, act, 'NORMAL', sc.normal, tc[0][0], tc[0][1]]);
        } else if (type === 'ELITE') {
          rows.push([id, ch.id, act, 'ELITE', sc.elite, tc[1][0], tc[1][1]]);
        } else {
          rows.push([id, ch.id, act, 'BOSS', sc.boss, tc[2][0], tc[2][1]]);
        }
      }
    }
  }
  return rows;
}

function makeStageMonsters(): any[][] {
  const rows: any[][] = [];
  for (const ch of CH_DEFS) {
    for (let act = 1; act <= 3; act++) {
      const pattern = ACT_PATTERNS[act];
      const bossId = act === 1 ? ch.b1 : act === 2 ? ch.b2 : ch.b3;
      for (let si = 0; si < 5; si++) {
        const stageId = `${ch.id}_a${act}_s${si + 1}`;
        const type = pattern[si];
        if (type === 'NORMAL') {
          rows.push([stageId, ch.n1, 1]);
          rows.push([stageId, ch.n2, 2]);
        } else if (type === 'ELITE') {
          rows.push([stageId, ch.el, 1]);
          if (act === 3 && si === 2) rows.push([stageId, ch.el, 2]); // act3 s3: double elite
        } else if (type === 'BOSS') {
          rows.push([stageId, bossId, 1]);
        }
        // SUPPLY / UNKNOWN: no monsters
      }
    }
  }
  return rows;
}

function makeMonsters(): any[][] {
  const rows: any[][] = [];
  for (const ch of CH_DEFS) {
    const entries: [string, string][] = [
      [ch.n1, 'NORMAL'], [ch.n2, 'NORMAL'],
      [ch.el, 'ELITE'],
      [ch.b1, 'BOSS'], [ch.b2, 'BOSS'], [ch.b3, 'BOSS'],
    ];
    for (const [id, type] of entries) {
      const [maxHp, shield, initCount] = M_STATS[id];
      rows.push([id, DISPLAY_NAMES[id], type, maxHp, shield, initCount]);
    }
  }
  return rows;
}

function makeMonsterActions(): any[][] {
  const rows: any[][] = [];
  for (let ci = 0; ci < CH_DEFS.length; ci++) {
    const ch = CH_DEFS[ci];
    const [normAtk, elSingle, elAoe, b1s, b1a, b2s, b2a, b3s, b3a] = SCALES[ci];
    const elDebuff   = ELITE_DEBUFFS[ci];
    const bossDebuff = BOSS_DEBUFFS[ci];

    const n1c = M_STATS[ch.n1][2]; // initialCount for n1
    const n2c = M_STATS[ch.n2][2];
    const elc = M_STATS[ch.el][2];

    // n1: 2 rows
    rows.push([ch.n1, '1', 'default', 0, 'ATTACK_SINGLE', 'SINGLE', normAtk, '',       '',  n1c,     '']);
    rows.push([ch.n1, '1', 'action',  0, 'ATTACK_SINGLE', 'SINGLE', normAtk, '',       '',  n1c,     '']);

    // n2: 3 rows (attack + attack + self-buff)
    rows.push([ch.n2, '1', 'default', 0, 'ATTACK_SINGLE', 'SINGLE', normAtk, '',       '',  n2c,     '']);
    rows.push([ch.n2, '1', 'action',  0, 'ATTACK_SINGLE', 'SINGLE', normAtk, '',       '',  n2c,     '']);
    rows.push([ch.n2, '1', 'action',  1, 'BUFF_SELF',     'SINGLE', 0,       'def_up', 1,   n2c + 1, '']);

    // elite: 3 rows (single + aoe + debuff)
    rows.push([ch.el, '1', 'default', 0, 'ATTACK_SINGLE', 'SINGLE', elSingle, '',          '',  elc,     '']);
    rows.push([ch.el, '1', 'action',  0, 'ATTACK_AOE',    'ALL',    elAoe,    '',          '',  elc + 2, '']);
    rows.push([ch.el, '1', 'action',  1, 'DEBUFF',        'SINGLE', 0,        elDebuff, 2, elc + 1, '']);

    // bosses: 8 rows each (phase1: 4, phase2: 4)
    const bosses = [
      { id: ch.b1, single: b1s, aoe: b1a },
      { id: ch.b2, single: b2s, aoe: b2a },
      { id: ch.b3, single: b3s, aoe: b3a },
    ];
    for (const b of bosses) {
      const bc = M_STATS[b.id][2];
      // phase 1
      rows.push([b.id, '1', 'default',    0, 'ATTACK_SINGLE', 'SINGLE', b.single,                '',           '',  bc,     '']);
      rows.push([b.id, '1', 'action',     0, 'ATTACK_SINGLE', 'SINGLE', b.single,                '',           '',  bc,     '']);
      rows.push([b.id, '1', 'action',     1, 'ATTACK_AOE',    'ALL',    b.aoe,                   '',           '',  bc + 2, '']);
      rows.push([b.id, '1', 'action',     2, 'BUFF_SELF',     'SINGLE', 0,                       'shield', 1,  bc + 1, '']);
      // phase 2
      rows.push([b.id, '2', 'transition', 0, 'ATTACK_AOE',    'ALL',    Math.round(b.aoe * 1.8), '',           '',  0, '']);
      rows.push([b.id, '2', 'default',    0, 'ATTACK_AOE',    'ALL',    b.aoe,                   '',           '',  2, '']);
      rows.push([b.id, '2', 'action',     0, 'ATTACK_AOE',    'ALL',    b.aoe,                   '',           '',  2, '']);
      rows.push([b.id, '2', 'action',     1, 'DEBUFF',        'ALL',    0,                       bossDebuff, 1, 3, '']);
    }
  }
  return rows;
}

function makeBossPhases(): any[][] {
  const rows: any[][] = [];
  for (const ch of CH_DEFS) {
    rows.push([ch.b1, 2, 0.5, 2]);
    rows.push([ch.b2, 2, 0.5, 2]);
    rows.push([ch.b3, 2, 0.5, 2]);
  }
  return rows;
}

function makeStoryScenes(): any[][] {
  const rows: any[][] = [];
  for (const ch of CH_DEFS) {
    const c = ch.id;
    rows.push([`${c}_intro`,    c, 'CHAPTER_START', `scene_${c}_intro`,    '',     '']);
    rows.push([`${c}_b1_start`, c, 'BOSS_START',    `scene_${c}_b1_start`, ch.b1,  '']);
    rows.push([`${c}_b1_clear`, c, 'BOSS_CLEAR',    `scene_${c}_b1_clear`, ch.b1,  '']);
    rows.push([`${c}_b2_start`, c, 'BOSS_START',    `scene_${c}_b2_start`, ch.b2,  '']);
    rows.push([`${c}_b2_clear`, c, 'BOSS_CLEAR',    `scene_${c}_b2_clear`, ch.b2,  '']);
    rows.push([`${c}_b3_start`, c, 'BOSS_START',    `scene_${c}_b3_start`, ch.b3,  '']);
    rows.push([`${c}_ending`,   c, 'BOSS_CLEAR',    `scene_${c}_ending`,   ch.b3,  '']);
  }
  return rows;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const chapters      = makeChapters();
  const actConfigs    = makeActConfigs();
  const stages        = makeStages();
  const stageMonsters = makeStageMonsters();
  const monsters      = makeMonsters();
  const actions       = makeMonsterActions();
  const bossPhases    = makeBossPhases();
  const storyScenes   = makeStoryScenes();

  console.log('기존 데이터 삭제 중...');
  await sheets.spreadsheets.values.batchClear({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      ranges: [
        'Chapter!A2:Z1000',      'ActConfig!A2:Z1000',
        'Stage!A2:Z1000',        'StageMonster!A2:Z1000',
        'Monster!A2:Z1000',      'MonsterAction!A2:Z1000',
        'BossPhase!A2:Z1000',    'StoryScene!A2:Z1000',
      ],
    },
  });

  console.log('데이터 입력 중...');
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: 'Chapter!A2',       values: chapters },
        { range: 'ActConfig!A2',     values: actConfigs },
        { range: 'Stage!A2',         values: stages },
        { range: 'StageMonster!A2',  values: stageMonsters },
        { range: 'Monster!A2',       values: monsters },
        { range: 'MonsterAction!A2', values: actions },
        { range: 'BossPhase!A2',     values: bossPhases },
        { range: 'StoryScene!A2',    values: storyScenes },
      ],
    },
  });

  console.log('\n✓ 전체 8챕터 데이터 입력 완료');
  console.log(`  Chapter       : ${chapters.length}개`);
  console.log(`  ActConfig     : ${actConfigs.length}개`);
  console.log(`  Stage         : ${stages.length}개`);
  console.log(`  StageMonster  : ${stageMonsters.length}개`);
  console.log(`  Monster       : ${monsters.length}종`);
  console.log(`  MonsterAction : ${actions.length}행`);
  console.log(`  BossPhase     : ${bossPhases.length}개`);
  console.log(`  StoryScene    : ${storyScenes.length}개`);
}

main().catch(console.error);
