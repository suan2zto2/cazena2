# 스키마 설계

> 스키마 데이터는 세 계층으로 구분합니다.

| 계층 | 설명 | 생명주기 |
|------|------|----------|
| **기획 테이블** | 기획자가 정의하는 콘텐츠 데이터 | 릴리즈 시점에 확정. 게임 중 변하지 않음 |
| **세이브 데이터** | 플레이어별로 생성·변경되는 진행 데이터 | 로컬 저장소에 유지. 세션 사이에 보존 |
| **런타임 데이터** | 전투 중 메모리에서만 존재하는 임시 데이터 | 전투 시작 시 생성. 전투 종료 시 소멸 |

---

## 구조체 목록

| 구조체 | 계층 | 설명 |
|--------|------|------|
| [`Stage`](#stage) | 기획 테이블 | 스테이지. 보드 설정·등장 몬스터 포함 |
| [`Character`](#character) | 기획 테이블 | 캐릭터. 체력·DLC 여부 |
| [`Card`](#card) | 기획 테이블 | 스킬 카드. 발동 숫자·등급·효과 파라미터 내포 |
| [`Monster`](#monster) | 기획 테이블 | 적. 행동 패턴·보스 페이즈 내포 |
| [`SaveData`](#savedata) | 세이브 데이터 | 루트 저장 구조체. 영구 계정 데이터와 챕터 진행 상태 포함 |
| [`AccountSave`](#accountsave) | 세이브 데이터 | 챕터 리셋과 무관한 영구 성장 데이터 |
| [`ChapterRun`](#chapterrun) | 세이브 데이터 | 챕터 클리어 시 삭제되는 단일 챕터 진행 상태 |
| [`CharacterState`](#characterstate) | 세이브 데이터 | 챕터 진행 중 파티원 체력 등 상태 |
| [`BoardState`](#boardstate) | 런타임 데이터 | 전투 중 보드 전체 상태 |
| [`DeckState`](#deckstate) | 런타임 데이터 | 전투 중 카드 덱 전체 상태 |
| [`Tile`](#tile) | 런타임 데이터 | 슬라이드 연산 중에만 사용하는 임시 구조체 |

---

## ERD

### 기획 테이블

```mermaid
erDiagram
    Character {
        string id PK
        string name
        number baseHp
        boolean isDlc
    }
    Card {
        string id PK
        string ownerCharacterId FK
        string name
        string tileRank
        string effectType
        string upgradedTileRank "nullable"
    }
    Stage {
        string id PK
        string chapterId
        number orderInChapter
        string stageType
        number maxSlides
    }
    Monster {
        string id PK
        string displayName
        string enemyType
        number maxHp
        number initialShield
    }
    StageMonster {
        string stageId FK
        string monsterId FK
        number position
    }

    Character ||--o{ Card : "소유 (ownerCharacterId)"
    Stage ||--o{ StageMonster : "등장 몬스터"
    Monster ||--o{ StageMonster : "스테이지 배치"
```

### Monster 내부 구조

```mermaid
erDiagram
    Monster {
        string id PK
        string enemyType
        number maxHp
        number initialShield
    }
    ActionPattern {
        number initialCount
    }
    EnemyAction {
        string actionType
        string targetMode
        number power
        string effectId
        number effectDuration
        number resetCount
        string scheduledTurns
    }
    PhaseThreshold {
        number phaseNumber
        number triggerValue
    }

    Monster ||--|| ActionPattern : "actionPattern (페이즈1)"
    Monster ||--o{ PhaseThreshold : "phaseThresholds (BOSS 전용)"
    ActionPattern ||--o{ EnemyAction : "actions[ ]"
    ActionPattern ||--|| EnemyAction : "defaultAction"
    PhaseThreshold ||--|| ActionPattern : "actionPattern"
    PhaseThreshold ||--o| EnemyAction : "transitionAction"
```

### 세이브 데이터

```mermaid
erDiagram
    SaveData {
        AccountSave account
        ChapterRun chapterRun "nullable"
    }
    AccountSave {
        number userLevel
        number userXp
        string[] unlockedCharacterIds
        string[] clearedChapterIds
    }
    ChapterRun {
        string chapterId
        string currentStageId
        string[] passiveIds
        string[] relicIds
        string[] addedCardIds
    }
    CharacterState {
        string characterId FK
        number currentHp
    }

    SaveData ||--|| AccountSave : "account"
    SaveData ||--o| ChapterRun : "chapterRun (챕터 진행 중만 존재)"
    ChapterRun ||--|{ CharacterState : "party (출전 3인)"
```

### 기획 테이블 → 런타임 데이터 연결

```mermaid
flowchart LR
    Stage -->|maxSlides 주입| BoardState
    Stage -->|tileSpawnConfig 참조| TileLogic["타일 생성 로직"]
    Cards["Card[ ]\n출전 3인 합산"] -->|셔플| WaitDeck["DeckState\n.waitDeck"]
```

---

## 기획 테이블

### Stage

스테이지 정의. 챕터 내 위치, 보드 설정, 등장 몬스터를 포함한다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `string` | 스테이지 식별자. 예: `"ch1_stage2"` |
| `chapterId` | `string` | 소속 챕터. 예: `"chapter1"` |
| `orderInChapter` | `number` | 챕터 내 순서. 1부터 시작 |
| `stageType` | [`StageType`](enums.md#stagetype) | 스테이지 유형 |
| `maxSlides` | `number` | 턴당 최대 슬라이드 횟수. 전투 시작 시 `BoardState.maxSlides`로 주입 |
| `tileSpawnConfig` | `{ values: number[], weights: number[] }` | 슬라이드 후 타일 생성 확률 분포. 기본값: `{ values: [2], weights: [1] }` |
| `monsters` | `{ monsterId: string, position: number }[]` | 등장 몬스터 목록. `position` 오름차순이 화면 위→아래이자 행동 처리 순서 |

**tileSpawnConfig 예시**

| `values` | `weights` | 동작 |
|----------|-----------|------|
| `[2]` | `[1]` | 항상 `2` 생성 (초기 구현 기본값) |
| `[2, 4]` | `[3, 1]` | `2` 75%, `4` 25% |

**제약 조건**

| 항목 | 규칙 |
|------|------|
| `tileSpawnConfig` | `values.length === weights.length`. `weights` 원소는 양의 정수 |
| `monsters` | 1개 이상. `position` 중복 불가 |
| `stageType === 'BOSS'` | `monsters` 중 `enemyType === 'BOSS'`인 항목이 1개 이상 존재 |

---

### Character

플레이어가 출전시킬 수 있는 캐릭터 정의.

> `Card.ownerCharacterId`가 이 `id`를 참조한다. 전투 시작 시 출전한 3인의 카드가 합산되어 덱을 구성한다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `string` | 캐릭터 식별자. 예: `"char_a"` |
| `name` | `string` | 화면 표시 이름 |
| `baseHp` | `number` | 최대 체력 |
| `isDlc` | `boolean` | DLC 캐릭터 여부 |

---

### Card

캐릭터의 스킬 카드 정의. 효과 파라미터(`effectParams`)를 내포한다.

> 카드 발동 흐름: [card.md §5](systems/card.md)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `string` | 카드 식별자. 예: `"char_a_attack_01"` |
| `ownerCharacterId` | `string` | `Character.id` 참조. 해당 캐릭터가 출전하지 않으면 이 카드는 덱에 포함되지 않는다 |
| `name` | `string` | 카드 표시 이름 |
| `tileRank` | [`TileRank`](enums.md#tilerank) | 발동에 필요한 타일 숫자 등급. 실제 타일 숫자는 `TileRank` 정의에서 파생 |
| `effectType` | [`CardEffectType`](enums.md#cardeffecttype) | 카드 효과 분류 |
| `effectParams` | `EffectParams` | 효과 실행 파라미터 (아래 참조) |
| `upgradedTileRank` | [`TileRank`](enums.md#tilerank)` \| undefined` | 강화 후 대체 등급. 반드시 `tileRank`보다 낮은 등급이어야 한다 |

**런타임 데이터 전용 필드** (기획 테이블에 없음. 전투 시작 시 세팅)

| 필드 | 타입 | 설명 |
|------|------|------|
| `isActive` | `boolean` | 소유 캐릭터 생존 여부. `false`이면 발동 불가 |

**EffectParams**

| 필드 | 타입 | 사용 `effectType` | 설명 |
|------|------|-------------------|------|
| `targetType` | [`TargetType`](enums.md#targettype) | 전체 | 효과 적용 대상 |
| `damage` | `number \| undefined` | `ATTACK` | 피해량 |
| `healAmount` | `number \| undefined` | `HEAL` | 회복량 |
| `buffId` | `string \| undefined` | `BUFF` | 부여할 버프 식별자 |
| `debuffId` | `string \| undefined` | `DEBUFF` | 부여할 디버프 식별자 |
| `duration` | `number \| undefined` | `BUFF`, `DEBUFF` | 효과 지속 액션 버튼 횟수. `0`은 영구 지속 예약값 (미결 C-5) |

---

### Monster

전투에 등장하는 적 정의. 행동 패턴과 보스 페이즈를 내포한다.

> 적 AI 시스템 전체 규칙: [enemy.md](systems/enemy.md)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `string` | 적 식별자. 예: `"goblin_swordsman_01"` |
| `displayName` | `string` | 화면 표시 이름 |
| `enemyType` | [`EnemyType`](enums.md#enemytype) | 적 유형 |
| `maxHp` | `number` | 최대 체력 |
| `initialShield` | `number` | 전투 시작 시 방어막. `0`이면 없음 |
| `actionPattern` | `ActionPattern` | 기본 행동 패턴 (아래 참조) |
| `phaseThresholds` | `PhaseThreshold[] \| undefined` | 페이즈 전환 조건. **BOSS 전용** |


#### ActionPattern

| 필드 | 타입 | 설명 |
|------|------|------|
| `initialCount` | `number` | 전투 시작·행동 실행 후 리셋 시 카운트 기본값 |
| `actions` | `EnemyAction[]` | 행동 목록. 고정 순환 방식 기준 인덱스 0부터 반복 (미결 C-2) |
| `defaultAction` | `EnemyAction` | 해당 턴에 `scheduledTurns` 스킬이 없을 때 발동하는 기본 행동 |

#### EnemyAction

| 필드 | 타입 | 설명 |
|------|------|------|
| `actionType` | [`ActionType`](enums.md#actiontype) | 행동 유형 |
| `targetMode` | [`TargetMode`](enums.md#targetmode) | 대상 범위. `ATTACK_AOE`·`BUFF_SELF`는 무시됨 |
| `power` | `number` | 피해량 또는 효과 수치 |
| `effectId` | `string \| undefined` | `DEBUFF`·`BUFF_SELF` 전용. 적용할 효과 식별자 |
| `effectDuration` | `number \| undefined` | 효과 지속 횟수. `0`은 영구 지속 예약값 (미결 C-5) |
| `resetCount` | `number` | 이 행동 실행 후 `actionCount` 리셋값. 현재 `actionPattern.initialCount`와 동일값 사용 (미결 C-1) |
| `scheduledTurns` | `number[] \| undefined` | 지정 턴(액션 버튼 누적 횟수)에만 발동. `undefined`이면 기본 순환에 포함 |


#### PhaseThreshold (BOSS 전용)

> 페이즈 전환 처리 흐름: [enemy.md §6](systems/enemy.md)

| 필드 | 타입 | 설명 |
|------|------|------|
| `phaseNumber` | `number` | 전환될 페이즈 번호. 2 이상 (페이즈 1은 `Monster.actionPattern`이 담당) |
| `triggerValue` | `number` | `currentHp / maxHp ≤ 이 값`일 때 전환. `0.0 ~ 1.0` 체력 비율 (미결 C-4) |
| `actionPattern` | `ActionPattern` | 해당 페이즈의 행동 패턴 |
| `transitionAction` | `EnemyAction \| undefined` | 페이즈 전환 즉시 발동하는 특수 행동 |

**제약 조건**: `phaseThresholds`는 `triggerValue` 내림차순 정렬 권장. `triggerValue`는 `0.0` 초과 `1.0` 미만.

**보스 데이터 예시**

```typescript
const dragonBoss: Monster = {
  id: "dragon_boss_01",
  displayName: "보스 드래곤",
  enemyType: "BOSS",
  maxHp: 500,
  initialShield: 0,
  actionPattern: {
    initialCount: 4,
    actions: [
      { actionType: "ATTACK_SINGLE", targetMode: "SINGLE", power: 20, resetCount: 4 },
      { actionType: "ATTACK_AOE",    targetMode: "ALL",    power: 15, resetCount: 4 },
      { actionType: "BUFF_SELF",     targetMode: "SINGLE", power: 40, effectId: "shield_gain", resetCount: 4 },
    ],
    defaultAction: { actionType: "ATTACK_SINGLE", targetMode: "SINGLE", power: 20, resetCount: 4 },
  },
  phaseThresholds: [
    {
      phaseNumber: 2,
      triggerValue: 0.5,
      transitionAction: { actionType: "ATTACK_AOE", targetMode: "ALL", power: 30, resetCount: 3 },
      actionPattern: {
        initialCount: 3,
        actions: [
          { actionType: "ATTACK_AOE", targetMode: "ALL", power: 20, resetCount: 3 },
          { actionType: "ATTACK_AOE", targetMode: "ALL", power: 20, effectId: "defense_down", effectDuration: 2, resetCount: 3 },
        ],
        defaultAction: { actionType: "ATTACK_AOE", targetMode: "ALL", power: 20, resetCount: 3 },
      },
    },
    {
      phaseNumber: 3,
      triggerValue: 0.25,
      transitionAction: undefined,
      actionPattern: {
        initialCount: 2,
        actions: [
          { actionType: "ATTACK_AOE", targetMode: "ALL", power: 25, resetCount: 2 },
          { actionType: "ATTACK_AOE", targetMode: "ALL", power: 30, resetCount: 2 },
        ],
        defaultAction: { actionType: "ATTACK_AOE", targetMode: "ALL", power: 25, resetCount: 2 },
      },
    },
  ],
}
```

---

## 세이브 데이터

로컬 저장소에 유지된다. 세션 사이에 보존되며 챕터 클리어 또는 영구 성장 두 라이프사이클로 관리된다.

### SaveData

세이브 파일의 루트 구조체.

| 필드 | 타입 | 설명 |
|------|------|------|
| `account` | `AccountSave` | 챕터 리셋과 무관한 영구 데이터 |
| `chapterRun` | `ChapterRun \| null` | 현재 진행 중인 챕터 상태. 챕터 미진행 시 `null` |

---

### AccountSave

챕터 클리어 후에도 유지되는 영구 성장 데이터.

| 필드 | 타입 | 설명 |
|------|------|------|
| `userLevel` | `number` | 유저 레벨. 챕터 플레이 경험치로 상승 |
| `userXp` | `number` | 현재 누적 경험치 |
| `unlockedCharacterIds` | `string[]` | 보유(해금)한 `Character.id` 목록. 기본 5인 + DLC |
| `clearedChapterIds` | `string[]` | 클리어한 챕터 `id` 목록. 영구 해금 트래킹 |

> **[미결]** 장비(`Equipment`) 구조 미정. 아웃게임 상점·뽑기 시스템 설계 후 `AccountSave`에 `equipments` 필드 추가 예정.

---

### ChapterRun

단일 챕터 진행 상태. 챕터 클리어 시 `SaveData.chapterRun`을 `null`로 초기화한다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `chapterId` | `string` | 진행 중인 챕터 식별자 |
| `currentStageId` | `string` | 현재 도달한 `Stage.id` |
| `party` | `CharacterState[]` | 출전 3인 상태. 배열 순서 = 화면 표시 순서 |
| `passiveIds` | `string[]` | 선택한 챕터 패시브 식별자 목록. 중복 불가, 최대 챕터 내 레벨업 횟수만큼 |
| `relicIds` | `string[]` | 보유 유물 식별자 목록. 보스 처치마다 1개 추가 |
| `addedCardIds` | `string[]` | 카드 보상으로 덱에 추가된 `Card.id` 목록 |

**제약 조건**

| 항목 | 규칙 |
|------|------|
| `party` | 길이 고정 3. 모두 `AccountSave.unlockedCharacterIds`에 포함된 값 |
| `passiveIds` | 중복 값 불가 |

---

### CharacterState

챕터 진행 중 파티원별 가변 상태.

| 필드 | 타입 | 설명 |
|------|------|------|
| `characterId` | `string` | `Character.id` 참조 |
| `currentHp` | `number` | 현재 체력. `0`이면 사망. `Character.baseHp` 이하 |

---

## 런타임 데이터

전투 시작 시 생성되고 전투 종료 시 소멸한다.

### BoardState

전투 중 보드 전체 상태.

> 상세 동작: [board.md §2-4](systems/board.md)

| 필드 | 타입 | 초기값 | 설명 |
|------|------|--------|------|
| `board` | `number[][]` | 4×4 전체 `0` | 빈 칸 `0`, 타일은 `2` 이상 양의 정수 |
| `slideCount` | `number` | `maxSlides` | 현재 턴 남은 슬라이드 횟수. `0`이면 입력 차단 |
| `maxSlides` | `number` | `Stage.maxSlides` | 턴당 최대 슬라이드 횟수. 재드로우 완료 시 `slideCount` 리셋 기준값 |
| `isSlideBlocked` | `boolean` | `false` | 4방향 모두 무효일 때 `true`. `slideCount === 0` 차단과 독립 |

---

### DeckState

전투 중 카드 덱 전체 상태. 대기덱·핸드·소모덱 세 영역을 관리한다.

> 상세 동작: [card.md §3](systems/card.md)

| 필드 | 타입 | 초기값 | 설명 |
|------|------|--------|------|
| `waitDeck` | `Card[]` | 출전 캐릭터 카드 합산 셔플 | 아직 드로우되지 않은 카드 풀 |
| `hand` | `Card[]` | 대기덱에서 5장 드로우 | 현재 사용 가능한 카드. 최대 5장 |
| `discardDeck` | `Card[]` | `[]` | 사용된 카드. 대기덱 소진 시 셔플하여 대기덱으로 전환 |

---

### Tile

슬라이드 연산 중에만 사용. `board[r][c]` 정수를 연산 진입 시 변환하고 완료 후 다시 정수로 평탄화한다.

> 상세 동작: [board.md §2-2](systems/board.md)

| 필드 | 타입 | 초기값 | 설명 |
|------|------|--------|------|
| `value` | `number` | 원본 정수 | 타일 숫자. 병합 시 두 배 |
| `mergedThisTurn` | `boolean` | `false` | 현재 슬라이드에서 병합된 타일이면 `true`. 연쇄 병합 차단에 사용. 슬라이드 완료 시 전체 `false` 초기화 |

---

## 미결 사항

기획 테이블 구조에 영향을 주는 항목만 정리. 전체 미결 목록은 각 시스템 문서 참조.

| 번호 | 항목 | 영향 필드 | 결정 필요 시점 |
|------|------|-----------|:-----------:|
| **A-1** | 카드 효과 타입 확장 (`SHIELD`·`DRAW` 등) | `CardEffectType`, `EffectParams` | 2단계 착수 전 |
| **C-1** | 카운트 리셋값 방식 (고정 vs 행동별 가변) | `EnemyAction.resetCount` 사용 방식 | 4단계 착수 전 |
| **C-2** | 행동 패턴 구조 확장 (`RANDOM_WEIGHTED`·`CONDITIONAL`) | `ActionPattern.actions` 항목 필드 | 4단계 착수 전 |
| **C-4** | 보스 페이즈 트리거 (체력 비율 vs 절대값) | `PhaseThreshold.triggerValue` 타입·해석 | 4단계 착수 전 |
| **C-5** | 효과 지속 방식 (N턴 vs 영구) | `EnemyAction.effectDuration`, `EffectParams.duration` | 4단계 착수 전 |
| **C-6** | 단일 공격 대상 선택 방식 | `EnemyAction.targetMode` 적용 로직 | 4단계 착수 전 |
