// ─── 기본 타입 (GlobalEnum 기반) ──────────────────────────────────────────────

// 2048 타일 등급 (A=2, B=4, C=8, D=16, E=32, F=64)
export type TileRank = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

// 카드 종류 (GlobalEnum.CardType)
export type CardType = 'Skill' | 'Power';

// 어빌리티 종류 (CardAbilityTBL.Type)
export type AbilityType = 'Attacks' | 'Heals' | 'Buffs' | 'Debuffs' | 'Passives' | 'Enemy';

// 덱 종류 (DeckTBL.Type)
export type DeckType = 'Champion' | 'Allies';

// ─── StringTBL_KR ─────────────────────────────────────────────────────────────
// 컬럼: Name | UID | KR
// UID 범위:
//   10000~19999  상태이상/특성/팀/희귀도/의도 이름·설명 (이름=짝수, 설명=홀수)
//   20000~29999  CardTrait 이름
//   30000~39999  CardTeam 이름
//   40000~49999  CardRarity 이름
//   50000~59999  CardIntent 이름·설명
//   200000~259999 카드 이름(짝수)·설명(홀수)
//   260000~269999 챔피언 이름(짝수)·설명(홀수)
//   261000~269999 적 이름(짝수)·설명(홀수)
//   270000~279999 이벤트 문자열

export interface StringEntry {
  uid: number;
  kr: string;
}

// ─── CardTraitTBL ─────────────────────────────────────────────────────────────
// 컬럼: Name | ID | titleStringId | descStringId | icon

export interface CardTrait {
  id: string;
  titleStringId: number;
  descStringId: number;
  icon: string;
}

// ─── CardTeamTBL ──────────────────────────────────────────────────────────────
// 컬럼: Name | ID | titleStringId | icon | color

export interface CardTeam {
  id: string;
  titleStringId: number;
  icon: string;
  color: string;
}

// ─── CardRarityTBL ────────────────────────────────────────────────────────────
// 컬럼: Name | ID | titleStringId | icon | probability

export interface CardRarity {
  id: string;
  titleStringId: number;
  icon: string;
  probability: number;
}

// ─── CardIntentTBL ────────────────────────────────────────────────────────────
// 컬럼: Name | ID | isShow | priority | titleStringId | descStringId | icon

export interface CardIntent {
  id: string;
  isShow: boolean;
  priority: number;
  titleStringId: number;
  descStringId: number;
  icon: string;
}

// ─── CardAbilityTBL ───────────────────────────────────────────────────────────
// 컬럼: Name | Type | ID | selectTrigger | trigger | trigCond1~3
//        | selectTarget | target | tgtCond1~3
//        | effect1 | effect2 | status1 | status2
//        | effectValue | upgradeValue | selectUpBonus | upgradeBonus
//        | chainAbility | targetFx
// trigger 숫자값 → GlobalEnum.AbilityTrigger
// target 숫자값  → GlobalEnum.AbilityTarget

export interface Ability {
  type: AbilityType;
  id: string;
  selectTrigger: string;
  trigger: number;
  trigCond1?: string;
  trigCond2?: string;
  trigCond3?: string;
  selectTarget: string;
  target: number;
  tgtCond1?: string;
  tgtCond2?: string;
  tgtCond3?: string;
  effect1?: string;
  effect2?: string;
  status1?: string;
  status2?: string;
  effectValue?: number;
  upgradeValue?: number;
  selectUpBonus?: string;
  upgradeBonus?: number;
  chainAbility?: string;
  targetFx?: string;
}

// ─── CardStatusTBL ────────────────────────────────────────────────────────────
// 컬럼: Name | ID | selectEffect | statusEffect | selectDuration | statusDuration
//        | isNegative | titleStringId | descStringId | icon | fx | animation
// statusEffect  숫자값 → GlobalEnum.StatusEffect
// statusDuration 숫자값 → GlobalEnum.StatusDuration

export interface StatusEffect {
  id: string;
  selectEffect: string;
  statusEffect: number;
  selectDuration: string;
  statusDuration: number;
  isNegative: boolean;
  titleStringId: number;
  descStringId: number;
  icon: string;
  fx: string;
  animation: string;
}

// ─── CardTBL ──────────────────────────────────────────────────────────────────
// 컬럼: Name | ID | titleStringId | descStringId | cardType | team | rarity | mana
//        | trait1 | trait2 | ability1 | ability2 | ability3 | ability4
//        | upgradeMax | upgradeMana | shopCost | intent
//        | tileRank | upgradedTileRank  ← 2048 전용

export interface Card {
  id: string;
  titleStringId: number;
  descStringId: number;
  cardType: CardType;
  team: string;              // ref CardTeamTBL
  rarity: string;            // ref CardRarityTBL
  mana: number;
  trait1?: string;           // ref CardTraitTBL
  trait2?: string;
  ability1?: string;         // ref CardAbilityTBL
  ability2?: string;
  ability3?: string;
  ability4?: string;
  upgradeMax: number;
  upgradeMana: number;
  shopCost: number;
  intent?: string;           // ref CardIntentTBL
  tileRank: TileRank;
  upgradedTileRank?: TileRank;
}

// ─── ChampionTBL ──────────────────────────────────────────────────────────────
// 컬럼: Name | ID | titleStringId | hp | speed | hand | energy
//        | lvUpHp | lvUpSpeed | lvUpHand | lvUpEnergy
//        | team | startDeck | rewardCard1 | rewardCard2

export interface Champion {
  id: string;
  titleStringId: number;
  hp: number;
  speed: number;
  hand: number;
  energy: number;
  lvUpHp: number;
  lvUpSpeed: number;
  lvUpHand: number;
  lvUpEnergy: number;
  team: string;              // ref CardTeamTBL
  startDeck: string;         // ref DeckTBL
  rewardCard1: string;       // ref CardTeamTBL (보상 카드 팀)
  rewardCard2: string;
}

// ─── EnemyTBL ─────────────────────────────────────────────────────────────────
// 컬럼: Name | ID | titleStringId | hp | speed | hand | energy
//        | lvUpMax | lvUpHp | lvUpSpeed | lvUpHand | lvUpEnergy
//        | behavior | trait1 | ability1 | cardDeck | rewardGold | rewardXP | spawnFx

export interface Enemy {
  id: string;
  titleStringId: number;
  hp: number;
  speed: number;
  hand: number;
  energy: number;
  lvUpMax: number;
  lvUpHp: number;
  lvUpSpeed: number;
  lvUpHand: number;
  lvUpEnergy: number;
  behavior: string;
  trait1?: string;           // ref CardTraitTBL
  ability1?: string;         // ref CardAbilityTBL (패시브)
  cardDeck: string;          // ref DeckTBL
  rewardGold: number;
  rewardXP: number;
  spawnFx?: string;
}

// ─── DeckTBL ──────────────────────────────────────────────────────────────────
// 컬럼: Name | Type | ID | slot1~slot10

export interface CardDeck {
  type: DeckType;
  id: string;
  slots: string[];           // ref CardTBL, 최대 10개
}

// ─── MapTBL ───────────────────────────────────────────────────────────────────
// 컬럼: Name | ID | titleStringId | depth | widthMin | widthMax | forkProbability
//        | randomEventId | fixedEventId

export interface GameMap {
  id: string;
  titleStringId: number;
  depth: number;
  widthMin: number;
  widthMax: number;
  forkProbability: number;
  randomEventId: string;     // ref MapRandomEventTBL (풀 ID)
  fixedEventId: string;      // ref MapFixedEventTBL (풀 ID)
}

// ─── MapRandomEventTBL ────────────────────────────────────────────────────────
// 컬럼: Name | ID | selectType | type | eventId

export interface MapRandomEvent {
  id: string;
  selectType: string;        // MapEventType 설명
  type: number;              // GlobalEnum.MapEventType
  eventId: string;           // ref MapEvent_*TBL
}

// ─── MapFixedEventTBL ─────────────────────────────────────────────────────────
// 컬럼: Name | ID | depth | indexMin | indexMax | eventId

export interface MapFixedEvent {
  id: string;
  depth: number;
  indexMin: number;
  indexMax: number;
  eventId: string;
}

// ─── MapEvent_BattleTBL ───────────────────────────────────────────────────────

export interface BattleEvent {
  id: string;
  depthMin: number;
  depthMax: number;
  enemyLevel: number;
  enemies: string[];         // ref EnemyTBL, 최대 4개
  rewardGold: number;
  rewardXP: number;
  isRewardCards: boolean;
  cardRarity?: string;       // ref CardRarityTBL
  winEvent?: string;
}

// ─── MapEvent_ChoiceTBL ───────────────────────────────────────────────────────

export interface ChoiceOption {
  titleStringId: number;
  descStringId: number;
  effectId: string;          // ref MapEvent_TradeTBL / MapEvent_EffectTBL
}

export interface ChoiceEvent {
  id: string;
  depthMin: number;
  depthMax: number;
  descStringId: number;
  choices: ChoiceOption[];
}

// ─── MapEvent_TradeTBL ────────────────────────────────────────────────────────

export interface TradeEvent {
  id: string;
  selectEventTarget: string;
  eventTarget: number;       // GlobalEnum.CardAvailability (ChampionAll=15 등)
  spendGold: number;
  spendHp: number;
  gainGold: number;
  gainXp: number;
  gainHeal: number;
  descStringId: number;
}

// ─── MapEvent_EffectTBL ───────────────────────────────────────────────────────

export interface EffectEvent {
  id: string;
  selectEventTarget: string;
  eventTarget: number;
  effect1: string;           // GlobalEnum.Effects
  effect2?: string;
  value: number;
  chainEventId?: string;
  descStringId: number;
}

// ─── MapEvent_OtherTBL ────────────────────────────────────────────────────────

export interface OtherEvent {
  id: string;
  selectType: string;
  eventType: number;         // GlobalEnum.MapEventType
  icon: string;
  rarity?: string;
  worldState?: string;
}

// ─── MapEvent_ShopTBL ─────────────────────────────────────────────────────────

export interface ShopEvent {
  id: string;
  depthMin: number;
  depthMax: number;
  buyMult: number;
  sellyMult: number;
  cardsRand: number;
  itemsRand: number;
}

// ─── ExtraEnemyTBL ────────────────────────────────────────────────────────────

export interface ExtraEnemy {
  id: string;
  championMin: string;
  enemies: string[];         // ref EnemyTBL, 최대 4개
}

// ─── GlobalEnum ───────────────────────────────────────────────────────────────
// 컬럼: group | id | enum | desc

export interface GlobalEnumEntry {
  group: string;
  id: string;
  enum: number;
  desc: string;
}
