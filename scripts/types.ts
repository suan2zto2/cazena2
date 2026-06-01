// ─── 열거형 ───────────────────────────────────────────────────────────────────

export type TileRank = 'BASIC' | 'NORMAL' | 'ENHANCED' | 'POWERFUL' | 'LETHAL' | 'TRANSCENDENT';
export type StageType = 'NORMAL' | 'ELITE' | 'BOSS' | 'SUPPLY' | 'UNKNOWN';
export type EnemyType = 'NORMAL' | 'ELITE' | 'BOSS';
export type CardEffectType = 'ATTACK' | 'HEAL' | 'BUFF' | 'DEBUFF';
export type TargetType = 'SINGLE_ENEMY' | 'ALL_ENEMIES' | 'SINGLE_ALLY' | 'ALL_ALLIES';
export type ActionType = 'ATTACK_SINGLE' | 'ATTACK_AOE' | 'DEBUFF' | 'BUFF_SELF';
export type TargetMode = 'SINGLE' | 'ALL';
export type StoryType = 'MAIN' | 'SUB';
export type SceneTriggerType = 'CHAPTER_START' | 'BOSS_START' | 'BOSS_CLEAR' | 'STAGE_START';

// ─── ID 체계 ──────────────────────────────────────────────────────────────────
//
//  Chapter    1 ~ 99       순번 (1 = ch1, 8 = ch8)
//  Character  1001 ~ 1099  1 + 순번3자리
//  Monster    2101 ~ 2399  2 + 타입(1:NORMAL/2:ELITE/3:BOSS) + 순번2자리
//  Card       3101 ~ 3999  3 + 캐릭터순번(1자리) + 카드순번(2자리)
//  StoryScene 4101 ~ 4999  4 + 챕터(1자리) + 씬순번(2자리)
//  Stage      10101~80305  챕터(1자리) + 막(1자리) + 스테이지순번(2자리)

// ─── 기획 테이블 ──────────────────────────────────────────────────────────────

export interface Chapter {
  id: number;
  title: string;
  storyType: StoryType;
  actCount: number;
}

export interface ActConfig {
  chapterId: number;
  actNumber: number;
  stageCount: number;
  supplyPositions: number[];
  bossMonsterId: number;
}

export interface Stage {
  id: number;
  chapterId: number;
  actNumber: number;
  stageType: StageType;
  maxSlides: number;
  tileSpawnConfig: { values: number[]; weights: number[] };
  monsters: { monsterId: number; position: number }[];
}

export interface StoryScene {
  id: number;
  chapterId: number;
  triggerType: SceneTriggerType;
  sceneAssetId: string;
  monsterId?: number;
  stageId?: number;
}

export interface Character {
  id: number;
  name: string;
  baseHp: number;
  isDlc: boolean;
}

export interface EffectParams {
  targetType: TargetType;
  damage?: number;
  healAmount?: number;
  buffId?: string;
  debuffId?: string;
  duration?: number;
}

export interface Card {
  id: number;
  ownerCharacterId: number;
  name: string;
  tileRank: TileRank;
  effectType: CardEffectType;
  effectParams: EffectParams;
  upgradedTileRank?: TileRank;
}

export interface EnemyAction {
  actionType: ActionType;
  targetMode: TargetMode;
  power: number;
  effectId?: string;
  effectDuration?: number;
  resetCount: number;
  scheduledTurns?: number[];
}

export interface ActionPattern {
  initialCount: number;
  actions: EnemyAction[];
  defaultAction: EnemyAction;
}

export interface PhaseThreshold {
  phaseNumber: number;
  triggerValue: number;
  actionPattern: ActionPattern;
  transitionAction?: EnemyAction;
}

export interface Monster {
  id: number;
  displayName: string;
  enemyType: EnemyType;
  maxHp: number;
  initialShield: number;
  actionPattern: ActionPattern;
  phaseThresholds?: PhaseThreshold[];
}
