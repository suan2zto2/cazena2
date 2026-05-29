# 기획 테이블 시트

<small style="color:#7070a0;font-family:'Roboto Mono',monospace;background:rgba(255,255,255,0.05);padding:2px 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.08);">📄 docs/data_sheet.md</small>

[📋 구글 시트 열기](https://docs.google.com/spreadsheets/d/1SRpzgAzrPeH7GlxGkBo3hs83RiYDknOo3uXKJkeRubM/edit){ .md-button .md-button--primary target="_blank" }

> Google Sheets로 게임 데이터를 편집하고, 변환 스크립트로 JSON을 생성하는 파이프라인을 정의합니다.  
> JSON 구조 상세는 [schema.md](schema.md)를 참조하십시오.

---

## JSON 익스포트 다운로드

구글 시트에서 변환한 최신 JSON 파일입니다. 게임 코드에서 직접 로드하거나 로컬에 저장해 사용하세요.

<button id="btn-build-data" class="md-button md-button--primary" onclick="buildAndDownloadData()">🔄 구글 시트에서 JSON 만들기 (전체)</button>

!!! warning "사용 조건"
    구글 시트가 **"링크가 있는 사람 모두 — 뷰어"** 로 공유되어 있어야 합니다.  
    시트 우측 상단 **공유 → 링크 복사 → 뷰어** 로 설정하세요.

---

## JSON 파일 목록

<table>
  <thead>
    <tr>
      <th>파일</th>
      <th>포함 시트</th>
      <th style="text-align:center">JSON 만들기</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>chapters.json</code></td>
      <td>Chapter, ActConfig</td>
      <td style="text-align:center">
        <button id="btn-build-chapters" class="md-button" onclick="buildChaptersJson('btn-build-chapters')">🔄 JSON 만들기</button>
      </td>
    </tr>
    <tr>
      <td><code>stages.json</code></td>
      <td>Stage, StageMonster</td>
      <td style="text-align:center">
        <button id="btn-build-stages" class="md-button" onclick="buildStagesJson('btn-build-stages')">🔄 JSON 만들기</button>
      </td>
    </tr>
    <tr>
      <td><code>characters.json</code></td>
      <td>Character</td>
      <td style="text-align:center">
        <button id="btn-build-characters" class="md-button" onclick="buildCharactersJson('btn-build-characters')">🔄 JSON 만들기</button>
      </td>
    </tr>
    <tr>
      <td><code>cards.json</code></td>
      <td>Card</td>
      <td style="text-align:center">
        <button id="btn-build-cards" class="md-button" onclick="buildCardsJson('btn-build-cards')">🔄 JSON 만들기</button>
      </td>
    </tr>
    <tr>
      <td><code>monsters.json</code></td>
      <td>Monster, MonsterAction, BossPhase</td>
      <td style="text-align:center">
        <button id="btn-build-monsters" class="md-button" onclick="buildMonstersJson('btn-build-monsters')">🔄 JSON 만들기</button>
      </td>
    </tr>
    <tr>
      <td><code>story_scenes.json</code></td>
      <td>StoryScene</td>
      <td style="text-align:center">
        <button id="btn-build-scenes" class="md-button" onclick="buildStoryScenesJson('btn-build-scenes')">🔄 JSON 만들기</button>
      </td>
    </tr>
  </tbody>
</table>

---

## 파이프라인

```
Google Sheets  ──변환 스크립트──▶  JSON 파일  ──로드──▶  게임
  (편집 소스)                      (게임 데이터)
```

- **시트**: 기획자가 편집하는 소스. 평면(2D) 구조.
- **변환 스크립트**: 시트 → JSON 변환. 분리된 행을 중첩 구조로 조립.
- **JSON**: 게임 코드가 읽는 최종 데이터. [schema.md](schema.md) 구조를 따름.

---

## 시트 목록

| 시트 탭 | 대응 JSON | 비고 |
|---------|-----------|------|
| [Chapter](#chapter) | `chapters.json` | 챕터 기본 정보 |
| [ActConfig](#actconfig) | `chapters.json` 내 `acts[]` | Chapter에 병합 |
| [Stage](#stage) | `stages.json` | 전투 스테이지 템플릿 |
| [StageMonster](#stagemonster) | `stages.json` 내 `monsters[]` | Stage에 병합 |
| [Character](#character) | `characters.json` | |
| [Card](#card) | `cards.json` | |
| [Monster](#monster) | `monsters.json` | 기본 스탯만 |
| [MonsterAction](#monsteraction) | `monsters.json` 내 `actionPattern`, `phaseThresholds[].actionPattern` | Monster에 병합 |
| [BossPhase](#bossphase) | `monsters.json` 내 `phaseThresholds[]` | Monster에 병합 |
| [StoryScene](#storyscene) | `story_scenes.json` | |

---

## 시트 상세

### Chapter

챕터 기본 정보. 메인 스토리와 서브 스토리 모두 이 시트에 등록한다.

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `id` | string | `ch1` | 챕터 식별자 (PK) |
| `title` | string | `도시의 균열` | 챕터 표시 제목 |
| `storyType` | enum | `MAIN` | `MAIN` / `SUB` |
| `actCount` | number | `2` | 막(Act) 수. `ActConfig` 행 수와 일치해야 함 |

**예시 행**

| id | title | storyType | actCount |
|----|-------|-----------|:--------:|
| ch1 | 도시의 균열 | MAIN | 3 |
| ch8 | 최후의 컴파일 | MAIN | 3 |
| sub_kestrel | 케스트럴의 과거 | SUB | 1 |

---

### ActConfig

챕터 내 각 막의 구성 설정. 챕터당 `actCount`개 행이 존재한다.  
변환 시 `chapterId`로 그룹화하여 해당 Chapter의 `acts[]` 배열로 병합된다.

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `chapterId` | string | `ch1` | `Chapter.id` 참조 (FK) |
| `actNumber` | number | `1` | 막 번호. 1부터 시작 |
| `stageCount` | number | `4` | 이 막의 스테이지 수 (보스 제외) |
| `supplyPositions` | string | `2,4` | 보급 지역을 고정 배치할 위치 인덱스. 쉼표 구분. 빈 칸이면 없음 |
| `bossMonsterId` | string | `warden` | 막 보스로 사용할 `Monster.id`. `enemyType = BOSS`여야 함 |

**예시 행**

| chapterId | actNumber | stageCount | supplyPositions | bossMonsterId |
|-----------|:---------:|:----------:|:---------------:|---------------|
| ch1 | 1 | 4 | 4 | field_captain |
| ch1 | 2 | 4 | 4 | warden |
| ch1 | 3 | 4 | | commander |

`supplyPositions`는 보급 지역이 고정 배치될 위치 번호(1-based). 비어 있으면 `[]`.

**막별 기본 스테이지 패턴**

| 막 | 위치 1 | 위치 2 | 위치 3 | 위치 4 | 위치 5 (고정) |
|----|--------|--------|--------|--------|---------------|
| 1막 | NORMAL | NORMAL | ELITE | SUPPLY | BOSS |
| 2막 | NORMAL | NORMAL | ELITE | SUPPLY | BOSS |
| 3막 | NORMAL | ELITE | ELITE | UNKNOWN | BOSS |

**변환 규칙**: `supplyPositions` → 쉼표로 분리하여 `number[]` 배열로 변환. 빈 칸은 `[]`.

---

### Stage

전투 스테이지 템플릿. `SUPPLY`·`UNKNOWN` 유형은 전투가 없으므로 `maxSlides`, `tileValues`, `tileWeights` 컬럼을 비워둔다.

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `id` | string | `ch1_s01` | 스테이지 식별자 (PK) |
| `chapterId` | string | `ch1` | `Chapter.id` 참조 (FK) |
| `actNumber` | number | `1` | 소속 막 번호 |
| `stageType` | enum | `NORMAL` | `NORMAL` / `ELITE` / `BOSS` / `SUPPLY` / `UNKNOWN` |
| `maxSlides` | number | `5` | 턴당 최대 슬라이드 횟수. 전투 스테이지(`NORMAL`·`ELITE`·`BOSS`)만 입력 |
| `tileValues` | string | `2,4` | 생성 가능한 타일 값. 쉼표 구분. 전투 스테이지만 입력 |
| `tileWeights` | string | `3,1` | 각 타일 값의 생성 가중치. 쉼표 구분. `tileValues`와 길이 동일 |

**ID 네이밍 규칙**: `{chapterId}_a{actNumber}_s{stageIndex}` — 예: `ch1_a1_s3`

**예시 행**

| id | chapterId | actNumber | stageType | maxSlides | tileValues | tileWeights |
|----|-----------|:---------:|-----------|:---------:|-----------|------------|
| ch1_a1_s1 | ch1 | 1 | NORMAL | 5 | 2,4 | 7,3 |
| ch1_a1_s3 | ch1 | 1 | ELITE | 4 | 2,4 | 7,3 |
| ch1_a1_s4 | ch1 | 1 | SUPPLY | | | |
| ch1_a1_s5 | ch1 | 1 | BOSS | 6 | 2,4 | 5,5 |
| ch1_a3_s4 | ch1 | 3 | UNKNOWN | | | |

**변환 규칙**: `tileValues`, `tileWeights` → 쉼표로 분리하여 `tileSpawnConfig.values[]`, `tileSpawnConfig.weights[]` 배열로 변환.

---

### StageMonster

Stage와 Monster를 연결하는 중간 테이블. 전투 스테이지(`NORMAL`·`ELITE`·`BOSS`)에만 등록한다.  
변환 시 `stageId`로 그룹화하여 해당 Stage의 `monsters[]` 배열로 병합된다.

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `stageId` | string | `ch1_s01` | `Stage.id` 참조 (FK) |
| `monsterId` | string | `grunt` | `Monster.id` 참조 (FK) |
| `position` | number | `1` | 화면 위→아래 순서이자 행동 처리 순서. 오름차순, 중복 불가 |

**예시 행**

| stageId | monsterId | position |
|---------|-----------|:--------:|
| ch1_a1_s1 | grunt | 1 |
| ch1_a1_s1 | patrol | 2 |
| ch1_a1_s3 | enforcer | 1 |
| ch1_a1_s5 | field_captain | 1 |
| ch1_a3_s3 | enforcer | 1 |
| ch1_a3_s3 | enforcer | 2 |

---

### Character

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `id` | string | `kestrel` | 캐릭터 식별자 (PK) |
| `name` | string | `케스트럴 (Kestrel)` | 화면 표시 이름 |
| `baseHp` | number | `120` | 최대 체력 |
| `isDlc` | boolean | `FALSE` | DLC 캐릭터 여부 |

**예시 행**

| id | name | baseHp | isDlc |
|----|------|:------:|:-----:|
| kestrel | 케스트럴 (Kestrel) | 120 | FALSE |
| jube | 주베 (Jube) | 90 | FALSE |

---

### Card

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `id` | string | `kestrel_c01` | 카드 식별자 (PK) |
| `ownerCharacterId` | string | `kestrel` | `Character.id` 참조 (FK) |
| `name` | string | `방패 강타` | 카드 표시 이름 |
| `tileRank` | enum | `ENHANCED` | 발동 타일 등급. `BASIC` / `NORMAL` / `ENHANCED` / `POWERFUL` / `LETHAL` / `TRANSCENDENT` |
| `effectType` | enum | `ATTACK` | `ATTACK` / `HEAL` / `BUFF` / `DEBUFF` |
| `targetType` | enum | `SINGLE_ENEMY` | `SINGLE_ENEMY` / `ALL_ENEMIES` / `SINGLE_ALLY` / `ALL_ALLIES` |
| `damage` | number | `25` | `ATTACK` 전용. 피해량 |
| `healAmount` | number | | `HEAL` 전용. 회복량 |
| `buffId` | string | | `BUFF` 전용. 버프 식별자 |
| `debuffId` | string | | `DEBUFF` 전용. 디버프 식별자 |
| `duration` | number | | `BUFF`/`DEBUFF` 전용. 지속 액션 버튼 횟수. 빈 칸이면 영구 |
| `upgradedTileRank` | enum | `NORMAL` | 강화 후 대체 등급. 반드시 `tileRank`보다 낮은 등급. 빈 칸이면 미강화 상태 |

**변환 규칙**: `damage`, `healAmount`, `buffId`, `debuffId`, `duration` → `effectParams` 객체로 묶음. 빈 칸은 `undefined`.

---

### Monster

행동 패턴은 [MonsterAction](#monsteraction) 시트에 별도 입력하며 변환 시 병합된다.

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `id` | string | `grunt` | 적 식별자 (PK) |
| `displayName` | string | `경비 드론` | 화면 표시 이름 |
| `enemyType` | enum | `NORMAL` | `NORMAL` / `ELITE` / `BOSS` |
| `maxHp` | number | `50` | 최대 체력 |
| `initialShield` | number | `0` | 전투 시작 방어막. `0`이면 없음 |
| `initialCount` | number | `3` | 페이즈 1 기본 카운트 초기값 |

---

### MonsterAction

적의 모든 행동을 정의한다. 변환 시 `monsterId` + `phase`로 그룹화하여 `actionPattern`을 구성하고, `Monster` JSON에 병합된다.

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `monsterId` | string | `warden` | `Monster.id` 참조 (FK) |
| `phase` | number | `1` | 소속 페이즈. `1` = 기본 패턴, `2 이상` = 해당 BossPhase 패턴 |
| `role` | enum | `action` | `action` / `default` / `transition` |
| `orderIndex` | number | `0` | `role = action`일 때 순환 순서. 0부터 시작. 나머지 role은 빈 칸 |
| `actionType` | enum | `ATTACK_AOE` | `ATTACK_SINGLE` / `ATTACK_AOE` / `DEBUFF` / `BUFF_SELF` |
| `targetMode` | enum | `ALL` | `SINGLE` / `ALL`. `ATTACK_AOE`·`BUFF_SELF`는 무시됨 |
| `power` | number | `15` | 피해량 또는 효과 수치 |
| `effectId` | string | | `DEBUFF`·`BUFF_SELF` 전용. 빈 칸이면 없음 |
| `effectDuration` | number | | 효과 지속 횟수. 빈 칸이면 영구 |
| `resetCount` | number | `4` | 이 행동 실행 후 카운트 리셋값 |
| `scheduledTurns` | string | | 특정 턴에만 발동. 쉼표 구분. 빈 칸이면 기본 순환에 포함 |

**role 종류**

| 값 | 설명 | `orderIndex` |
|----|------|:------------:|
| `action` | 순환 목록의 일반 행동 | 필수 |
| `default` | 스킬 없는 턴의 기본 행동 | 빈 칸 |
| `transition` | 페이즈 전환 즉시 발동 행동 (`phase 2` 이상에서만 유효) | 빈 칸 |

**변환 규칙**

```
MonsterAction 행 전체를 monsterId로 그룹화
  → phase = 1인 행: Monster.actionPattern 구성
      role = 'action'  → orderIndex 오름차순 정렬 → actionPattern.actions[]
      role = 'default' → actionPattern.defaultAction
  → phase >= 2인 행: 해당 phase의 BossPhase.actionPattern 구성
      role = 'action'      → actionPattern.actions[]
      role = 'default'     → actionPattern.defaultAction
      role = 'transition'  → PhaseThreshold.transitionAction
scheduledTurns 쉼표 문자열 → number[] 배열로 변환. 빈 칸이면 undefined
effectDuration 빈 칸 → undefined (영구 지속 예약)
```

---

### BossPhase

보스 페이즈 전환 조건을 정의한다. `enemyType = BOSS`인 Monster 전용.  
변환 시 `monsterId`로 그룹화하여 `Monster.phaseThresholds[]`에 병합된다.

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `monsterId` | string | `warden` | `Monster.id` 참조 (FK). `enemyType = BOSS`만 유효 |
| `phaseNumber` | number | `2` | 페이즈 번호. 2 이상 (1은 Monster 기본 패턴) |
| `triggerValue` | number | `0.5` | 전환 트리거 체력 비율. `0.0 초과 ~ 1.0 미만` |
| `initialCount` | number | `2` | 이 페이즈의 카운트 초기값 |

**제약 조건**: `triggerValue` 내림차순 정렬 권장. `phaseNumber`는 해당 monsterId의 MonsterAction에 같은 `phase` 값의 행이 존재해야 한다.

---

### StoryScene

챕터 내 스토리 씬(컷씬·대화) 발동 정의. 트리거 시점별로 1행씩 등록한다.  
`STAGE_START` 트리거는 경로 미선택 시 재생이 보장되지 않으므로 필수 서사 배치를 지양한다.

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `id` | string | `ch1_intro` | 씬 식별자 (PK) |
| `chapterId` | string | `ch1` | `Chapter.id` 참조 (FK) |
| `triggerType` | enum | `CHAPTER_START` | `CHAPTER_START` / `BOSS_START` / `BOSS_CLEAR` / `STAGE_START` |
| `sceneAssetId` | string | `scene_ch1_intro` | 재생할 씬 에셋·스크립트 식별자 |
| `monsterId` | string | | `BOSS_START`·`BOSS_CLEAR` 전용. 특정 보스 지정 시 입력. 빈 칸이면 막 전체 보스에 공통 적용 |
| `stageId` | string | | `STAGE_START` 전용. 발동할 `Stage.id` |

**예시 행**

| id | chapterId | triggerType | sceneAssetId | monsterId | stageId |
|----|-----------|-------------|--------------|-----------|---------|
| ch1_intro | ch1 | CHAPTER_START | scene_ch1_intro | | |
| ch1_boss1_start | ch1 | BOSS_START | scene_ch1_warden_start | warden | |
| ch1_boss1_clear | ch1 | BOSS_CLEAR | scene_ch1_warden_clear | warden | |
| ch1_final_clear | ch1 | BOSS_CLEAR | scene_ch1_ending | commander | |

---

## 변환 스크립트 입출력 요약

!!! note "시드 스크립트"
    `scripts/seedAllChapters.ts` — 8챕터 전체 데이터(Chapter·ActConfig·Stage·StageMonster·Monster·MonsterAction·BossPhase·StoryScene)를 구글 시트에 일괄 입력한다. 기존 데이터를 초기화한 후 재삽입한다.  
    `scripts/seedData.ts` — 캐릭터·카드 등 챕터 독립 데이터 입력용.

```
입력  : 시트 10개 (CSV 또는 Google Sheets API)
출력  : chapters.json / stages.json / characters.json / cards.json / monsters.json / story_scenes.json

chapters.json    ← Chapter + ActConfig 병합
stages.json      ← Stage + StageMonster 병합
characters.json  ← Character
cards.json       ← Card (effectParams 객체로 조립)
monsters.json    ← Monster + MonsterAction + BossPhase 병합
story_scenes.json← StoryScene
```

**병합 순서**

```
1. ActConfig 행을 chapterId로 그룹화 → acts[] 구성
2. Chapter 행 + 위 결과 병합 → chapters.json

3. BossPhase 행을 monsterId로 그룹화 → phaseThresholds[] 초안 구성
4. MonsterAction 행을 monsterId + phase로 그룹화 → actionPattern 구성
   phase = 1  → Monster.actionPattern
   phase >= 2 → 해당 PhaseThreshold.actionPattern + transitionAction
5. Monster 행 + 위 결과 병합 → monsters.json

6. StageMonster 행을 stageId로 그룹화 → Stage.monsters[] 구성
7. Stage 행 + 위 결과 병합 → stages.json
```
