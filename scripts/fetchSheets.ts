import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import type {
  StringEntry, CardTrait, CardTeam, CardRarity, CardIntent,
  Ability, StatusEffect, Card, Champion, Enemy, CardDeck,
  GameMap, MapRandomEvent, MapFixedEvent,
  BattleEvent, ChoiceEvent, ChoiceOption, TradeEvent, EffectEvent, OtherEvent, ShopEvent,
  ExtraEnemy, GlobalEnumEntry,
  AbilityType, DeckType,
} from './types';

// ─── 설정 ─────────────────────────────────────────────────────────────────────

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'service-account.json');
const SPREADSHEET_ID = '1SRpzgAzrPeH7GlxGkBo3hs83RiYDknOo3uXKJkeRubM';
const OUTPUT_DIR = path.join(__dirname, '..', 'data');

// ─── 인증 ─────────────────────────────────────────────────────────────────────

async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth });
}

// ─── 시트 읽기 헬퍼 ───────────────────────────────────────────────────────────
// 시트 형식: row1=한글헤더, row2=설명, row3=영문헤더, row4+=데이터

async function readSheet(
  sheets: ReturnType<typeof google.sheets>,
  sheetName: string,
): Promise<Record<string, string>[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });
  const [row1, , header, ...rows] = res.data.values ?? []; // row1=한글, row2(설명) 스킵, row3=영문 헤더
  if (!header) return [];
  // row1의 # 시작 컬럼 제외
  const cols = header.map((key: string, i: number) => ({ key, i }))
                     .filter(({ i }: { i: number }) => !(row1?.[i] ?? '').startsWith('#'));
  return rows.map(row =>
    Object.fromEntries(cols.map(({ key, i }: { key: string; i: number }) => [key, row[i] ?? '']))
  );
}

function num(v: string) { return v === '' ? 0 : Number(v); }
function bool(v: string) { return v === '1' || v.toUpperCase() === 'TRUE'; }
function opt<T>(v: string, fn: (s: string) => T): T | undefined {
  return v?.trim() !== '' ? fn(v) : undefined;
}

// ─── 변환 함수 ────────────────────────────────────────────────────────────────
// SCHEMA 기반 제네릭 빌더: 시트에 컬럼 추가 시 코드 수정 없이 자동 반영.
// - SCHEMA에 type 명시 → 해당 타입으로 강제 변환
// - SCHEMA에 없는 새 컬럼 → string으로 자동 통과
// - sources 지정된 컬럼 → 복수 시트 컬럼을 배열로 집계

function buildGeneric(rows: Record<string, string>[], tableName: string): Record<string, unknown>[] {
  const cols = (SCHEMA[tableName]?.columns ?? []) as Array<{
    name: string; type: string; sources?: string[]; nullable?: boolean;
  }>;
  const typeMap     = new Map(cols.map(c => [c.name, c.type]));
  const nullableSet = new Set(cols.filter(c => c.nullable).map(c => c.name));
  const sourceKeys  = new Set(cols.flatMap(c => c.sources ?? []));

  return rows.map(r => {
    const obj: Record<string, unknown> = {};

    for (const [key, rawVal] of Object.entries(r)) {
      if (sourceKeys.has(key)) continue;
      const type = typeMap.get(key) ?? 'string';
      const val  = String(rawVal ?? '').trim();
      if (val === '') { if (nullableSet.has(key)) obj[key] = null; continue; }
      if      (type === 'boolean')                       { obj[key] = bool(rawVal); }
      else if (type === 'number' || type === 'number?')  { obj[key] = num(rawVal); }
      else if (type === 'string?')                       { obj[key] = val; }
      else                                               { obj[key] = rawVal ?? ''; }
    }

    for (const col of cols) {
      if (!col.sources) continue;
      const arr = col.sources.map(s => r[s] ?? '').filter(v => v !== '');
      obj[col.name] = col.type === 'number[]' ? arr.map(v => num(v)) : arr;
    }

    return obj;
  });
}

// 중첩 구조가 복잡해 buildGeneric으로 표현 불가한 테이블만 커스텀 유지

function buildChoiceEvents(rows: Record<string, string>[]): ChoiceEvent[] {
  return rows.map(r => {
    const choices: ChoiceOption[] = [];
    for (let i = 1; i <= 4; i++) {
      const effect = r[`Choice${i}Effect`];
      if (effect && effect !== '') {
        choices.push({
          TitleStringID: num(r[`Choice${i}Title`]),
          DescStringID:  num(r[`Choice${i}Desc`]),
          EffectID: effect,
        });
      }
    }
    return {
      ID: r.ID,
      DepthMin: num(r.DepthMin),
      DepthMax: num(r.DepthMax),
      DescStringID: num(r.DescStringID),
      Choices: choices,
    };
  });
}

function buildExtraEnemies(rows: Record<string, string>[]): ExtraEnemy[] {
  return rows.map(r => ({
    ID: r.ID,
    ...(num(r.Slot1ChampionMin) !== 0 && { Cond1: {
      ChampionMin: num(r.Slot1ChampionMin),
      Enemies: [r.Slot1Enemy1, r.Slot1Enemy2, r.Slot1Enemy3, r.Slot1Enemy4].map(e => e || null),
    }}),
    ...(num(r.Slot2ChampionMin) !== 0 && { Cond2: {
      ChampionMin: num(r.Slot2ChampionMin),
      Enemies: [r.Slot2Enemy1, r.Slot2Enemy2, r.Slot2Enemy3, r.Slot2Enemy4].map(e => e || null),
    }}),
  }));
}

function buildGlobalEnum(rows: Record<string, string>[]): GlobalEnumEntry[] {
  return rows.map(r => ({
    Group: r.group,
    ID: r.id,
    Enum: num(r.enum),
    Desc: r.desc,
  }));
}

// ─── 스키마 ───────────────────────────────────────────────────────────────────

const SCHEMA: Record<string, { columns: { name: string; type: string; desc: string; ref?: string; sources?: string[] }[] }> = {
  StringTBL_KR: { columns: [
    { name: 'UID', type: 'number', desc: '문자열 고유 식별자' },
    { name: 'KR',  type: 'string', desc: '한국어 문자열' },
  ]},
  CardTraitTBL: { columns: [
    { name: 'ID',            type: 'string', desc: '특성 식별자 PK' },
    { name: 'TitleStringID', type: 'number', desc: '이름 문자열', ref: 'StringTBL_KR.UID' },
    { name: 'DescStringID',  type: 'number', desc: '설명 문자열', ref: 'StringTBL_KR.UID' },
    { name: 'Icon',          type: 'string', desc: '아이콘 에셋 키' },
  ]},
  CardTeamTBL: { columns: [
    { name: 'ID',            type: 'string', desc: '팀 식별자 PK' },
    { name: 'TitleStringID', type: 'number', desc: '이름 문자열', ref: 'StringTBL_KR.UID' },
    { name: 'Icon',          type: 'string', desc: '아이콘 에셋 키' },
    { name: 'Color',         type: 'string', desc: '팀 대표 색상 (hex)' },
  ]},
  CardRarityTBL: { columns: [
    { name: 'ID',            type: 'string', desc: '희귀도 식별자 PK' },
    { name: 'TitleStringID', type: 'number', desc: '이름 문자열', ref: 'StringTBL_KR.UID' },
    { name: 'Icon',          type: 'string', desc: '아이콘 에셋 키' },
    { name: 'Probability',   type: 'number', desc: '보상 등장 가중치' },
  ]},
  CardIntentTBL: { columns: [
    { name: 'ID',            type: 'string',  desc: '의도 식별자 PK' },
    { name: 'IsShow',        type: 'boolean', desc: 'UI 표시 여부' },
    { name: 'Priority',      type: 'number',  desc: '표시 우선순위 (낮을수록 우선)' },
    { name: 'TitleStringID', type: 'number',  desc: '이름 문자열', ref: 'StringTBL_KR.UID' },
    { name: 'DescStringID',  type: 'number',  desc: '설명 문자열', ref: 'StringTBL_KR.UID' },
    { name: 'Icon',          type: 'string',  desc: '아이콘 에셋 키' },
  ]},
  CardAbilityTBL: { columns: [
    { name: 'Type',          type: 'string',  desc: 'Attacks|Heals|Buffs|Debuffs|Passives|Enemy' },
    { name: 'ID',            type: 'string',  desc: '어빌리티 식별자 PK' },
    { name: 'SelectTrigger', type: 'string',  desc: '트리거 레이블', ref: 'GlobalEnum.AbilityTrigger' },
    { name: 'Trigger',       type: 'number',  desc: '트리거 enum 값', ref: 'GlobalEnum.AbilityTrigger' },
    { name: 'TrigCond1',     type: 'string?', desc: '트리거 조건 1' },
    { name: 'TrigCond2',     type: 'string?', desc: '트리거 조건 2' },
    { name: 'TrigCond3',     type: 'string?', desc: '트리거 조건 3' },
    { name: 'SelectTarget',  type: 'string',  desc: '대상 레이블', ref: 'GlobalEnum.AbilityTarget' },
    { name: 'Target',        type: 'number',  desc: '대상 enum 값', ref: 'GlobalEnum.AbilityTarget' },
    { name: 'TgtCond1',      type: 'string?', desc: '대상 조건 1' },
    { name: 'TgtCond2',      type: 'string?', desc: '대상 조건 2' },
    { name: 'TgtCond3',      type: 'string?', desc: '대상 조건 3' },
    { name: 'TgtFilter1',    type: 'string?', desc: '대상 필터 1' },
    { name: 'Effect1',       type: 'string?', desc: '주 효과' },
    { name: 'Effect2',       type: 'string?', desc: '보조 효과' },
    { name: 'Status1',       type: 'string?', desc: '상태이상 1', ref: 'CardStatusTBL.ID' },
    { name: 'Status2',       type: 'string?', desc: '상태이상 2', ref: 'CardStatusTBL.ID' },
    { name: 'EffectValue',   type: 'number?', desc: '효과 수치' },
    { name: 'UpgradeValue',  type: 'number?', desc: '강화 시 수치 증가량' },
    { name: 'SelectUpBonus', type: 'string?', desc: '강화 보너스 타입 레이블' },
    { name: 'UpgradeBonus',  type: 'number?', desc: '강화 보너스 수치' },
    { name: 'ChainAbility',  type: 'string?', desc: '연쇄 어빌리티', ref: 'CardAbilityTBL.ID' },
    { name: 'TargetFx',      type: 'string?', desc: '효과 연출 키' },
  ]},
  CardEffectTBL: { columns: [
    { name: 'ID',                  type: 'string',   desc: '효과 식별자 PK' },
    { name: 'ClassFile',           type: 'string',   desc: 'C# 이펙트 클래스명' },
    { name: 'CharacterId',         type: 'string?',  desc: '대상 캐릭터 ID' },
    { name: 'CardId',              type: 'string?',  desc: '대상 카드 ID', ref: 'CardTBL.ID' },
    { name: 'StatusId',            type: 'string?',  desc: '적용 상태이상 ID', ref: 'CardStatusTBL.ID' },
    { name: 'AbilityId',           type: 'string?',  desc: '연쇄 어빌리티 ID', ref: 'CardAbilityTBL.ID' },
    { name: 'StatType',            type: 'number?',  desc: '스탯 종류', ref: 'GlobalEnum.StatType' },
    { name: 'TraitId',             type: 'string?',  desc: '특성 ID', ref: 'CardTraitTBL.ID' },
    { name: 'DelayedStatType',     type: 'number?',  desc: '다음 턴 적용 스탯 종류', ref: 'GlobalEnum.StatType' },
    { name: 'PileType',            type: 'number?',  desc: '카드 더미 종류 (20=Hand, 30=Deck, 50=Void, 90=TempPile)' },
    { name: 'IgnoreShield',        type: 'boolean',  desc: '방어막 무시 여부' },
    { name: 'ShieldOnly',          type: 'boolean',  desc: '방어막에만 적용 여부' },
    { name: 'Percentage',          type: 'number?',  desc: '비율 값 (0.0~1.0)' },
    { name: 'Level',               type: 'number?',  desc: '레벨 값' },
    { name: 'MapOngoingBoostType', type: 'number?',  desc: '맵 지속 부스트 종류', ref: 'GlobalEnum.MapOngoingBoostType' },
    { name: 'RepeatType',          type: 'number?',  desc: '반복 종류' },
    { name: 'Dice',                type: 'number?',  desc: '주사위 면 수' },
  ]},
  CardStatusTBL: { columns: [
    { name: 'ID',             type: 'string',  desc: '상태이상 식별자 PK' },
    { name: 'SelectEffect',   type: 'string',  desc: 'StatusEffect 레이블', ref: 'GlobalEnum.StatusEffect' },
    { name: 'StatusEffect',   type: 'number',  desc: 'StatusEffect enum 값', ref: 'GlobalEnum.StatusEffect' },
    { name: 'SelectDuration', type: 'string',  desc: 'StatusDuration 레이블', ref: 'GlobalEnum.StatusDuration' },
    { name: 'StatusDuration', type: 'number',  desc: 'StatusDuration enum 값', ref: 'GlobalEnum.StatusDuration' },
    { name: 'IsNegative',     type: 'boolean', desc: 'TRUE=디버프, FALSE=버프' },
    { name: 'TitleStringID',  type: 'number',  desc: '이름 문자열', ref: 'StringTBL_KR.UID' },
    { name: 'DescStringID',   type: 'number',  desc: '설명 문자열', ref: 'StringTBL_KR.UID' },
    { name: 'Icon',           type: 'string',  desc: '아이콘 에셋 키' },
    { name: 'Fx',             type: 'string?', desc: '적용 연출 키' },
    { name: 'Animation',      type: 'string?', desc: '적용 애니메이션 키' },
  ]},
  CardTBL: { columns: [
    { name: 'Type',         type: 'string',  desc: '카드 그룹 (Adventurer|Enemies|Neutral 등)' },
    { name: 'ID',           type: 'string',  desc: '카드 식별자 PK' },
    { name: 'TitleStringID',type: 'number',  desc: '이름 문자열', ref: 'StringTBL_KR.UID' },
    { name: 'DescStringID', type: 'number',  desc: '설명 문자열', ref: 'StringTBL_KR.UID' },
    { name: 'ArtIcon',      type: 'string',  desc: '카드 아이콘 에셋 키' },
    { name: 'ArtFull',      type: 'string',  desc: '카드 풀샷 이미지 에셋 키' },
    { name: 'CardType',     type: 'number',  desc: 'Skill=1, Power=2', ref: 'GlobalEnum.CardType' },
    { name: 'ItemType',     type: 'number',  desc: 'None=0, Consumable=22, Card=24, Passive=26', ref: 'GlobalEnum.ItemType' },
    { name: 'Team',         type: 'string',  desc: '소속 팀', ref: 'CardTeamTBL.ID' },
    { name: 'Rarity',       type: 'string',  desc: '희귀도', ref: 'CardRarityTBL.ID' },
    { name: 'Mana',         type: 'number',  desc: '발동 마나 비용' },
    { name: 'Trait1',       type: 'string?', desc: '특성 1', ref: 'CardTraitTBL.ID' },
    { name: 'Trait2',       type: 'string?', desc: '특성 2', ref: 'CardTraitTBL.ID' },
    { name: 'Ability1',     type: 'string?', desc: '어빌리티 1', ref: 'CardAbilityTBL.ID' },
    { name: 'Ability2',     type: 'string?', desc: '어빌리티 2', ref: 'CardAbilityTBL.ID' },
    { name: 'Ability3',     type: 'string?', desc: '어빌리티 3', ref: 'CardAbilityTBL.ID' },
    { name: 'Ability4',     type: 'string?', desc: '어빌리티 4', ref: 'CardAbilityTBL.ID' },
    { name: 'UpgradeMax',   type: 'number',  desc: '최대 강화 횟수' },
    { name: 'UpgradeMana',  type: 'number',  desc: '강화 후 마나 비용 (-1=변경없음)' },
    { name: 'ShopCost',     type: 'number',  desc: '상점 구매 가격 (골드)' },
    { name: 'Intent',       type: 'string?', desc: '적 사용 시 의도 아이콘', ref: 'CardIntentTBL.ID' },
    { name: 'SpawnFx',      type: 'string?', desc: '등장 이펙트 키' },
    { name: 'SpawnAudio',   type: 'string?', desc: '등장 사운드 키' },
    { name: 'CasterAnim',   type: 'string',  desc: '시전 애니메이션 키' },
    { name: 'TargetAnim',   type: 'string?', desc: '대상 애니메이션 키' },
    { name: 'Availability', type: 'number',  desc: '사용 가능 조건', ref: 'GlobalEnum.CardAvailability' },
  ]},
  ConditionTBL: { columns: [
    { name: 'ID',         type: 'string',  desc: '조건 식별자 PK' },
    { name: 'Kind',       type: 'string',  desc: '조건 종류 (Filter|Condition 등)' },
    { name: 'ScriptType', type: 'string',  desc: 'C# 조건 클래스명' },
    { name: 'BoolOper',   type: 'string?', desc: '불리언 연산자' },
    { name: 'IntOper',    type: 'string?', desc: '정수 비교 연산자' },
    { name: 'Value',      type: 'string?', desc: '비교 기준 값' },
    { name: 'Amount',     type: 'number?', desc: '수량 값' },
    { name: 'StatType',   type: 'string?', desc: '스탯 종류', ref: 'GlobalEnum.StatType' },
    { name: 'PlayerType', type: 'string?', desc: '플레이어 종류' },
    { name: 'Pile',       type: 'string?', desc: '카드 더미 종류' },
    { name: 'TargetType', type: 'string?', desc: '대상 종류' },
    { name: 'PlayTarget', type: 'string?', desc: '플레이 대상' },
    { name: 'ItemType',   type: 'string?', desc: '아이템 종류' },
    { name: 'CardType',   type: 'string?', desc: '카드 종류', ref: 'GlobalEnum.CardType' },
    { name: 'StatusType', type: 'string?', desc: '상태이상 종류', ref: 'CardStatusTBL.ID' },
    { name: 'Team',       type: 'string?', desc: '팀 필터', ref: 'CardTeamTBL.ID' },
    { name: 'Trait',      type: 'string?', desc: '특성 필터', ref: 'CardTraitTBL.ID' },
    { name: 'Card',       type: 'string?', desc: '카드 필터', ref: 'CardTBL.ID' },
    { name: 'Item',       type: 'string?', desc: '아이템 필터' },
    { name: 'Status',     type: 'string?', desc: '상태이상 필터', ref: 'CardStatusTBL.ID' },
    { name: 'Map',        type: 'string?', desc: '맵 필터', ref: 'MapTBL.ID' },
    { name: 'Scenario',   type: 'string?', desc: '시나리오 필터' },
    { name: 'OperX',      type: 'string?', desc: '확장 연산자' },
    { name: 'ValueX',     type: 'string?', desc: '확장 비교 값' },
  ]},
  BehaviorTBL: { columns: [
    { name: 'ID',           type: 'string',  desc: '행동 패턴 식별자 PK' },
    { name: 'ClassName',    type: 'string',  desc: 'C# 행동 클래스명' },
    { name: 'Summon_card',  type: 'string?', desc: '소환 카드 ID', ref: 'CardTBL.ID' },
    { name: 'Ultimate_card',type: 'string?', desc: '궁극기 카드 ID', ref: 'CardTBL.ID' },
    { name: 'Phase_trait',  type: 'string?', desc: '페이즈 전환 특성 ID', ref: 'CardTraitTBL.ID' },
  ]},
  ChampionTBL: { columns: [
    { name: 'ID',            type: 'string',  desc: '챔피언 식별자 PK' },
    { name: 'TitleStringID', type: 'number',  desc: '이름 문자열', ref: 'StringTBL_KR.UID' },
    { name: 'ArtFull',       type: 'string',  desc: '풀샷 이미지 에셋 키' },
    { name: 'ArtPortrait',   type: 'string',  desc: '초상화 이미지 에셋 키' },
    { name: 'Prefab',        type: 'string',  desc: '프리팹 에셋 키' },
    { name: 'HP',            type: 'number',  desc: '초기 최대 체력' },
    { name: 'Speed',         type: 'number',  desc: '초기 행동 속도 (낮을수록 먼저)' },
    { name: 'Hand',          type: 'number',  desc: '초기 손패 최대 장수' },
    { name: 'Energy',        type: 'number',  desc: '초기 턴당 최대 에너지' },
    { name: 'LvUpHP',        type: 'number',  desc: '레벨업당 체력 증가량' },
    { name: 'LvUpSpeed',     type: 'number',  desc: '레벨업당 속도 증가량' },
    { name: 'LvUpHand',      type: 'number',  desc: '레벨업당 손패 증가량' },
    { name: 'LvUpEnergy',    type: 'number',  desc: '레벨업당 에너지 증가량' },
    { name: 'Team',          type: 'string',  desc: '소속 팀', ref: 'CardTeamTBL.ID' },
    { name: 'StartDeck',     type: 'string',  desc: '런 시작 덱', ref: 'StartCardDeckTBL.ID' },
    { name: 'RewardCard1',   type: 'string?', desc: '보상 카드 후보 1', ref: 'CardTBL.ID' },
    { name: 'RewardCard2',   type: 'string?', desc: '보상 카드 후보 2', ref: 'CardTBL.ID' },
  ]},
  EnemyTBL: { columns: [
    { name: 'ID',            type: 'string',  desc: '적 식별자 PK' },
    { name: 'TitleStringID', type: 'number',  desc: '이름 문자열', ref: 'StringTBL_KR.UID' },
    { name: 'ArtFull',       type: 'string',  desc: '풀샷 이미지 에셋 키' },
    { name: 'ArtPortrait',   type: 'string',  desc: '초상화 이미지 에셋 키' },
    { name: 'Prefab',        type: 'string',  desc: '프리팹 에셋 키' },
    { name: 'HP',            type: 'number',  desc: '최대 체력' },
    { name: 'Speed',         type: 'number',  desc: '행동 속도' },
    { name: 'Hand',          type: 'number',  desc: '손패 최대 장수' },
    { name: 'Energy',        type: 'number',  desc: '턴당 최대 에너지' },
    { name: 'LvUpMax',       type: 'number',  desc: '최대 레벨업 횟수' },
    { name: 'LvUpHP',        type: 'number',  desc: '레벨업당 체력 증가량' },
    { name: 'LvUpSpeed',     type: 'number',  desc: '레벨업당 속도 증가량' },
    { name: 'LvUpHand',      type: 'number',  desc: '레벨업당 손패 증가량' },
    { name: 'LvUpEnergy',    type: 'number',  desc: '레벨업당 에너지 증가량' },
    { name: 'Behavior',      type: 'string',  desc: '행동 AI 패턴 식별자' },
    { name: 'Trait1',        type: 'string?', desc: '특성 태그', ref: 'CardTraitTBL.ID' },
    { name: 'Ability1',      type: 'string?', desc: '고유 패시브 어빌리티', ref: 'CardAbilityTBL.ID' },
    { name: 'CardDeck',      type: 'string',  desc: '행동 카드 덱', ref: 'StartCardDeckTBL.ID' },
    { name: 'RewardGold',    type: 'number',  desc: '처치 시 획득 골드' },
    { name: 'RewardXP',      type: 'number',  desc: '처치 시 획득 경험치' },
    { name: 'SpawnFx',       type: 'string?', desc: '전투 등장 연출 키' },
  ]},
  StartCardDeckTBL: { columns: [
    { name: 'Type',  type: 'string',   desc: 'Champion|Enemies' },
    { name: 'ID',    type: 'string',   desc: '덱 식별자 PK' },
    { name: 'Slots', type: 'string[]', desc: '카드 ID 배열 (최대 10)', ref: 'CardTBL.ID',
      sources: ['Slot1','Slot2','Slot3','Slot4','Slot5','Slot6','Slot7','Slot8','Slot9','Slot10'] },
  ]},
  MapTBL: { columns: [
    { name: 'ID',              type: 'string',  desc: '맵 식별자 PK' },
    { name: 'TitleStringID',   type: 'number',  desc: '맵 이름 문자열', ref: 'StringTBL_KR.UID' },
    { name: 'MapScene',        type: 'string',  desc: '맵 배경 씬 에셋 키' },
    { name: 'BattleScene',     type: 'string',  desc: '전투 배경 씬 에셋 키' },
    { name: 'Depth',           type: 'number',  desc: '맵 세로 깊이 (층 수)' },
    { name: 'WidthMin',        type: 'number',  desc: '층당 최소 노드 수' },
    { name: 'WidthMax',        type: 'number',  desc: '층당 최대 노드 수' },
    { name: 'ForkProbability', type: 'number',  desc: '경로 분기 확률 (0~1)' },
    { name: 'RandomEventID',   type: 'string',  desc: '랜덤 이벤트 풀', ref: 'MapRandomEventTBL.ID' },
    { name: 'FixedWidthID',    type: 'string?', desc: '고정 너비 정의', ref: 'MapFixedWidthTBL.ID' },
    { name: 'FixedEventID',    type: 'string?', desc: '고정 이벤트 세트', ref: 'MapFixedEventTBL.ID' },
    { name: 'MapTutorial',     type: 'string?', desc: '튜토리얼 설정 키' },
  ]},
  MapRandomEventTBL: { columns: [
    { name: 'ID',         type: 'string', desc: '랜덤 이벤트 풀 식별자 PK' },
    { name: 'SelectType', type: 'string', desc: '이벤트 유형 레이블', ref: 'GlobalEnum.MapEventType' },
    { name: 'Type',       type: 'number', desc: '이벤트 유형 enum 값', ref: 'GlobalEnum.MapEventType' },
    { name: 'EventID',    type: 'string', desc: '이벤트 참조 ID' },
  ]},
  MapFixedEventTBL: { columns: [
    { name: 'ID',       type: 'string', desc: '고정 이벤트 세트 식별자 PK' },
    { name: 'Depth',    type: 'number', desc: '배치 깊이(층)' },
    { name: 'IndexMin', type: 'number', desc: '배치 가능 최소 노드 인덱스' },
    { name: 'IndexMax', type: 'number', desc: '배치 가능 최대 노드 인덱스' },
    { name: 'EventID',  type: 'string', desc: '배치할 이벤트 ID' },
  ]},
  MapEvent_BattleTBL: { columns: [
    { name: 'ID',            type: 'string',   desc: '전투 이벤트 식별자 PK' },
    { name: 'DepthMin',      type: 'number',   desc: '등장 가능 최소 깊이' },
    { name: 'DepthMax',      type: 'number',   desc: '등장 가능 최대 깊이' },
    { name: 'Icon',          type: 'string',   desc: '맵 노드 아이콘 에셋 키' },
    { name: 'EnemyLevel',    type: 'number',   desc: '적 레벨 오프셋' },
    { name: 'Enemy1', type: 'string?', nullable: true, desc: '등장 적 1', ref: 'EnemyTBL.ID' },
    { name: 'Enemy2', type: 'string?', nullable: true, desc: '등장 적 2', ref: 'EnemyTBL.ID' },
    { name: 'Enemy3', type: 'string?', nullable: true, desc: '등장 적 3', ref: 'EnemyTBL.ID' },
    { name: 'Enemy4', type: 'string?', nullable: true, desc: '등장 적 4', ref: 'EnemyTBL.ID' },
    { name: 'ExtraEnemy',    type: 'string?',  desc: '조건부 추가 적', ref: 'ExtraEnemyTBL.ID' },
    { name: 'RewardGold',    type: 'number',   desc: '클리어 보상 골드' },
    { name: 'RewardXP',      type: 'number',   desc: '클리어 보상 경험치' },
    { name: 'IsRewardCards', type: 'boolean',  desc: '카드 보상 제공 여부' },
    { name: 'CardRarity',    type: 'string?',  desc: '카드 보상 희귀도 필터', ref: 'CardRarityTBL.ID' },
    { name: 'IsRewardItem',  type: 'boolean',  desc: '아이템 보상 제공 여부' },
    { name: 'ItemRarity',    type: 'string?',  desc: '아이템 보상 희귀도 필터', ref: 'CardRarityTBL.ID' },
    { name: 'ItemTeam',      type: 'string?',  desc: '아이템 보상 팀 필터', ref: 'CardTeamTBL.ID' },
    { name: 'Tutorial',      type: 'string?',  desc: '튜토리얼 설정 키' },
    { name: 'WinEvent',      type: 'string?',  desc: '승리 시 연계 이벤트 ID' },
  ]},
  ExtraEnemyTBL: { columns: [
    { name: 'ID',    type: 'string', desc: '추가 적 세트 식별자 PK' },
    { name: 'Cond1', type: 'object', desc: '조건 1: { ChampionMin: number, Enemies: string[] }' },
    { name: 'Cond2', type: 'object', desc: '조건 2: { ChampionMin: number, Enemies: string[] }' },
  ]},
  MapEvent_ChoiceTBL: { columns: [
    { name: 'ID',           type: 'string',   desc: '선택지 이벤트 식별자 PK' },
    { name: 'DepthMin',     type: 'number',   desc: '등장 가능 최소 깊이' },
    { name: 'DepthMax',     type: 'number',   desc: '등장 가능 최대 깊이' },
    { name: 'Icon',         type: 'string',   desc: '맵 노드 아이콘 에셋 키' },
    { name: 'DescStringID', type: 'number',   desc: '이벤트 설명 문자열', ref: 'StringTBL_KR.UID' },
    { name: 'Choices',      type: 'object[]', desc: '선택지 배열: { TitleStringID, DescStringID, EffectID }' },
  ]},
  MapEvent_TradeTBL: { columns: [
    { name: 'ID',                type: 'string',   desc: '교역 이벤트 식별자 PK' },
    { name: 'Icon',              type: 'string',   desc: '맵 노드 아이콘 에셋 키' },
    { name: 'SelectEventTarget', type: 'string',   desc: '대상 레이블' },
    { name: 'EventTarget',       type: 'number',   desc: '대상 enum 값', ref: 'GlobalEnum.CardAvailability' },
    { name: 'SpendItem',         type: 'string?',  desc: '소비 아이템 ID' },
    { name: 'SpendGold',         type: 'number',   desc: '소비 골드' },
    { name: 'SpendHP',           type: 'number',   desc: '소비 체력' },
    { name: 'GainItems',         type: 'string[]', desc: '획득 아이템 ID 배열 (최대 3)',
      sources: ['GainItem1','GainItem2','GainItem3'] },
    { name: 'GainAlly',          type: 'string?',  desc: '획득 아군 ID' },
    { name: 'GainGold',          type: 'number',   desc: '획득 골드' },
    { name: 'GainXP',            type: 'number',   desc: '획득 경험치' },
    { name: 'GainHeal',          type: 'number',   desc: '회복량' },
    { name: 'DescStringID',      type: 'number',   desc: '이벤트 설명 문자열', ref: 'StringTBL_KR.UID' },
  ]},
  MapEvent_EffectTBL: { columns: [
    { name: 'ID',                type: 'string',  desc: '효과 이벤트 식별자 PK' },
    { name: 'Icon',              type: 'string',  desc: '맵 노드 아이콘 에셋 키' },
    { name: 'Condition1',        type: 'string?', desc: '발동 조건' },
    { name: 'SelectEventTarget', type: 'string',  desc: '대상 레이블' },
    { name: 'EventTarget',       type: 'number',  desc: '대상 enum 값' },
    { name: 'Effect1',           type: 'string',  desc: '주 효과' },
    { name: 'Effect2',           type: 'string?', desc: '보조 효과' },
    { name: 'Value',             type: 'number',  desc: '효과 수치' },
    { name: 'ChainEventID',      type: 'string?', desc: '연쇄 발동 이벤트 ID' },
    { name: 'DescStringID',      type: 'number',  desc: '결과 설명 문자열', ref: 'StringTBL_KR.UID' },
  ]},
  MapEvent_OtherTBL: { columns: [
    { name: 'ID',          type: 'string',  desc: '특수 이벤트 식별자 PK' },
    { name: 'SelectType',  type: 'string',  desc: '이벤트 유형 레이블', ref: 'GlobalEnum.MapEventType' },
    { name: 'EventType',   type: 'number',  desc: '이벤트 유형 enum 값', ref: 'GlobalEnum.MapEventType' },
    { name: 'Icon',        type: 'string',  desc: '맵 노드 아이콘 에셋 키' },
    { name: 'Rarity',      type: 'string',  desc: '희귀도' },
    { name: 'WorldState',  type: 'number?', desc: '출현 조건 플래그', ref: 'GlobalEnum.WorldState' },
    { name: 'FreeUpgrade', type: 'string?', desc: '무료 강화 이벤트 설정 키' },
  ]},
  MapEvent_ShopTBL: { columns: [
    { name: 'ID',            type: 'string',   desc: '상점 이벤트 식별자 PK' },
    { name: 'DepthMin',      type: 'number',   desc: '등장 가능 최소 깊이' },
    { name: 'DepthMax',      type: 'number',   desc: '등장 가능 최대 깊이' },
    { name: 'Icon',          type: 'string',   desc: '맵 노드 아이콘 에셋 키' },
    { name: 'BuyMult',       type: 'number',   desc: '구매 가격 배율' },
    { name: 'SellyMult',     type: 'number',   desc: '판매 가격 배율' },
    { name: 'FixedItems',    type: 'string[]', desc: '고정 진열 아이템 ID 배열 (최대 3)',
      sources: ['Item1','Item2','Item3'] },
    { name: 'CardsRand',     type: 'number',   desc: '랜덤 진열 카드 수' },
    { name: 'ItemsRand',     type: 'number',   desc: '랜덤 진열 아이템 수' },
    { name: 'ItemRandSlots', type: 'string[]', desc: '랜덤 아이템 슬롯 설정 배열 (최대 4)',
      sources: ['ItemRandSlot1','ItemRandSlot2','ItemRandSlot3','ItemRandSlot4'] },
  ]},
  GlobalEnum: { columns: [
    { name: 'Group', type: 'string', desc: 'enum 그룹명 (AbilityTrigger, StatusEffect 등)' },
    { name: 'ID',    type: 'string', desc: 'enum 식별자' },
    { name: 'Enum',  type: 'number', desc: 'enum 숫자 값' },
    { name: 'Desc',  type: 'string', desc: 'enum 설명' },
  ]},
};

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Google Sheets 연결 중...');
  const sheets = await getSheets();

  console.log('시트 읽는 중...');
  const [
    strRows, traitRows, teamRows, rarityRows, intentRows,
    abilRows, cardEffectRows, statusRows, cardRows,
    champRows, behaviorRows, conditionRows, enemyRows, deckRows,
    mapRows, randEvtRows, fixedEvtRows,
    battleRows, choiceRows, tradeRows, effectRows, otherRows, shopRows,
    extraRows, enumRows,
  ] = await Promise.all([
    readSheet(sheets, 'StringTBL_KR'),
    readSheet(sheets, 'CardTraitTBL'),
    readSheet(sheets, 'CardTeamTBL'),
    readSheet(sheets, 'CardRarityTBL'),
    readSheet(sheets, 'CardIntentTBL'),
    readSheet(sheets, 'CardAbilityTBL'),
    readSheet(sheets, 'CardEffectTBL'),
    readSheet(sheets, 'CardStatusTBL'),
    readSheet(sheets, 'CardTBL'),
    readSheet(sheets, 'ChampionTBL'),
    readSheet(sheets, 'BehaviorTBL'),
    readSheet(sheets, 'ConditionTBL'),
    readSheet(sheets, 'EnemyTBL'),
    readSheet(sheets, 'StartCardDeckTBL'),
    readSheet(sheets, 'MapTBL'),
    readSheet(sheets, 'MapRandomEventTBL'),
    readSheet(sheets, 'MapFixedEventTBL'),
    readSheet(sheets, 'MapEvent_BattleTBL'),
    readSheet(sheets, 'MapEvent_ChoiceTBL'),
    readSheet(sheets, 'MapEvent_TradeTBL'),
    readSheet(sheets, 'MapEvent_EffectTBL'),
    readSheet(sheets, 'MapEvent_OtherTBL'),
    readSheet(sheets, 'MapEvent_ShopTBL'),
    readSheet(sheets, 'ExtraEnemyTBL'),
    readSheet(sheets, 'GlobalEnum'),
  ]);

  console.log('JSON 변환 중...');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const write = (name: string, data: unknown) =>
    fs.writeFileSync(path.join(OUTPUT_DIR, name), JSON.stringify(
      name === 'schema.json' ? data : { rows: data },
      null, 2
    ));

  const out = [
    ['StringTBL_KR.json',          buildGeneric(strRows,      'StringTBL_KR')],
    ['CardTraitTBL.json',          buildGeneric(traitRows,    'CardTraitTBL')],
    ['CardTeamTBL.json',           buildGeneric(teamRows,     'CardTeamTBL')],
    ['CardRarityTBL.json',         buildGeneric(rarityRows,   'CardRarityTBL')],
    ['CardIntentTBL.json',         buildGeneric(intentRows,   'CardIntentTBL')],
    ['CardAbilityTBL.json',        buildGeneric(abilRows,         'CardAbilityTBL')],
    ['CardEffectTBL.json',         buildGeneric(cardEffectRows,   'CardEffectTBL')],
    ['CardStatusTBL.json',         buildGeneric(statusRows,       'CardStatusTBL')],
    ['CardTBL.json',               buildGeneric(cardRows,     'CardTBL')],
    ['ChampionTBL.json',           buildGeneric(champRows,      'ChampionTBL')],
    ['BehaviorTBL.json',           buildGeneric(behaviorRows,   'BehaviorTBL')],
    ['ConditionTBL.json',          buildGeneric(conditionRows,  'ConditionTBL')],
    ['EnemyTBL.json',              buildGeneric(enemyRows,    'EnemyTBL')],
    ['StartCardDeckTBL.json',      buildGeneric(deckRows,     'StartCardDeckTBL')],
    ['MapTBL.json',                buildGeneric(mapRows,      'MapTBL')],
    ['MapRandomEventTBL.json',     buildGeneric(randEvtRows,  'MapRandomEventTBL')],
    ['MapFixedEventTBL.json',      buildGeneric(fixedEvtRows, 'MapFixedEventTBL')],
    ['MapEvent_BattleTBL.json',    buildGeneric(battleRows,   'MapEvent_BattleTBL')],
    ['MapEvent_ChoiceTBL.json',    buildChoiceEvents(choiceRows)],
    ['MapEvent_TradeTBL.json',     buildGeneric(tradeRows,    'MapEvent_TradeTBL')],
    ['MapEvent_EffectTBL.json',    buildGeneric(effectRows,   'MapEvent_EffectTBL')],
    ['MapEvent_OtherTBL.json',     buildGeneric(otherRows,    'MapEvent_OtherTBL')],
    ['MapEvent_ShopTBL.json',      buildGeneric(shopRows,     'MapEvent_ShopTBL')],
    ['ExtraEnemyTBL.json',         buildExtraEnemies(extraRows)],
    ['GlobalEnum.json',            buildGlobalEnum(enumRows)],
    ['schema.json',                SCHEMA],
  ] as [string, unknown][];

  for (const [name, data] of out) {
    write(name, data);
    const len = Array.isArray(data) ? `${(data as unknown[]).length}개` : '';
    console.log(`  ✓ ${name.padEnd(28)} ${len}`);
  }
}

main().catch(console.error);
