// ─── 기본 타입 (GlobalEnum 기반) ──────────────────────────────────────────────

// 2048 타일 등급 (A=2, B=4, C=8, D=16, E=32, F=64)
export type TileRank = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

// 카드 종류 (GlobalEnum.CardType)
export type CardType = 'Skill' | 'Power';

// 어빌리티 종류 (CardAbilityTBL.Type)
export type AbilityType = 'Attacks' | 'Heals' | 'Buffs' | 'Debuffs' | 'Passives' | 'Enemy';

// 덱 종류 (StartCardDeckTBL.Type)
export type DeckType = 'Champion' | 'Allies';

// ─── StringTBL_KR ─────────────────────────────────────────────────────────────
// 컬럼: UID | KR
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
  UID: number;
  KR: string;
}

// ─── CardTraitTBL ─────────────────────────────────────────────────────────────
// 컬럼: ID | TitleStringID | DescStringID | Icon

export interface CardTrait {
  ID: string;
  TitleStringID: number;
  DescStringID: number;
  Icon: string;
}

// ─── CardTeamTBL ──────────────────────────────────────────────────────────────
// 컬럼: ID | TitleStringID | Icon | Color

export interface CardTeam {
  ID: string;
  TitleStringID: number;
  Icon: string;
  Color: string;
}

// ─── CardRarityTBL ────────────────────────────────────────────────────────────
// 컬럼: ID | TitleStringID | Icon | Probability

export interface CardRarity {
  ID: string;
  TitleStringID: number;
  Icon: string;
  Probability: number;
}

// ─── CardIntentTBL ────────────────────────────────────────────────────────────
// 컬럼: ID | IsShow | Priority | TitleStringID | DescStringID | Icon

export interface CardIntent {
  ID: string;
  IsShow: boolean;
  Priority: number;
  TitleStringID: number;
  DescStringID: number;
  Icon: string;
}

// ─── CardAbilityTBL ───────────────────────────────────────────────────────────
// 컬럼: Type | ID | SelectTrigger | Trigger | TrigCond1~3
//        | SelectTarget | Target | TgtCond1~3
//        | Effect1 | Effect2 | Status1 | Status2
//        | EffectValue | UpgradeValue | SelectUpBonus | UpgradeBonus
//        | ChainAbility | TargetFx
// Trigger 숫자값 → GlobalEnum.AbilityTrigger
// Target 숫자값  → GlobalEnum.AbilityTarget

export interface Ability {
  Type: AbilityType;
  ID: string;
  SelectTrigger: string;
  Trigger: number;
  TrigCond1?: string;
  TrigCond2?: string;
  TrigCond3?: string;
  SelectTarget: string;
  Target: number;
  TgtCond1?: string;
  TgtCond2?: string;
  TgtCond3?: string;
  Effect1?: string;
  Effect2?: string;
  Status1?: string;
  Status2?: string;
  EffectValue?: number;
  UpgradeValue?: number;
  SelectUpBonus?: string;
  UpgradeBonus?: number;
  ChainAbility?: string;
  TargetFx?: string;
}

// ─── CardStatusTBL ────────────────────────────────────────────────────────────
// 컬럼: ID | SelectEffect | StatusEffect | SelectDuration | StatusDuration
//        | IsNegative | TitleStringID | DescStringID | Icon | Fx | Animation
// StatusEffect  숫자값 → GlobalEnum.StatusEffect
// StatusDuration 숫자값 → GlobalEnum.StatusDuration

export interface StatusEffect {
  ID: string;
  SelectEffect: string;
  StatusEffect: number;
  SelectDuration: string;
  StatusDuration: number;
  IsNegative: boolean;
  TitleStringID: number;
  DescStringID: number;
  Icon: string;
  Fx: string;
  Animation: string;
}

// ─── CardTBL ──────────────────────────────────────────────────────────────────
// 컬럼: ID | TitleStringID | DescStringID | CardType | Team | Rarity | Mana
//        | Trait1 | Trait2 | Ability1~4
//        | UpgradeMax | UpgradeMana | ShopCost | Intent
//        | TileRank | UpgradedTileRank  ← 2048 전용 (미정)

export interface Card {
  ID: string;
  TitleStringID: number;
  DescStringID: number;
  CardType: string;           // ref GlobalEnum.CardType
  Team: string;               // ref CardTeamTBL
  Rarity: string;             // ref CardRarityTBL
  Mana: number;
  Trait1?: string;            // ref CardTraitTBL
  Trait2?: string;
  Ability1?: string;          // ref CardAbilityTBL
  Ability2?: string;
  Ability3?: string;
  Ability4?: string;
  UpgradeMax: number;
  UpgradeMana: number;
  ShopCost: number;
  Intent?: string;            // ref CardIntentTBL
  TileRank?: TileRank;        // 2048 전용
  UpgradedTileRank?: TileRank;
}

// ─── ChampionTBL ──────────────────────────────────────────────────────────────
// 컬럼: ID | TitleStringID | HP | Speed | Hand | Energy
//        | LvUpHP | LvUpSpeed | LvUpHand | LvUpEnergy
//        | Team | StartDeck | RewardCard1 | RewardCard2

export interface Champion {
  ID: string;
  TitleStringID: number;
  HP: number;
  Speed: number;
  Hand: number;
  Energy: number;
  LvUpHP: number;
  LvUpSpeed: number;
  LvUpHand: number;
  LvUpEnergy: number;
  Team: string;               // ref CardTeamTBL
  StartDeck: string;          // ref StartCardDeckTBL
  RewardCard1: string;
  RewardCard2: string;
}

// ─── EnemyTBL ─────────────────────────────────────────────────────────────────
// 컬럼: ID | TitleStringID | HP | Speed | Hand | Energy
//        | LvUpMax | LvUpHP | LvUpSpeed | LvUpHand | LvUpEnergy
//        | Behavior | Trait1 | Ability1 | CardDeck | RewardGold | RewardXP | SpawnFx

export interface Enemy {
  ID: string;
  TitleStringID: number;
  HP: number;
  Speed: number;
  Hand: number;
  Energy: number;
  LvUpMax: number;
  LvUpHP: number;
  LvUpSpeed: number;
  LvUpHand: number;
  LvUpEnergy: number;
  Behavior: string;
  Trait1?: string;            // ref CardTraitTBL
  Ability1?: string;          // ref CardAbilityTBL (패시브)
  CardDeck: string;           // ref StartCardDeckTBL
  RewardGold: number;
  RewardXP: number;
  SpawnFx?: string;
}

// ─── StartCardDeckTBL ─────────────────────────────────────────────────────────
// 컬럼: Type | ID | Slot1~Slot10

export interface CardDeck {
  Type: DeckType;
  ID: string;
  Slots: string[];            // ref CardTBL, 최대 10개
}

// ─── MapTBL ───────────────────────────────────────────────────────────────────
// 컬럼: ID | TitleStringID | Depth | WidthMin | WidthMax | ForkProbability
//        | RandomEventID | FixedEventID

export interface GameMap {
  ID: string;
  TitleStringID: number;
  Depth: number;
  WidthMin: number;
  WidthMax: number;
  ForkProbability: number;
  RandomEventID: string;      // ref MapRandomEventTBL
  FixedEventID: string;       // ref MapFixedEventTBL
}

// ─── MapRandomEventTBL ────────────────────────────────────────────────────────
// 컬럼: ID | SelectType | Type | EventID

export interface MapRandomEvent {
  ID: string;
  SelectType: string;
  Type: number;               // GlobalEnum.MapEventType
  EventID: string;            // ref MapEvent_*TBL
}

// ─── MapFixedEventTBL ─────────────────────────────────────────────────────────
// 컬럼: ID | Depth | IndexMin | IndexMax | EventID

export interface MapFixedEvent {
  ID: string;
  Depth: number;
  IndexMin: number;
  IndexMax: number;
  EventID: string;
}

// ─── MapEvent_BattleTBL ───────────────────────────────────────────────────────

export interface BattleEvent {
  ID: string;
  DepthMin: number;
  DepthMax: number;
  EnemyLevel: number;
  Enemies: string[];          // ref EnemyTBL, 최대 4개
  RewardGold: number;
  RewardXP: number;
  IsRewardCards: boolean;
  CardRarity?: string;        // ref CardRarityTBL
  WinEvent?: string;
}

// ─── MapEvent_ChoiceTBL ───────────────────────────────────────────────────────

export interface ChoiceOption {
  TitleStringID: number;
  DescStringID: number;
  EffectID: string;           // ref MapEvent_TradeTBL / MapEvent_EffectTBL
}

export interface ChoiceEvent {
  ID: string;
  DepthMin: number;
  DepthMax: number;
  DescStringID: number;
  Choices: ChoiceOption[];
}

// ─── MapEvent_TradeTBL ────────────────────────────────────────────────────────

export interface TradeEvent {
  ID: string;
  SelectEventTarget: string;
  EventTarget: number;        // GlobalEnum.CardAvailability
  SpendGold: number;
  SpendHP: number;
  GainGold: number;
  GainXP: number;
  GainHeal: number;
  DescStringID: number;
}

// ─── MapEvent_EffectTBL ───────────────────────────────────────────────────────

export interface EffectEvent {
  ID: string;
  SelectEventTarget: string;
  EventTarget: number;
  Effect1: string;            // GlobalEnum.Effects
  Effect2?: string;
  Value: number;
  ChainEventID?: string;
  DescStringID: number;
}

// ─── MapEvent_OtherTBL ────────────────────────────────────────────────────────

export interface OtherEvent {
  ID: string;
  SelectType: string;
  EventType: number;          // GlobalEnum.MapEventType
  Icon: string;
  Rarity?: string;
  WorldState?: string;
}

// ─── MapEvent_ShopTBL ─────────────────────────────────────────────────────────

export interface ShopEvent {
  ID: string;
  DepthMin: number;
  DepthMax: number;
  BuyMult: number;
  SellyMult: number;
  CardsRand: number;
  ItemsRand: number;
}

// ─── ExtraEnemyTBL ────────────────────────────────────────────────────────────

export interface ExtraEnemy {
  ID: string;
  ChampionMin: string;
  Enemies: string[];          // ref EnemyTBL, 최대 4개
}

// ─── GlobalEnum ───────────────────────────────────────────────────────────────
// 컬럼: Group | ID | Enum | Desc

export interface GlobalEnumEntry {
  Group: string;
  ID: string;
  Enum: number;
  Desc: string;
}
