# 기획 테이블 시트

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
      <th>포함 테이블</th>
      <th style="text-align:center">JSON 만들기</th>
    </tr>
  </thead>
  <tbody>
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
  </tbody>
</table>

---

## 파이프라인

```
Google Sheets  ──변환 스크립트──▶  JSON 파일  ──로드──▶  게임
  (편집 소스)                      (게임 데이터)
```

- **시트**: 기획자가 편집하는 소스. 평면(2D) 구조.
- **변환 스크립트**: 시트 → JSON 변환. 시트의 분리된 행을 중첩 구조로 조립.
- **JSON**: 게임 코드가 읽는 최종 데이터. [schema.md](schema.md) 구조를 따름.

---

## 시트 목록

| 시트 탭 | 대응 JSON | 비고 |
|---------|-----------|------|
| [Stage](#stage) | `stages.json` | 보드 설정·챕터 위치 |
| [StageMonster](#stagemonster) | `stages.json` 내 `monsters[]` | Stage에 병합 |
| [Character](#character) | `characters.json` | |
| [Card](#card) | `cards.json` | |
| [Monster](#monster) | `monsters.json` | 기본 스탯만 |
| [MonsterAction](#monsteraction) | `monsters.json` 내 `actionPattern`, `phaseThresholds[].actionPattern` | Monster에 병합 |
| [BossPhase](#bossphase) | `monsters.json` 내 `phaseThresholds[]` | Monster에 병합 |

---

## 시트 상세

### Stage

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `id` | string | `ch1_stage1` | 스테이지 식별자 (PK) |
| `chapterId` | string | `chapter1` | 소속 챕터 |
| `orderInChapter` | number | `1` | 챕터 내 순서 |
| `stageType` | enum | `NORMAL` | `NORMAL` / `ELITE` / `BOSS` |
| `maxSlides` | number | `5` | 턴당 최대 슬라이드 횟수 |
| `tileValues` | string | `2,4` | 생성 가능한 타일 값. 쉼표 구분 |
| `tileWeights` | string | `3,1` | 각 타일 값의 생성 가중치. 쉼표 구분. `tileValues`와 길이 동일 |

**예시 행**

| id | chapterId | orderInChapter | stageType | maxSlides | tileValues | tileWeights |
|----|-----------|:--------------:|-----------|:---------:|-----------|------------|
| ch1_stage1 | chapter1 | 1 | NORMAL | 5 | 2 | 1 |
| ch1_stage2 | chapter1 | 2 | ELITE | 4 | 2,4 | 3,1 |
| ch1_stage3 | chapter1 | 3 | BOSS | 5 | 2,4 | 3,1 |

**변환 규칙**: `tileValues`, `tileWeights` → 쉼표로 분리하여 `tileSpawnConfig.values[]`, `tileSpawnConfig.weights[]` 배열로 변환.

---

### StageMonster

Stage와 Monster를 연결하는 중간 테이블.  
변환 시 `stageId`로 그룹화하여 해당 Stage의 `monsters[]` 배열로 병합된다.

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `stageId` | string | `ch1_stage1` | `Stage.id` 참조 (FK) |
| `monsterId` | string | `goblin_01` | `Monster.id` 참조 (FK) |
| `position` | number | `1` | 화면 위→아래 순서이자 행동 처리 순서. 오름차순, 중복 불가 |

**예시 행**

| stageId | monsterId | position |
|---------|-----------|:--------:|
| ch1_stage1 | goblin_01 | 1 |
| ch1_stage1 | goblin_02 | 2 |
| ch1_stage2 | orc_mage_01 | 1 |
| ch1_stage3 | dragon_boss_01 | 1 |

---

### Character

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `id` | string | `char_a` | 캐릭터 식별자 (PK) |
| `name` | string | `카이` | 화면 표시 이름 |
| `baseHp` | number | `80` | 최대 체력 |
| `isDlc` | boolean | `FALSE` | DLC 캐릭터 여부 |

**예시 행**

| id | name | baseHp | isDlc |
|----|------|:------:|:-----:|
| char_a | 카이 | 80 | FALSE |
| char_b | 레나 | 60 | FALSE |
| char_c | 막스 | 100 | FALSE |

---

### Card

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `id` | string | `char_a_atk_01` | 카드 식별자 (PK) |
| `ownerCharacterId` | string | `char_a` | `Character.id` 참조 (FK) |
| `name` | string | `참격` | 카드 표시 이름 |
| `tileRank` | enum | `ENHANCED` | 발동 타일 등급. `BASIC` / `NORMAL` / `ENHANCED` / `POWERFUL` / `LETHAL` / `TRANSCENDENT` |
| `effectType` | enum | `ATTACK` | `ATTACK` / `HEAL` / `BUFF` / `DEBUFF` |
| `targetType` | enum | `SINGLE_ENEMY` | `SINGLE_ENEMY` / `ALL_ENEMIES` / `SINGLE_ALLY` / `ALL_ALLIES` |
| `damage` | number | `25` | `ATTACK` 전용. 피해량 |
| `healAmount` | number | | `HEAL` 전용. 회복량 |
| `buffId` | string | | `BUFF` 전용. 버프 식별자 |
| `debuffId` | string | | `DEBUFF` 전용. 디버프 식별자 |
| `duration` | number | | `BUFF`/`DEBUFF` 전용. 지속 액션 버튼 횟수. 빈 칸이면 영구 |
| `upgradedTileRank` | enum | `NORMAL` | 강화 후 대체 등급. 반드시 `tileRank`보다 낮은 등급. 빈 칸이면 미강화 상태 |

**예시 행**

| id | ownerCharacterId | name | tileRank | effectType | targetType | damage | healAmount | buffId | debuffId | duration | upgradedTileRank |
|----|-----------------|------|----------|------------|------------|:------:|:----------:|--------|----------|:--------:|:----------------:|
| char_a_atk_01 | char_a | 참격 | NORMAL | ATTACK | SINGLE_ENEMY | 12 | | | | | |
| char_a_atk_02 | char_a | 연참 | ENHANCED | ATTACK | ALL_ENEMIES | 10 | | | | | NORMAL |
| char_b_heal_01 | char_b | 응급처치 | NORMAL | HEAL | SINGLE_ALLY | | 15 | | | | |
| char_c_buff_01 | char_c | 방어 태세 | ENHANCED | BUFF | ALL_ALLIES | | | shield_up | | 2 | |

**변환 규칙**: `damage`, `healAmount`, `buffId`, `debuffId`, `duration` → `effectParams` 객체로 묶음. 빈 칸은 `undefined`.

---

### Monster

행동 패턴은 [MonsterAction](#monsteraction) 시트에 별도 입력하며 변환 시 병합된다.

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `id` | string | `goblin_01` | 적 식별자 (PK) |
| `displayName` | string | `고블린 검사` | 화면 표시 이름 |
| `enemyType` | enum | `NORMAL` | `NORMAL` / `ELITE` / `BOSS` |
| `maxHp` | number | `40` | 최대 체력 |
| `initialShield` | number | `0` | 전투 시작 방어막. `0`이면 없음 |
| `initialCount` | number | `3` | 페이즈 1 기본 카운트 초기값 |

**예시 행**

| id | displayName | enemyType | maxHp | initialShield | initialCount |
|----|-------------|-----------|:-----:|:-------------:|:------------:|
| goblin_01 | 고블린 검사 | NORMAL | 40 | 0 | 3 |
| orc_mage_01 | 오크 마법사 | ELITE | 80 | 0 | 2 |
| dragon_boss_01 | 보스 드래곤 | BOSS | 500 | 0 | 4 |

---

### MonsterAction

적의 모든 행동을 정의한다. 변환 시 `monsterId` + `phase`로 그룹화하여 `actionPattern`을 구성하고, `Monster` JSON에 병합된다.

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `monsterId` | string | `dragon_boss_01` | `Monster.id` 참조 (FK) |
| `phase` | number | `1` | 소속 페이즈. `1` = 기본 패턴, `2 이상` = 해당 BossPhase 패턴 |
| `role` | enum | `action` | 행동 역할. 아래 표 참조 |
| `orderIndex` | number | `0` | `role = action`일 때 순환 순서. 0부터 시작. 나머지 role은 빈 칸 |
| `actionType` | enum | `ATTACK_AOE` | `ATTACK_SINGLE` / `ATTACK_AOE` / `DEBUFF` / `BUFF_SELF` |
| `targetMode` | enum | `ALL` | `SINGLE` / `ALL`. `ATTACK_AOE`·`BUFF_SELF`는 무시됨 |
| `power` | number | `15` | 피해량 또는 효과 수치 |
| `effectId` | string | `defense_down` | `DEBUFF`·`BUFF_SELF` 전용. 빈 칸이면 없음 |
| `effectDuration` | number | `2` | 효과 지속 횟수. 빈 칸이면 영구 |
| `resetCount` | number | `4` | 이 행동 실행 후 카운트 리셋값 |
| `scheduledTurns` | string | `5,10,15` | 특정 턴에만 발동. 쉼표 구분. 빈 칸이면 기본 순환에 포함 |

**role 종류**

| 값 | 설명 | `orderIndex` |
|----|------|:------------:|
| `action` | 순환 목록의 일반 행동 | 필수 |
| `default` | 스킬 없는 턴의 기본 행동 | 빈 칸 |
| `transition` | 페이즈 전환 즉시 발동 행동 (`phase 2` 이상에서만 유효) | 빈 칸 |

**예시 행**

| monsterId | phase | role | orderIndex | actionType | targetMode | power | effectId | effectDuration | resetCount | scheduledTurns |
|-----------|:-----:|------|:----------:|------------|:----------:|:-----:|----------|:--------------:|:----------:|---------------|
| goblin_01 | 1 | action | 0 | ATTACK_SINGLE | SINGLE | 8 | | | 3 | |
| goblin_01 | 1 | action | 1 | ATTACK_SINGLE | SINGLE | 8 | | | 3 | |
| goblin_01 | 1 | default | | ATTACK_SINGLE | SINGLE | 8 | | | 3 | |
| orc_mage_01 | 1 | action | 0 | ATTACK_SINGLE | SINGLE | 8 | | | 3 | |
| orc_mage_01 | 1 | action | 1 | ATTACK_SINGLE | SINGLE | 8 | | | 3 | |
| orc_mage_01 | 1 | action | 2 | ATTACK_AOE | ALL | 12 | | | 3 | |
| orc_mage_01 | 1 | default | | ATTACK_SINGLE | SINGLE | 8 | | | 3 | |
| orc_mage_01 | 1 | action | | DEBUFF | ALL | 5 | defense_down | 2 | 3 | 5,10,15 |
| dragon_boss_01 | 1 | action | 0 | ATTACK_SINGLE | SINGLE | 20 | | | 4 | |
| dragon_boss_01 | 1 | action | 1 | ATTACK_AOE | ALL | 15 | | | 4 | |
| dragon_boss_01 | 1 | action | 2 | BUFF_SELF | SINGLE | 40 | shield_gain | | 4 | |
| dragon_boss_01 | 1 | default | | ATTACK_SINGLE | SINGLE | 20 | | | 4 | |
| dragon_boss_01 | 2 | transition | | ATTACK_AOE | ALL | 30 | | | 3 | |
| dragon_boss_01 | 2 | action | 0 | ATTACK_AOE | ALL | 20 | | | 3 | |
| dragon_boss_01 | 2 | action | 1 | ATTACK_AOE | ALL | 20 | defense_down | 2 | 3 | |
| dragon_boss_01 | 2 | default | | ATTACK_AOE | ALL | 20 | | | 3 | |
| dragon_boss_01 | 3 | action | 0 | ATTACK_AOE | ALL | 25 | | | 2 | |
| dragon_boss_01 | 3 | action | 1 | ATTACK_AOE | ALL | 30 | | | 2 | |
| dragon_boss_01 | 3 | default | | ATTACK_AOE | ALL | 25 | | | 2 | |

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
`initialCount`는 각 페이즈의 `ActionPattern.initialCount`로 사용된다.

| 컬럼 | 타입 | 예시 | 설명 |
|------|------|------|------|
| `monsterId` | string | `dragon_boss_01` | `Monster.id` 참조 (FK). `enemyType = BOSS`만 유효 |
| `phaseNumber` | number | `2` | 페이즈 번호. 2 이상 (1은 Monster 기본 패턴) |
| `triggerValue` | number | `0.5` | 전환 트리거 체력 비율. `0.0 초과 ~ 1.0 미만` |
| `initialCount` | number | `3` | 이 페이즈의 카운트 초기값 |

**예시 행**

| monsterId | phaseNumber | triggerValue | initialCount |
|-----------|:-----------:|:------------:|:------------:|
| dragon_boss_01 | 2 | 0.5 | 3 |
| dragon_boss_01 | 3 | 0.25 | 2 |

**제약 조건**: `triggerValue` 내림차순 정렬 권장. `phaseNumber`는 해당 monsterId의 MonsterAction에 같은 `phase` 값의 행이 존재해야 한다.

---

## 변환 스크립트 입출력 요약

```
입력  : 시트 7개 (CSV 또는 Google Sheets API)
출력  : stages.json / characters.json / cards.json / monsters.json

stages.json    ← Stage + StageMonster 병합
characters.json← Character
cards.json     ← Card (effectParams 객체로 조립)
monsters.json  ← Monster + MonsterAction + BossPhase 병합
```

**병합 순서**

```
1. BossPhase 행을 monsterId로 그룹화 → phaseThresholds[] 초안 구성
2. MonsterAction 행을 monsterId + phase로 그룹화 → actionPattern 구성
   phase = 1  → Monster.actionPattern
   phase >= 2 → 해당 PhaseThreshold.actionPattern + transitionAction
3. Monster 행 + 위 결과 병합 → monsters.json
4. StageMonster 행을 stageId로 그룹화 → Stage.monsters[] 구성
5. Stage 행 + 위 결과 병합 → stages.json
```
