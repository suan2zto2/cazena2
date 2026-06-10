import { google } from 'googleapis';
import * as path from 'path';

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'service-account.json');
const SPREADSHEET_ID = '1SRpzgAzrPeH7GlxGkBo3hs83RiYDknOo3uXKJkeRubM';

// ─── StringTBL_KR: Name | UID | KR ───────────────────────────────────────────
// UID 범위:
//   10000~19999  상태이상 이름(짝수)·설명(홀수)
//   20000~29999  CardTrait 이름
//   30000~39999  CardTeam 이름
//   40000~49999  CardRarity 이름
//   50000~59999  CardIntent 이름(짝수)·설명(홀수)
//   200000~      카드 이름(짝수)·설명(홀수)
//   260000~      챔피언 이름(짝수)
//   261000~      적 이름(짝수)
//   270000~      이벤트 문자열
const STRING_TBL = [
  // 상태이상 이름·설명 (10000~)
  [1,  10000, '공격력'],
  [2,  10001, '모든 공격 카드의 피해가 증가합니다.'],
  [3,  10002, '마법 공격력'],
  [4,  10003, '모든 마법 공격 카드의 피해가 증가합니다.'],
  [5,  10004, '방어막 (지속)'],
  [6,  10005, '매 턴 시작 시 방어막을 생성합니다.'],
  [7,  10006, '속도 보너스'],
  [8,  10007, '속도가 증가합니다. 가장 높은 속도가 먼저 행동합니다.'],
  [9,  10008, '기절'],
  [10, 10009, 'N턴 동안 행동할 수 없습니다.'],
  [11, 10010, '용감'],
  [12, 10011, '피해를 50% 추가로 입힙니다.'],
  [13, 10012, '공포'],
  [14, 10013, '피해를 50% 덜 입힙니다.'],
  [15, 10014, '취약'],
  [16, 10015, '받는 피해가 50% 증가합니다.'],
  [17, 10016, '회피'],
  [18, 10017, '받는 피해가 50% 감소합니다.'],
  [19, 10018, '중독'],
  [20, 10019, '매 턴 HP가 감소합니다. (방어막 무시)'],
  [21, 10020, '화상'],
  [22, 10021, '매 턴 HP가 감소합니다. (방어막 적용)'],
  [23, 10022, '가시'],
  [24, 10023, '공격받으면 공격자에게 반사 피해를 입힙니다.'],
  [25, 10024, '유지'],
  [26, 10025, '이 카드는 턴 종료 시 패에서 버려지지 않습니다.'],
  // CardTrait (20000~)
  [27, 20000, '스킬'],
  [28, 20002, '공격'],
  [29, 20004, '파워'],
  [30, 20006, '방어'],
  [31, 20008, '치료'],
  // CardTeam (30000~)
  [32, 30000, '감시자'],
  [33, 30002, '타격수'],
  [34, 30004, '저격수'],
  [35, 30006, '침투자'],
  [36, 30008, '치료사'],
  [37, 30010, '중립'],
  [38, 30012, '적'],
  // CardRarity (40000~)
  [39, 40000, '초기'],
  [40, 40002, '일반'],
  [41, 40004, '비범'],
  [42, 40006, '희귀'],
  [43, 40008, '신화'],
  // CardIntent (50000~)
  [44, 50000, '공격 의도'],
  [45, 50001, '적이 공격을 준비하고 있습니다.'],
  [46, 50002, '방어 의도'],
  [47, 50003, '적이 방어를 준비하고 있습니다.'],
  [48, 50004, '버프 의도'],
  [49, 50005, '적이 강화를 준비하고 있습니다.'],
  // 카드 이름·설명 (200000~)
  [50, 200000, '방패 강타'],
  [51, 200001, '방어막을 소비해 단일 적에게 강력한 피해를 입힙니다.'],
  [52, 200002, '베스천 전개'],
  [53, 200003, '아군 전체에게 방어막을 부여합니다.'],
  [54, 200004, '충격파'],
  [55, 200005, '모든 적에게 피해를 입힙니다.'],
  [56, 200006, '방어 태세'],
  [57, 200007, '아군 전체에게 방어막 상태이상을 부여합니다.'],
  [58, 200008, '연속 타격'],
  [59, 200009, '빠른 연속 공격으로 단일 적에게 피해를 입힙니다.'],
  [60, 200010, '슬라이드 킥'],
  [61, 200011, '강한 발차기로 단일 적에게 피해를 입힙니다.'],
  [62, 200012, '섬광 대시'],
  [63, 200013, '전체 적에게 연속 피해를 입힙니다.'],
  [64, 200014, '조커 돌격'],
  [65, 200015, '강력한 돌격으로 단일 적에게 큰 피해를 입힙니다.'],
  [66, 200016, '속사'],
  [67, 200017, '빠른 연사로 단일 적에게 피해를 입힙니다.'],
  [68, 200018, '정밀 사격'],
  [69, 200019, '고정밀 사격으로 단일 적에게 큰 피해를 입힙니다.'],
  [70, 200020, '라스트 노트'],
  [71, 200021, '마지막 탄환으로 단일 적에게 막대한 피해를 입힙니다.'],
  [72, 200022, '관통탄'],
  [73, 200023, '모든 방어를 무시하는 관통탄을 발사합니다.'],
  [74, 200024, '데이터 해킹'],
  [75, 200025, '적 시스템에 침투해 피해를 입힙니다.'],
  [76, 200026, '취약 분석'],
  [77, 200027, '단일 적에게 취약 상태를 부여합니다.'],
  [78, 200028, '시스템 교란'],
  [79, 200029, '적 전체에게 슬로우 상태를 부여합니다.'],
  [80, 200030, '헤르메스 스캔'],
  [81, 200031, '적 전체에게 취약 상태를 부여합니다.'],
  [82, 200032, '나노 수복'],
  [83, 200033, '단일 아군을 회복시킵니다.'],
  [84, 200034, '바이오 필드'],
  [85, 200035, '단일 아군을 대폭 회복시킵니다.'],
  [86, 200036, '펄스 웨이브'],
  [87, 200037, '전체 아군을 회복시킵니다.'],
  [88, 200038, '긴급 소생'],
  [89, 200039, '전체 아군을 회복시키고 기절 상태를 해제합니다.'],
  // 챔피언 이름 (260000~)
  [90, 260000, '케스트럴'],
  [91, 260002, '주베'],
  [92, 260004, '베인'],
  [93, 260006, '사이퍼'],
  [94, 260008, '펄스'],
  // 적 이름 (261000~)
  [95, 261000, '경비 드론'],
  [96, 261002, '순찰 유닛'],
  [97, 261004, '집행 병력'],
  [98, 261006, '제1감시자'],
  [99, 261008, '구역 사령관'],
  // 이벤트 문자열 (270000~)
  [100, 270000, '보급 창고를 발견했습니다. 어떻게 하시겠습니까?'],
  [101, 270001, '보급품 획득'],
  [102, 270002, '골드 50을 지불하고 보급품을 획득합니다.'],
  [103, 270003, '그냥 지나친다'],
  [104, 270004, '보급창고를 지나쳐 이동합니다.'],
  [105, 270005, '싸게 팔기'],
  [106, 270006, '보급품을 30골드에 팔아 넘깁니다.'],
];

// ─── CardTraitTBL: Name | ID | titleStringId | descStringId | icon ────────────
const CARD_TRAIT_TBL = [
  [1, 'skill',  20000, 0, ''],
  [2, 'attack', 20002, 0, ''],
  [3, 'power',  20004, 0, ''],
  [4, 'shield', 20006, 0, ''],
  [5, 'heal',   20008, 0, ''],
];

// ─── CardTeamTBL: Name | ID | titleStringId | icon | color ───────────────────
const CARD_TEAM_TBL = [
  [1, 'sentinel',     30000, 'sentinel',     'C0A060'],
  [2, 'striker',      30002, 'striker',      '6090C0'],
  [3, 'sharpshooter', 30004, 'sharpshooter', '60A080'],
  [4, 'infiltrator',  30006, 'infiltrator',  '806090'],
  [5, 'medic',        30008, 'medic',        'A06060'],
  [6, 'neutral',      30010, 'neutral',      'AAAAAA'],
  [7, 'enemy',        30012, 'enemy',        '904040'],
];

// ─── CardRarityTBL: Name | ID | titleStringId | icon | probability ────────────
const CARD_RARITY_TBL = [
  [1, 'starter',  40000, '', 0],
  [2, 'common',   40002, '', 0.4],
  [3, 'uncommon', 40004, '', 0.3],
  [4, 'rare',     40006, '', 0.2],
  [5, 'mythic',   40008, '', 0.1],
];

// ─── CardIntentTBL: Name | ID | isShow | priority | titleStringId | descStringId | icon
const CARD_INTENT_TBL = [
  [1, 'intent_attack', 1, 10, 50000, 50001, 'Attack'],
  [2, 'intent_defend', 1, 20, 50002, 50003, 'Shield'],
  [3, 'intent_buff',   1, 30, 50004, 50005, 'ArrowUp'],
];

// ─── CardAbilityTBL: Name | Type | ID | selectTrigger | trigger
//                      | trigCond1 | trigCond2 | trigCond3
//                      | selectTarget | target | tgtCond1 | tgtCond2 | tgtCond3
//                      | effect1 | effect2 | status1 | status2
//                      | effectValue | upgradeValue | selectUpBonus | upgradeBonus
//                      | chainAbility | targetFx
// trigger: OnPlay=10, StartOfTurn=20  /  target: PlayTarget=20, AllCharacters=7, CharacterSelf=4
const CARD_ABILITY_TBL = [
  // ── 감시자(케스트럴) ──────────────────────────────────────────────────────
  [1,  'Attacks', 'shield_strike',    'OnPlay', 10, '', '', '', 'PlayTarget',    20, 'is_character','is_not_allied','', 'damage', '', '', '',  22, 3, 'AttackPower', 10, '', 'SlashFX'],
  [2,  'Buffs',   'bastion_deploy',   'OnPlay', 10, '', '', '', 'AllCharacters',  7, 'is_character','is_allied',    '', 'add_shield', '', '', '',  4, 1, '', '', '', 'ShieldFX'],
  [3,  'Attacks', 'shockwave',        'OnPlay', 10, '', '', '', 'AllCharacters',  7, 'is_character','is_not_allied','', 'damage', '', '', '',  15, 2, 'AttackPower', 10, '', 'AoeFX'],
  [4,  'Buffs',   'guard_stance',     'OnPlay', 10, '', '', '', 'AllCharacters',  7, 'is_character','is_allied',    '', '', '', 'armor', '',  2, 1, '', '', '', 'ShieldFX'],
  // ── 타격수(주베) ──────────────────────────────────────────────────────────
  [5,  'Attacks', 'combo_strike',     'OnPlay', 10, '', '', '', 'PlayTarget',    20, 'is_character','is_not_allied','', 'damage', '', '', '',  14, 2, 'AttackPower', 10, '', 'SlashFX'],
  [6,  'Attacks', 'slide_kick',       'OnPlay', 10, '', '', '', 'PlayTarget',    20, 'is_character','is_not_allied','', 'damage', '', '', '',  18, 2, 'AttackPower', 10, '', 'SlashFX'],
  [7,  'Attacks', 'flash_dash',       'OnPlay', 10, '', '', '', 'AllCharacters',  7, 'is_character','is_not_allied','', 'damage', '', '', '',  10, 2, 'AttackPower', 10, '', 'FlashFX'],
  [8,  'Attacks', 'joker_charge',     'OnPlay', 10, '', '', '', 'PlayTarget',    20, 'is_character','is_not_allied','', 'damage', '', '', '',  35, 5, 'AttackPower', 10, '', 'SlashFX'],
  // ── 저격수(베인) ──────────────────────────────────────────────────────────
  [9,  'Attacks', 'rapid_fire',       'OnPlay', 10, '', '', '', 'PlayTarget',    20, 'is_character','is_not_allied','', 'damage', '', '', '',  16, 2, 'AttackPower', 10, '', 'SlashFX'],
  [10, 'Attacks', 'precise_shot',     'OnPlay', 10, '', '', '', 'PlayTarget',    20, 'is_character','is_not_allied','', 'damage', '', '', '',  28, 4, 'AttackPower', 10, '', 'SlashFX'],
  [11, 'Attacks', 'last_note',        'OnPlay', 10, '', '', '', 'PlayTarget',    20, 'is_character','is_not_allied','', 'damage', '', '', '',  55, 8, 'AttackPower', 10, '', 'SlashFX'],
  [12, 'Attacks', 'piercing_bullet',  'OnPlay', 10, '', '', '', 'PlayTarget',    20, 'is_character','is_not_allied','', 'damage', '', '', '',  85,10, 'AttackPower', 10, '', 'SlashFX'],
  // ── 침투자(사이퍼) ────────────────────────────────────────────────────────
  [13, 'Attacks', 'data_hack',        'OnPlay', 10, '', '', '', 'PlayTarget',    20, 'is_character','is_not_allied','', 'damage', '', '', '',  15, 2, 'AttackPower', 10, '', 'SlashFX'],
  [14, 'Debuffs', 'vuln_analysis',    'OnPlay', 10, '', '', '', 'PlayTarget',    20, 'is_character','is_not_allied','', '', '', 'vulnerable', '',  2, 0, '', '', '', 'CurseFX'],
  [15, 'Debuffs', 'sys_disruption',   'OnPlay', 10, '', '', '', 'AllCharacters',  7, 'is_character','is_not_allied','', '', '', 'slow', '',  1, 0, '', '', '', 'CurseFX'],
  [16, 'Debuffs', 'hermes_scan',      'OnPlay', 10, '', '', '', 'AllCharacters',  7, 'is_character','is_not_allied','', '', '', 'vulnerable', '',  1, 0, '', '', '', 'CurseFX'],
  // ── 치료사(펄스) ──────────────────────────────────────────────────────────
  [17, 'Heals',   'nano_repair',      'OnPlay', 10, '', '', '', 'PlayTarget',    20, 'is_character','is_allied',    '', 'heal', '', '', '',  20, 4, '', '', '', 'PotionFX'],
  [18, 'Heals',   'bio_field',        'OnPlay', 10, '', '', '', 'PlayTarget',    20, 'is_character','is_allied',    '', 'heal', '', '', '',  30, 5, '', '', '', 'PotionFX'],
  [19, 'Heals',   'pulse_wave',       'OnPlay', 10, '', '', '', 'AllCharacters',  7, 'is_character','is_allied',    '', 'heal', '', '', '',  18, 3, '', '', '', 'PotionFX'],
  [20, 'Heals',   'emergency_revive', 'OnPlay', 10, '', '', '', 'AllCharacters',  7, 'is_character','is_allied',    '', 'heal', '', '', '',  25, 4, '', '', '', 'PotionFX'],
  // ── 적 어빌리티 ───────────────────────────────────────────────────────────
  [21, 'Enemy',   'enemy_atk_s12',    'OnPlay', 10, '', '', '', 'PlayTarget',    20, 'is_character','is_not_allied','', 'damage', '', '', '',  12, 0, '', '', '', 'SlashFX'],
  [22, 'Enemy',   'enemy_atk_s18',    'OnPlay', 10, '', '', '', 'PlayTarget',    20, 'is_character','is_not_allied','', 'damage', '', '', '',  18, 0, '', '', '', 'SlashFX'],
  [23, 'Enemy',   'enemy_atk_a10',    'OnPlay', 10, '', '', '', 'AllCharacters',  7, 'is_character','is_not_allied','', 'damage', '', '', '',  10, 0, '', '', '', 'AoeFX'],
  [24, 'Enemy',   'enemy_debuff_slow','OnPlay', 10, '', '', '', 'PlayTarget',    20, 'is_character','is_not_allied','', '', '', 'slow', '',  2, 0, '', '', '', 'CurseFX'],
  [25, 'Enemy',   'enemy_atk_a18',    'OnPlay', 10, '', '', '', 'AllCharacters',  7, 'is_character','is_not_allied','', 'damage', '', '', '',  18, 0, '', '', '', 'AoeFX'],
  [26, 'Enemy',   'enemy_buff_shield','OnPlay', 10, '', '', '', 'CharacterSelf',  4, '', '', '',             'add_shield', '', '', '',  5, 0, '', '', '', 'ShieldFX'],
];

// ─── CardStatusTBL: Name | ID | selectEffect | statusEffect | selectDuration | statusDuration
//                     | isNegative | titleStringId | descStringId | icon | fx | animation
const CARD_STATUS_TBL = [
  [1,  'attack_power', 'AttackPower', 10, 'Persistant',  0, 0, 10000, 10001, 'sword',   '',        ''],
  [2,  'magic_power',  'MagicPower',  12, 'Persistant',  0, 0, 10002, 10003, 'wand',    '',        ''],
  [3,  'armor',        'Armor',       15, 'Persistant',  0, 0, 10004, 10005, 'shield',  '',        ''],
  [4,  'speed_bonus',  'SpeedBonus',   7, 'Persistant',  0, 0, 10006, 10007, 'speed',   '',        ''],
  [5,  'stunned',      'Stunned',     20, 'OneTurn',      2, 1, 10008, 10009, 'confused','',        ''],
  [6,  'courageous',   'Courageous',  30, 'AutoReduce',  10, 0, 10010, 10011, 'courage', '',        ''],
  [7,  'fearful',      'Fearful',     31, 'AutoReduce',  10, 1, 10012, 10013, 'fear',    '',        ''],
  [8,  'vulnerable',   'Vulnerable',  32, 'AutoReduce',  10, 1, 10014, 10015, 'weak',    'CurseFX', ''],
  [9,  'evasive',      'Evasive',     33, 'AutoReduce',  10, 0, 10016, 10017, 'evasive', '',        ''],
  [10, 'poisoned',     'Poisoned',    40, 'AutoReduce',  10, 1, 10018, 10019, 'poison',  'PoisonFX',''],
  [11, 'burned',       'Burned',      42, 'AutoReduce',  10, 1, 10020, 10021, 'flame',   'BurnFX',  ''],
  [12, 'thorn',        'Thorn',       55, 'AutoReduce',  10, 0, 10022, 10023, 'thorn',   '',        ''],
  [13, 'keep',         'Keep',        60, 'Persistant',   0, 0, 10024, 10025, 'keep',    '',        ''],
  [14, 'slow',         'SpeedBonus',   7, 'AutoReduce',  10, 1, 10006, 10007, 'slow',    'CurseFX', ''],
];

// ─── CardTBL: Name | ID | titleStringId | descStringId | cardType | team | rarity | mana
//               | trait1 | trait2 | ability1 | ability2 | ability3 | ability4
//               | upgradeMax | upgradeMana | shopCost | intent | tileRank | upgradedTileRank
const CARD_TBL = [
  // ── 감시자(케스트럴) ──────────────────────────────────────────────────────
  [1,  'shield_strike_card',   200000, 200001, 'Skill',  'sentinel',     'starter',  0, 'skill',  'attack', 'shield_strike',   '', '', '', 3, 0,  80, 'intent_attack', 'A', 'B'],
  [2,  'bastion_card',         200002, 200003, 'Skill',  'sentinel',     'common',   1, 'skill',  'shield', 'bastion_deploy',  '', '', '', 3, 1, 100, 'intent_defend', 'B', 'C'],
  [3,  'shockwave_card',       200004, 200005, 'Skill',  'sentinel',     'uncommon', 1, 'skill',  'attack', 'shockwave',       '', '', '', 3, 1, 150, 'intent_attack', 'C', 'D'],
  [4,  'guard_stance_card',    200006, 200007, 'Power',  'sentinel',     'rare',     0, 'power',  'shield', 'guard_stance',    '', '', '', 3, 0, 200, 'intent_defend', 'D', 'E'],
  // ── 타격수(주베) ──────────────────────────────────────────────────────────
  [5,  'combo_strike_card',    200008, 200009, 'Skill',  'striker',      'starter',  0, 'skill',  'attack', 'combo_strike',    '', '', '', 3, 0,  80, 'intent_attack', 'A', 'B'],
  [6,  'slide_kick_card',      200010, 200011, 'Skill',  'striker',      'common',   0, 'skill',  'attack', 'slide_kick',      '', '', '', 3, 0, 100, 'intent_attack', 'B', 'C'],
  [7,  'flash_dash_card',      200012, 200013, 'Skill',  'striker',      'uncommon', 1, 'skill',  'attack', 'flash_dash',      '', '', '', 3, 1, 150, 'intent_attack', 'C', 'D'],
  [8,  'joker_charge_card',    200014, 200015, 'Power',  'striker',      'rare',     2, 'power',  'attack', 'joker_charge',    '', '', '', 3, 2, 200, 'intent_attack', 'D', 'E'],
  // ── 저격수(베인) ──────────────────────────────────────────────────────────
  [9,  'rapid_fire_card',      200016, 200017, 'Skill',  'sharpshooter', 'starter',  0, 'skill',  'attack', 'rapid_fire',      '', '', '', 3, 0,  80, 'intent_attack', 'A', 'B'],
  [10, 'precise_shot_card',    200018, 200019, 'Skill',  'sharpshooter', 'common',   1, 'skill',  'attack', 'precise_shot',    '', '', '', 3, 1, 100, 'intent_attack', 'B', 'C'],
  [11, 'last_note_card',       200020, 200021, 'Skill',  'sharpshooter', 'uncommon', 2, 'skill',  'attack', 'last_note',       '', '', '', 3, 2, 150, 'intent_attack', 'C', 'D'],
  [12, 'piercing_bullet_card', 200022, 200023, 'Power',  'sharpshooter', 'rare',     2, 'power',  'attack', 'piercing_bullet', '', '', '', 3, 2, 200, 'intent_attack', 'D', 'E'],
  // ── 침투자(사이퍼) ────────────────────────────────────────────────────────
  [13, 'data_hack_card',       200024, 200025, 'Skill',  'infiltrator',  'starter',  0, 'skill',  'attack', 'data_hack',       '', '', '', 3, 0,  80, 'intent_attack', 'A', 'B'],
  [14, 'vuln_analysis_card',   200026, 200027, 'Skill',  'infiltrator',  'common',   1, 'skill',  '',       'vuln_analysis',   '', '', '', 3, 1, 100, '',              'B', 'C'],
  [15, 'sys_disruption_card',  200028, 200029, 'Skill',  'infiltrator',  'uncommon', 1, 'skill',  '',       'sys_disruption',  '', '', '', 3, 1, 150, '',              'C', 'D'],
  [16, 'hermes_scan_card',     200030, 200031, 'Power',  'infiltrator',  'rare',     2, 'power',  '',       'hermes_scan',     '', '', '', 3, 2, 200, '',              'D', 'E'],
  // ── 치료사(펄스) ──────────────────────────────────────────────────────────
  [17, 'nano_repair_card',     200032, 200033, 'Skill',  'medic',        'starter',  1, 'skill',  'heal',   'nano_repair',     '', '', '', 3, 1,  80, '',              'A', 'B'],
  [18, 'bio_field_card',       200034, 200035, 'Skill',  'medic',        'common',   2, 'skill',  'heal',   'bio_field',       '', '', '', 3, 2, 100, '',              'B', 'C'],
  [19, 'pulse_wave_card',      200036, 200037, 'Skill',  'medic',        'uncommon', 2, 'skill',  'heal',   'pulse_wave',      '', '', '', 3, 2, 150, '',              'C', 'D'],
  [20, 'emergency_revive_card',200038, 200039, 'Power',  'medic',        'rare',     3, 'power',  'heal',   'emergency_revive','', '', '', 3, 3, 200, '',              'D', 'E'],
  // ── 적 전용 카드 ──────────────────────────────────────────────────────────
  [21, 'drone_strike',     0, 0, 'Skill', 'enemy', 'starter', 0, '', '', 'enemy_atk_s12',    '', '', '', 0, 0, 0, 'intent_attack', 'A', ''],
  [22, 'patrol_attack',    0, 0, 'Skill', 'enemy', 'starter', 0, '', '', 'enemy_atk_s12',    '', '', '', 0, 0, 0, 'intent_attack', 'A', ''],
  [23, 'enforcer_strike',  0, 0, 'Skill', 'enemy', 'starter', 0, '', '', 'enemy_atk_s18',    '', '', '', 0, 0, 0, 'intent_attack', 'A', ''],
  [24, 'enforcer_aoe',     0, 0, 'Skill', 'enemy', 'starter', 0, '', '', 'enemy_atk_a10',    '', '', '', 0, 0, 0, 'intent_attack', 'A', ''],
  [25, 'enforcer_slow',    0, 0, 'Skill', 'enemy', 'starter', 0, '', '', 'enemy_debuff_slow', '', '', '', 0, 0, 0, '',              'A', ''],
  [26, 'boss_slam',        0, 0, 'Skill', 'enemy', 'starter', 0, '', '', 'enemy_atk_s18',    '', '', '', 0, 0, 0, 'intent_attack', 'A', ''],
  [27, 'boss_aoe',         0, 0, 'Skill', 'enemy', 'starter', 0, '', '', 'enemy_atk_a18',    '', '', '', 0, 0, 0, 'intent_attack', 'A', ''],
  [28, 'boss_shield',      0, 0, 'Skill', 'enemy', 'starter', 0, '', '', 'enemy_buff_shield', '', '', '', 0, 0, 0, 'intent_defend', 'A', ''],
];

// ─── ChampionTBL: Name | ID | titleStringId | hp | speed | hand | energy
//                  | lvUpHp | lvUpSpeed | lvUpHand | lvUpEnergy
//                  | team | startDeck | rewardCard1 | rewardCard2
const CHAMPION_TBL = [
  [1, 'kestrel', 260000, 100, 6, 4, 3, 10, 0.5, 0.25, 0, 'sentinel',     'kestrel_deck',     'sentinel',     'neutral'],
  [2, 'jube',    260002,  90, 7, 5, 3,  8, 0.5, 0.25, 0, 'striker',      'jube_deck',        'striker',      'neutral'],
  [3, 'vane',    260004,  85, 7, 4, 3,  8, 0.5, 0.25, 0, 'sharpshooter', 'vane_deck',        'sharpshooter', 'neutral'],
  [4, 'cipher',  260006,  85, 6, 5, 3,  8, 0.5, 0.25, 0, 'infiltrator',  'cipher_deck',      'infiltrator',  'neutral'],
  [5, 'pulse',   260008, 100, 6, 5, 3, 12, 0.5, 0.25, 0, 'medic',        'pulse_deck',       'medic',        'neutral'],
];

// ─── EnemyTBL: Name | ID | titleStringId | hp | speed | hand | energy
//               | lvUpMax | lvUpHp | lvUpSpeed | lvUpHand | lvUpEnergy
//               | behavior | trait1 | ability1 | cardDeck | rewardGold | rewardXP | spawnFx
const ENEMY_TBL = [
  [1, 'guard_drone',        261000,  50, 5, 2, 1, 3,  8,   0, 0, 0, 'behavior_sequence', '', '', 'guard_drone_deck',        0, 10, ''],
  [2, 'patrol_unit',        261002,  65, 6, 3, 1, 3, 10,   0, 0, 0, 'behavior_sequence', '', '', 'patrol_unit_deck',        0, 15, ''],
  [3, 'enforcer',           261004, 110, 6, 4, 2, 2, 15, 0.5, 0, 0, 'behavior_sequence', '', '', 'enforcer_deck',          20, 30, ''],
  [4, 'watcher_alpha',      261006, 200, 7, 5, 3, 1, 25,   1, 0, 0, 'behavior_sequence', '', '', 'watcher_alpha_deck',     50, 80, ''],
  [5, 'sector_commander',   261008, 280, 7, 5, 3, 1, 30,   1, 0, 0, 'behavior_sequence', '', '', 'sector_commander_deck',  60, 100,''],
];

// ─── DeckTBL: Name | Type | ID | slot1~slot10 ────────────────────────────────
const DECK_TBL = [
  // 챔피언 덱
  [1,  'Champion', 'kestrel_deck',   'shield_strike_card','bastion_card','shield_strike_card','bastion_card','shockwave_card','','','','',''],
  [2,  'Champion', 'jube_deck',      'combo_strike_card', 'slide_kick_card','combo_strike_card','slide_kick_card','flash_dash_card','','','','',''],
  [3,  'Champion', 'vane_deck',      'rapid_fire_card',   'precise_shot_card','rapid_fire_card','precise_shot_card','last_note_card','','','','',''],
  [4,  'Champion', 'cipher_deck',    'data_hack_card',    'vuln_analysis_card','data_hack_card','vuln_analysis_card','sys_disruption_card','','','','',''],
  [5,  'Champion', 'pulse_deck',     'nano_repair_card',  'bio_field_card','nano_repair_card','bio_field_card','pulse_wave_card','','','','',''],
  // 적 덱
  [6,  'Allies',   'guard_drone_deck',      'drone_strike','drone_strike','drone_strike','','','','','','',''],
  [7,  'Allies',   'patrol_unit_deck',      'patrol_attack','patrol_attack','patrol_attack','','','','','','',''],
  [8,  'Allies',   'enforcer_deck',         'enforcer_strike','enforcer_strike','enforcer_aoe','enforcer_slow','enforcer_strike','','','','',''],
  [9,  'Allies',   'watcher_alpha_deck',    'boss_slam','boss_slam','boss_aoe','boss_shield','boss_slam','boss_aoe','','','',''],
  [10, 'Allies',   'sector_commander_deck', 'boss_slam','boss_aoe','boss_slam','boss_aoe','boss_shield','boss_slam','','','',''],
];

// ─── MapTBL: Name | ID | titleStringId | depth | widthMin | widthMax | forkProbability
//              | randomEventId | fixedEventId
const MAP_TBL = [
  [1, 'city_crack', 0, 8, 1, 3, 0.5, 'city_crack', 'city_crack'],
];

// ─── MapRandomEventTBL: Name | ID | selectType | type | eventId ──────────────
// type: Battle=0, Choice=10, Trade=20, Effect=30, Reward=40, Shop=70
const MAP_RANDOM_EVENT_TBL = [
  [1, 'city_crack', 'Battle', 0,  'battle_drones'],
  [2, 'city_crack', 'Battle', 0,  'battle_patrol'],
  [3, 'city_crack', 'Battle', 0,  'battle_enforcers'],
  [4, 'city_crack', 'Choice', 10, 'scavenge_ruins'],
  [5, 'city_crack', 'Trade',  20, 'repair_trade'],
  [6, 'city_crack', 'Shop',   70, 'sector_shop'],
];

// ─── MapFixedEventTBL: Name | ID | depth | indexMin | indexMax | eventId ──────
const MAP_FIXED_EVENT_TBL = [
  [1, 'city_crack', 4, 0, 2, 'battle_enforcer_boss'],
  [2, 'city_crack', 8, 0, 0, 'battle_watcher_alpha'],
];

// ─── MapEvent_BattleTBL: Name | ID | depthMin | depthMax | enemyLevel
//                          | enemy1~4 | extraEnemy | rewardGold | rewardXP
//                          | isRewardCards | cardRarity | winEvent
const MAP_EVENT_BATTLE_TBL = [
  [1, 'battle_drones',        1, 3, 1, 'guard_drone','guard_drone','','',           0, 0, 10, 1, 'common',   ''],
  [2, 'battle_patrol',        2, 5, 1, 'patrol_unit','guard_drone','','',           0, 0, 15, 1, 'common',   ''],
  [3, 'battle_enforcers',     3, 6, 2, 'enforcer',   'guard_drone','','',           0, 0, 25, 1, 'uncommon', ''],
  [4, 'battle_enforcer_boss', 4, 4, 3, 'enforcer',   'patrol_unit','','',           0, 20, 40, 1, 'uncommon', ''],
  [5, 'battle_watcher_alpha', 8, 8, 5, 'watcher_alpha','','','',                   0, 50, 80, 1, 'rare',     ''],
];

// ─── MapEvent_ChoiceTBL: Name | ID | depthMin | depthMax | descStringId
//                          | choice1Title | choice1Desc | choice1Effect ...
const MAP_EVENT_CHOICE_TBL = [
  [1, 'scavenge_ruins', 2, 7, 270000,
    270001, 270002, 'supply_buy',
    270003, 270004, 'skip',
    270005, 270006, 'supply_sell',
    0, 0, ''],
];

// ─── MapEvent_TradeTBL: Name | ID | selectEventTarget | eventTarget
//                         | spendGold | spendHp | gainGold | gainXp | gainHeal | descStringId
// eventTarget: ChampionAll=15
const MAP_EVENT_TRADE_TBL = [
  [1, 'supply_buy',  'ChampionAll', 15, 50, 0, 0, 0, 20, 270002],
  [2, 'supply_sell', 'ChampionAll', 15,  0, 0, 30, 0, 0, 270006],
  [3, 'skip',        'ChampionAll', 15,  0, 0,  0, 0, 0, 270004],
];

// ─── MapEvent_EffectTBL: Name | ID | selectEventTarget | eventTarget
//                          | effect1 | effect2 | value | chainEventId | descStringId
const MAP_EVENT_EFFECT_TBL = [
  [1, 'ambush', 'ChampionAll', 15, 'damage', '', 10, '', 0],
];

// ─── MapEvent_OtherTBL: Name | ID | selectType | eventType | icon | rarity | worldState
// eventType: Reward=40, Shop=70, Upgrade=60
const MAP_EVENT_OTHER_TBL = [
  [1, 'card_reward', 'Reward',  40, 'arrow_up', 'common',   ''],
  [2, 'card_shop',   'Shop',    70, 'town',     '',         ''],
  [3, 'card_upgrade','Upgrade', 60, 'upgrade',  '',         ''],
];

// ─── MapEvent_ShopTBL: Name | ID | depthMin | depthMax | buyMult | sellyMult | cardsRand | itemsRand
const MAP_EVENT_SHOP_TBL = [
  [1, 'sector_shop', 2, 7, 1, 0.5, 3, 0],
];

// ─── ExtraEnemyTBL: Name | ID | championMin | enemy1~4 ───────────────────────
const EXTRA_ENEMY_TBL = [
  [1, 'patrol_reinforcement', '', 'guard_drone', '', '', ''],
];

// ─── GlobalEnum: group | id | enum | desc ────────────────────────────────────
const GLOBAL_ENUM = [
  // StatusEffect
  ['StatusEffect', 'ManaCostBonus',     2,  'Cost increase/reduction'],
  ['StatusEffect', 'SpeedBonus',        7,  'Speed bonus'],
  ['StatusEffect', 'HandBonus',         8,  'Hand size bonus'],
  ['StatusEffect', 'AttackPower',      10,  'Damage bonus for all attack cards'],
  ['StatusEffect', 'MagicPower',       12,  'Damage bonus for all magic cards'],
  ['StatusEffect', 'Armor',            15,  'Shield per turn'],
  ['StatusEffect', 'Stunned',          20,  'Cant do any actions for X turns'],
  ['StatusEffect', 'Sleep',            22,  'Cant do any actions until attacked'],
  ['StatusEffect', 'Courageous',       30,  'Deal 50% more damage'],
  ['StatusEffect', 'Fearful',          31,  'Deal 50% less damage'],
  ['StatusEffect', 'Vulnerable',       32,  'Receive 50% more damage'],
  ['StatusEffect', 'Evasive',          33,  'Receive 50% less damage'],
  ['StatusEffect', 'Poisoned',         40,  'Lose hp each start of turn, ignoring shield'],
  ['StatusEffect', 'Burned',           42,  'Lose hp each start of turn, shield protects'],
  ['StatusEffect', 'StatusResistance', 50,  'Immune to negative status'],
  ['StatusEffect', 'BurnHeal',         52,  'Burn damage heals this character'],
  ['StatusEffect', 'Thorn',            55,  'When attacked, deal damage to attacker'],
  ['StatusEffect', 'Keep',             60,  'Card is not discarded from hand at end of turn'],
  // StatusDuration
  ['StatusDuration', 'Persistant',  0,  'Always active'],
  ['StatusDuration', 'OneTurn',     2,  'Lasts one turn'],
  ['StatusDuration', 'AutoReduce', 10,  'Stack decreases each turn'],
  // AbilityTrigger
  ['AbilityTrigger', 'None',          0,  ''],
  ['AbilityTrigger', 'Ongoing',       2,  'Always active when in play'],
  ['AbilityTrigger', 'OnPlay',       10,  'When played'],
  ['AbilityTrigger', 'OnPlayOther',  12,  'When any other card is played'],
  ['AbilityTrigger', 'StartOfTurn',  20,  'Every turn start'],
  ['AbilityTrigger', 'EndOfTurn',    22,  'Every turn end'],
  ['AbilityTrigger', 'OnDraw',       30,  'When card is drawn into hand'],
  ['AbilityTrigger', 'OnDrawOther',  31,  'When any other card is drawn'],
  ['AbilityTrigger', 'OnDeath',      40,  'When character is dying'],
  ['AbilityTrigger', 'OnDeathOther', 41,  'When any character is dying'],
  ['AbilityTrigger', 'OnDamaged',    42,  'When character is damaged'],
  ['AbilityTrigger', 'BattleStart',  50,  'At battle start'],
  ['AbilityTrigger', 'BattleEnd',    52,  'At battle end'],
  // AbilityTarget
  ['AbilityTarget', 'None',           0,  ''],
  ['AbilityTarget', 'CardSelf',       1,  'This card'],
  ['AbilityTarget', 'CharacterSelf',  4,  'The caster'],
  ['AbilityTarget', 'AllCharacters',  7,  'All characters on field'],
  ['AbilityTarget', 'AllCardsHand',  11,  'All cards in hand'],
  ['AbilityTarget', 'AllCardsAllPiles',12,'All cards in all piles'],
  ['AbilityTarget', 'AllSlots',      15,  'All slots on board'],
  ['AbilityTarget', 'AllCardData',   17,  'For card Create effects only'],
  ['AbilityTarget', 'PlayTarget',    20,  'Target selected when card was played'],
  ['AbilityTarget', 'AbilityTriggerer',25,'Card that triggered the ability'],
  ['AbilityTarget', 'SelectTarget',  30,  'Select a card, character or slot'],
  ['AbilityTarget', 'CardSelector',  40,  'Card selector menu'],
  ['AbilityTarget', 'ChoiceSelector',50,  'Choice selector menu'],
  ['AbilityTarget', 'LastPlayed',    70,  'Last card that was played'],
  ['AbilityTarget', 'LastTargeted',  72,  'Last card that was targeted'],
  ['AbilityTarget', 'LastDestroyed', 74,  'Last card that was destroyed'],
  ['AbilityTarget', 'LastSummoned',  77,  'Last card that was summoned'],
  // Conditions
  ['Conditions', 'filter_first_1',       0, ''],
  ['Conditions', 'filter_random_1',      0, ''],
  ['Conditions', 'filter_highest_hp',    0, ''],
  ['Conditions', 'filter_lowest_hp',     0, ''],
  ['Conditions', 'is_alive',             0, ''],
  ['Conditions', 'is_allied',            0, ''],
  ['Conditions', 'is_at_front',          0, ''],
  ['Conditions', 'is_at_back',           0, ''],
  ['Conditions', 'is_character',         0, ''],
  ['Conditions', 'is_not_allied',        0, ''],
  ['Conditions', 'is_not_self',          0, ''],
  ['Conditions', 'is_in_hand',           0, ''],
  ['Conditions', 'is_not_in_hand',       0, ''],
  ['Conditions', 'is_fearful',           0, ''],
  ['Conditions', 'is_courageous',        0, ''],
  ['Conditions', 'is_skill',             0, ''],
  ['Conditions', 'is_attack',            0, ''],
  ['Conditions', 'is_same_owner',        0, ''],
  ['Conditions', 'is_your_turn',         0, ''],
  ['Conditions', 'is_not_your_turn',     0, ''],
  ['Conditions', 'once_per_turn',        0, ''],
  // Effects
  ['Effects', 'damage',         0, ''],
  ['Effects', 'damage_hp',      0, ''],
  ['Effects', 'heal',           0, ''],
  ['Effects', 'add_shield',     0, ''],
  ['Effects', 'add_energy',     0, ''],
  ['Effects', 'add_gold',       0, ''],
  ['Effects', 'add_hp',         0, ''],
  ['Effects', 'add_speed',      0, ''],
  ['Effects', 'add_hand_size',  0, ''],
  ['Effects', 'draw',           0, ''],
  ['Effects', 'draw_next',      0, ''],
  ['Effects', 'discard',        0, ''],
  ['Effects', 'destroy',        0, ''],
  ['Effects', 'gain_mana',      0, ''],
  ['Effects', 'set_energy',     0, ''],
  ['Effects', 'set_hp',         0, ''],
  ['Effects', 'set_speed',      0, ''],
  ['Effects', 'shuffle_deck',   0, ''],
  ['Effects', 'send_deck',      0, ''],
  ['Effects', 'send_hand',      0, ''],
  ['Effects', 'send_void',      0, ''],
  ['Effects', 'upgrade_card',   0, ''],
  ['Effects', 'play_card',      0, ''],
  ['Effects', 'redraw_hand',    0, ''],
  ['Effects', 'clear_status_all',0,''],
  ['Effects', 'clear_temp',     0, ''],
  ['Effects', 'create_temp',    0, ''],
  ['Effects', 'resurrect',      0, ''],
  ['Effects', 'add_xp',         0, ''],
  // CardType
  ['CardType', 'Skill', 20, ''],
  ['CardType', 'Power', 30, ''],
  // CardAvailability (EventTarget용)
  ['CardAvailability', 'Available',    0,  ''],
  ['CardAvailability', 'Unlockable',  10,  ''],
  ['CardAvailability', 'ChampionActive',10,''],
  ['CardAvailability', 'ChampionAll', 15,  ''],
  // MapEventType
  ['MapEventType', 'Battle',  0,  ''],
  ['MapEventType', 'Choice', 10,  ''],
  ['MapEventType', 'Trade',  20,  ''],
  ['MapEventType', 'Effect', 30,  ''],
  ['MapEventType', 'Reward', 40,  ''],
  ['MapEventType', 'State',  50,  ''],
  ['MapEventType', 'Upgrade',60,  ''],
  ['MapEventType', 'Shop',   70,  ''],
  // WorldState
  ['WorldState', 'None',        0,  ''],
  ['WorldState', 'Map',        10,  ''],
  ['WorldState', 'Battle',     20,  ''],
  ['WorldState', 'EventChoice',30,  ''],
  ['WorldState', 'Reward',     50,  ''],
  ['WorldState', 'Shop',       52,  ''],
  ['WorldState', 'Upgrade',    54,  ''],
  ['WorldState', 'LevelUp',    55,  ''],
  ['WorldState', 'Ended',     100,  ''],
  // TileRank (2048 전용: A=2, B=4, C=8, D=16, E=32, F=64)
  ['TileRank', 'A', 2,  '기본 타일'],
  ['TileRank', 'B', 4,  '일반 타일'],
  ['TileRank', 'C', 8,  '강화 타일'],
  ['TileRank', 'D', 16, '강력 타일'],
  ['TileRank', 'E', 32, '치명 타일'],
  ['TileRank', 'F', 64, '초월 타일'],
];

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // 기존 데이터 클리어
  await sheets.spreadsheets.values.batchClear({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      ranges: [
        'StringTBL_KR!A2:Z9999',
        'CardAbilityTBL!A2:Z9999', 'CardStatusTBL!A2:Z9999',
        'CardTraitTBL!A2:Z9999',   'CardTeamTBL!A2:Z9999',
        'CardRarityTBL!A2:Z9999',  'CardIntentTBL!A2:Z9999',
        'CardTBL!A2:Z9999',
        'ChampionTBL!A2:Z9999',    'EnemyTBL!A2:Z9999',    'DeckTBL!A2:Z9999',
        'MapTBL!A2:Z9999',         'MapRandomEventTBL!A2:Z9999',
        'MapFixedEventTBL!A2:Z9999',
        'MapEvent_BattleTBL!A2:Z9999', 'MapEvent_ChoiceTBL!A2:Z9999',
        'MapEvent_TradeTBL!A2:Z9999',  'MapEvent_EffectTBL!A2:Z9999',
        'MapEvent_OtherTBL!A2:Z9999',  'MapEvent_ShopTBL!A2:Z9999',
        'ExtraEnemyTBL!A2:Z9999',  'GlobalEnum!A2:Z9999',
      ],
    },
  });

  // 데이터 입력
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: 'StringTBL_KR!A2',          values: STRING_TBL },
        { range: 'CardAbilityTBL!A2',         values: CARD_ABILITY_TBL },
        { range: 'CardStatusTBL!A2',          values: CARD_STATUS_TBL },
        { range: 'CardTraitTBL!A2',           values: CARD_TRAIT_TBL },
        { range: 'CardTeamTBL!A2',            values: CARD_TEAM_TBL },
        { range: 'CardRarityTBL!A2',          values: CARD_RARITY_TBL },
        { range: 'CardIntentTBL!A2',          values: CARD_INTENT_TBL },
        { range: 'CardTBL!A2',                values: CARD_TBL },
        { range: 'ChampionTBL!A2',            values: CHAMPION_TBL },
        { range: 'EnemyTBL!A2',               values: ENEMY_TBL },
        { range: 'DeckTBL!A2',                values: DECK_TBL },
        { range: 'MapTBL!A2',                 values: MAP_TBL },
        { range: 'MapRandomEventTBL!A2',       values: MAP_RANDOM_EVENT_TBL },
        { range: 'MapFixedEventTBL!A2',        values: MAP_FIXED_EVENT_TBL },
        { range: 'MapEvent_BattleTBL!A2',      values: MAP_EVENT_BATTLE_TBL },
        { range: 'MapEvent_ChoiceTBL!A2',      values: MAP_EVENT_CHOICE_TBL },
        { range: 'MapEvent_TradeTBL!A2',       values: MAP_EVENT_TRADE_TBL },
        { range: 'MapEvent_EffectTBL!A2',      values: MAP_EVENT_EFFECT_TBL },
        { range: 'MapEvent_OtherTBL!A2',       values: MAP_EVENT_OTHER_TBL },
        { range: 'MapEvent_ShopTBL!A2',        values: MAP_EVENT_SHOP_TBL },
        { range: 'ExtraEnemyTBL!A2',           values: EXTRA_ENEMY_TBL },
        { range: 'GlobalEnum!A2',              values: GLOBAL_ENUM },
      ],
    },
  });

  console.log('✓ 시드 데이터 입력 완료');
  console.log(`  StringTBL_KR         : ${STRING_TBL.length}행`);
  console.log(`  CardAbilityTBL       : ${CARD_ABILITY_TBL.length}개`);
  console.log(`  CardStatusTBL        : ${CARD_STATUS_TBL.length}개`);
  console.log(`  CardTraitTBL         : ${CARD_TRAIT_TBL.length}개`);
  console.log(`  CardTeamTBL          : ${CARD_TEAM_TBL.length}개`);
  console.log(`  CardRarityTBL        : ${CARD_RARITY_TBL.length}개`);
  console.log(`  CardIntentTBL        : ${CARD_INTENT_TBL.length}개`);
  console.log(`  CardTBL              : ${CARD_TBL.length}장 (플레이어20 + 적8)`);
  console.log(`  ChampionTBL          : ${CHAMPION_TBL.length}명`);
  console.log(`  EnemyTBL             : ${ENEMY_TBL.length}종`);
  console.log(`  DeckTBL              : ${DECK_TBL.length}개 (챔피언5 + 적5)`);
  console.log(`  MapTBL               : ${MAP_TBL.length}개`);
  console.log(`  MapRandomEventTBL    : ${MAP_RANDOM_EVENT_TBL.length}개`);
  console.log(`  MapFixedEventTBL     : ${MAP_FIXED_EVENT_TBL.length}개`);
  console.log(`  MapEvent_BattleTBL   : ${MAP_EVENT_BATTLE_TBL.length}개`);
  console.log(`  MapEvent_ChoiceTBL   : ${MAP_EVENT_CHOICE_TBL.length}개`);
  console.log(`  MapEvent_TradeTBL    : ${MAP_EVENT_TRADE_TBL.length}개`);
  console.log(`  MapEvent_EffectTBL   : ${MAP_EVENT_EFFECT_TBL.length}개`);
  console.log(`  MapEvent_OtherTBL    : ${MAP_EVENT_OTHER_TBL.length}개`);
  console.log(`  MapEvent_ShopTBL     : ${MAP_EVENT_SHOP_TBL.length}개`);
  console.log(`  ExtraEnemyTBL        : ${EXTRA_ENEMY_TBL.length}개`);
  console.log(`  GlobalEnum           : ${GLOBAL_ENUM.length}행`);
}

main().catch(console.error);
