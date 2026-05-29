# 열거형 정의

<small style="color:#7070a0;font-family:'Roboto Mono',monospace;background:rgba(255,255,255,0.05);padding:2px 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.08);">📄 docs/enums.md</small>

게임 전반에서 공용으로 사용하는 열거형(enum) 타입 목록입니다.

| 열거형 | 사용처 |
|--------|--------|
| [`TileRank`](#tilerank) | `Card.tileRank`, `Card.upgradedTileRank` |
| [`StageType`](#stagetype) | `Stage.stageType` |
| [`EnemyType`](#enemytype) | `Monster.enemyType` |
| [`CardEffectType`](#cardeffecttype) | `Card.effectType` |
| [`TargetType`](#targettype) | `EffectParams.targetType` |
| [`ActionType`](#actiontype) | `EnemyAction.actionType` |
| [`TargetMode`](#targetmode) | `EnemyAction.targetMode` |
| [`SceneTriggerType`](#scenetriggertype) | `StoryScene.triggerType` |

---

## TileRank

카드 발동에 필요한 타일 숫자 등급. `tileRank` 값으로 실제 타일 숫자가 결정된다.

| 값 | 타일 숫자 | 표시명 |
|----|:---------:|--------|
| `BASIC` | 4 | 기본 |
| `NORMAL` | 8 | 일반 |
| `ENHANCED` | 16 | 강화 |
| `POWERFUL` | 32 | 강력 |
| `LETHAL` | 64 | 필살 |
| `TRANSCENDENT` | 128 | 초월 |

---

## StageType

스테이지 유형. 막(Act) 마지막 위치는 항상 `BOSS`로 고정된다.

| 값 | 설명 |
|----|------|
| `NORMAL` | 일반 전투. 일반 몬스터 등장. 스킬카드·골드 보상 |
| `ELITE` | 엘리트 전투. 엘리트 몬스터 등장. 일반보다 강하고 보상도 고품질 |
| `BOSS` | 보스 전투. 막 마지막 고정 위치. 챕터 마지막 막의 보스가 최종보스, 그 외는 중간보스로 취급. 클리어 시 유물 획득 |
| `SUPPLY` | 보급 지역. 전투 없음. 회복·상점·카드 강화 중 하나 선택 |
| `UNKNOWN` | 미확인 지역. 랜덤 이벤트 발생. 아이템·전투·유물 등 다양한 결과 |

---

## EnemyType

적 유형. `initialCount` 권장 범위와 행동 특성이 달라진다.

| 값 | `initialCount` 권장 범위 | 행동 특성 |
|----|:------------------------:|-----------|
| `NORMAL` | 2 ~ 4 | 단일 공격 위주 |
| `ELITE` | 2 ~ 3 | 단일·광역 혼재, 디버프 가능 |
| `BOSS` | 3 ~ 5 (페이즈마다 변동) | 다수 행동 유형, 페이즈 전환 |

---

## CardEffectType

카드 효과 분류.

| 값 | 설명 |
|----|------|
| `ATTACK` | 적에게 피해 |
| `HEAL` | 아군 체력 회복 |
| `BUFF` | 아군에게 유리한 상태 효과 |
| `DEBUFF` | 적에게 불리한 상태 효과 |

> **[미결 A-1]** `SHIELD`·`DRAW`·`STATUS_EFFECT` 타입 추가 여부 미결. 채택 시 `EffectParams`에 `shieldAmount`, `drawCount` 필드 추가 필요.

---

## TargetType

카드 효과의 적용 대상 범위.

| 값 | 설명 |
|----|------|
| `SINGLE_ENEMY` | 적 1명 |
| `ALL_ENEMIES` | 생존 적 전원 |
| `SINGLE_ALLY` | 아군 1명 |
| `ALL_ALLIES` | 생존 아군 전원 |

---

## ActionType

적 행동 유형.

| 값 | 설명 |
|----|------|
| `ATTACK_SINGLE` | 파티원 1명에게 피해 (대상 선택 방식 미결 C-6) |
| `ATTACK_AOE` | 생존 파티원 전원에게 동일 피해 |
| `DEBUFF` | 파티원에게 불리한 상태이상 부여 |
| `BUFF_SELF` | 자신에게 유리한 상태 부여 |

---

## TargetMode

적 행동의 대상 범위 지정. `ATTACK_AOE`·`BUFF_SELF`는 이 값을 무시한다.

| 값 | 설명 |
|----|------|
| `SINGLE` | 단일 대상 |
| `ALL` | 전체 대상 |

---

## SceneTriggerType

스토리 씬 발동 시점.

| 값 | 발동 조건 | 보장 여부 |
|----|-----------|:---------:|
| `CHAPTER_START` | 챕터 진입 직후 | ✅ 항상 재생 |
| `BOSS_START` | 보스 전투 시작 직전 | ✅ 항상 재생 |
| `BOSS_CLEAR` | 보스 처치 직후 | ✅ 항상 재생 |
| `STAGE_START` | 특정 스테이지 진입 직전 | ⚠️ 경로 미선택 시 미재생 (부가 연출 전용) |
