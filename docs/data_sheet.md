# 기획 테이블 시트

<small style="color:#7070a0;font-family:'Roboto Mono',monospace;background:rgba(255,255,255,0.05);padding:2px 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.08);">📄 docs/data_sheet.md</small>

[📋 구글 시트 열기](https://docs.google.com/spreadsheets/d/1SRpzgAzrPeH7GlxGkBo3hs83RiYDknOo3uXKJkeRubM/edit){ .md-button .md-button--primary target="_blank" }

<button id="btn-build-data" class="md-button" onclick="buildAndDownloadData()">📦 JSON 전체 다운로드</button>

### JSON 파일 구성

다운로드 버튼은 아래 8개 파일을 `gamedata.zip`으로 압축 제공한다.

| JSON 파일 | 원본 시트 | JSON 키 |
|-----------|-----------|---------|
| `strings.json` | `StringTBL_KR` | (배열) |
| `metadata.json` | `CardTraitTBL`, `CardTeamTBL`, `CardRarityTBL`, `CardIntentTBL` | `traits`, `teams`, `rarities`, `intents` |
| `abilities.json` | `CardAbilityTBL` | (배열) |
| `statuses.json` | `CardStatusTBL` | (배열) |
| `cards.json` | `CardTBL` | (배열) |
| `champions.json` | `ChampionTBL` | (배열) |
| `enemies.json` | `EnemyTBL`, `StartCardDeckTBL` | `enemies`, `decks` |
| `maps.json` | `MapTBL`, `MapRandomEventTBL`, `MapFixedWidthTBL`, `MapFixedEventTBL`, `MapEvent_BattleTBL`, `ExtraEnemyTBL`, `MapEvent_ChoiceTBL`, `MapEvent_TradeTBL`, `MapEvent_EffectTBL`, `MapEvent_OtherTBL`, `MapEvent_ShopTBL` | `maps`, `randomEvents`, `fixedWidths`, `fixedEvents`, `battleEvents`, `extraEnemies`, `choiceEvents`, `tradeEvents`, `effectEvents`, `otherEvents`, `shopEvents` |

---

## 시트 구성 개요

Google Sheets 내 **23개 시트(테이블)**를 5개 그룹으로 분류한다. 각 시트는 하나의 데이터 테이블이다.

| 그룹 | 시트 수 | 시트 목록 |
|------|:-------:|-----------|
| [문자열](#1-문자열) | 1 | `StringTBL_KR` |
| [카드 시스템](#2-카드-시스템) | 7 | `CardAbilityTBL`, `CardStatusTBL`, `CardTraitTBL`, `CardTeamTBL`, `CardRarityTBL`, `CardIntentTBL`, `CardTBL` |
| [캐릭터·적](#3-캐릭터적) | 3 | `ChampionTBL`, `EnemyTBL`, `StartCardDeckTBL` |
| [맵·이벤트](#4-맵이벤트) | 11 | `MapTBL`, `MapRandomEventTBL`, `MapFixedWidthTBL`, `MapFixedEventTBL`, `MapEvent_BattleTBL`, `MapEvent_ChoiceTBL`, `MapEvent_TradeTBL`, `MapEvent_EffectTBL`, `MapEvent_OtherTBL`, `MapEvent_ShopTBL`, `ExtraEnemyTBL` |
| [공통](#5-공통) | 1 | `GlobalEnum` |

### 테이블 정의

| 테이블 | 정의 |
|--------|------|
| `StringTBL_KR` | 게임 내 모든 화면 표시 텍스트를 UID 키로 보관하는 문자열 사전. 다국어 확장 시 `StringTBL_EN` 등을 동일 UID로 추가한다. |
| `CardAbilityTBL` | 카드 또는 적이 발동하는 개별 효과 단위 정의. 트리거·대상·조건·효과를 선언적으로 기술하며, 하나의 카드는 최대 4개 어빌리티를 참조할 수 있다. |
| `CardStatusTBL` | 버프·디버프 상태이상 정의. 효과 종류(StatusEffect enum), 지속 방식(StatusDuration enum), 표시 정보를 관리한다. |
| `CardTraitTBL` | 카드에 붙는 태그 특성 정의. 시너지 조건이나 어빌리티 트리거 필터(`is_skill`, `is_attack` 등)에서 참조된다. |
| `CardTeamTBL` | 카드와 챔피언이 속하는 진영(팀) 정의. 팀별 시너지 발동 및 덱 구성 제약의 기준 단위. |
| `CardRarityTBL` | 카드 희귀도 등급 정의. 상점 진열 확률(`Probability`)과 보상 카드 필터링에 사용된다. |
| `CardIntentTBL` | 적이 카드를 사용할 때 플레이어에게 보여주는 행동 예고(의도) 아이콘 정의. 우선순위와 표시 여부를 제어한다. |
| `CardTBL` | 플레이어·적이 사용하는 카드 전체 정의. 2048 전용 필드 `tileRank`·`upgradedTileRank`로 발동에 필요한 타일 등급을 지정한다. |
| `ChampionTBL` | 플레이어가 파티에 편성하는 챔피언 정의. HP·Speed·Hand·Energy 4종 스탯과 레벨업 증분값, 시작 덱을 포함한다. |
| `EnemyTBL` | 전투에 등장하는 적 정의. 챔피언과 동일한 스탯 구조를 사용하며, `CardDeck`으로 행동 카드 덱을 참조한다. |
| `StartCardDeckTBL` | 챔피언 시작 덱 또는 적 행동 덱을 정의. 최대 10개 슬롯에 카드 ID를 배치하며, 빈 슬롯은 덱에 포함되지 않는다. |
| `MapTBL` | 로그라이트 런에서 생성되는 맵의 구조 파라미터(깊이·너비·분기 확률) 및 이벤트 풀 연결 정의. |
| `MapRandomEventTBL` | 맵 노드에 랜덤 배치될 이벤트 풀 목록. 동일 맵 내 이벤트 중복 방지를 위해 풀 방식으로 관리한다. |
| `MapFixedEventTBL` | 특정 깊이(층)에 강제 배치되는 고정 이벤트 정의. 보스 방·중요 이벤트 위치를 고정할 때 사용한다. |
| `MapFixedWidthTBL` | 맵의 깊이(층)별 고정 노드 너비를 정의. 특정 층에서 분기 없이 너비를 강제 지정할 때 사용한다. |
| `MapEvent_BattleTBL` | 전투 이벤트 정의. 등장 적 구성·레벨·보상(골드·경험치·카드)을 포함한다. |
| `MapEvent_ChoiceTBL` | 선택지 이벤트 정의. 최대 4개 선택지를 제공하며, 각 선택은 `MapEvent_TradeTBL`이나 `MapEvent_EffectTBL`로 연결된다. |
| `MapEvent_TradeTBL` | 골드·체력을 소비하고 골드·경험치·회복을 얻는 교역 이벤트 단위 정의. |
| `MapEvent_EffectTBL` | 즉시 효과를 발동하는 이벤트 단위 정의. 선택지 결과나 고정 이벤트에서 연계 호출되는 경우가 많다. |
| `MapEvent_OtherTBL` | 전투·선택·교역·효과에 해당하지 않는 특수 이벤트(보상 획득, 세계 상태 변경, 상점, 카드 강화 등) 정의. |
| `MapEvent_ShopTBL` | 카드·아이템을 사고파는 상점 노드 정의. 구매·판매 배율과 진열 수량을 제어한다. |
| `ExtraEnemyTBL` | 전투 이벤트에서 파티 인원 수에 따라 조건부로 추가되는 보조 적 세트 정의. |
| `GlobalEnum` | 코드와 시트가 공유하는 숫자 enum 값 일람. `AbilityTrigger`, `AbilityTarget`, `StatusEffect`, `MapEventType`, `TileRank` 등 모든 enum 그룹을 단일 테이블로 관리한다. |

스키마 타입 정의 상세는 [스키마 설계](schema.md)를 참조한다.

---

## StringTBL UID 범위

| 범위 | 용도 |
|------|------|
| `10000~` | 상태이상 이름·설명 / 특성 이름·설명 / 팀 이름 / 희귀도 이름 / 의도 이름·설명 |
| `200000~` | 카드 이름 및 설명 |
| `260000~` | 챔피언(플레이어 캐릭터) 이름 |
| `261000~` | 적 이름 |
| `270000~` | 이벤트 설명 문자열 (선택지·교역·효과 이벤트 등) |

---

## TileRank 값 대응표

카드 발동에 요구되는 2048 보드 타일 숫자. `CardTBL.tileRank` 및 `CardTBL.upgradedTileRank`에 사용한다.

| TileRank | 타일 숫자 | 비고 |
|:--------:|:---------:|------|
| `A` | **2** | 초기 생성 타일. 모든 보드에서 기본 등장 |
| `B` | **4** | 기본 카드 발동 등급 |
| `C` | **8** | 일반 전투 주력 등급 |
| `D` | **16** | 강화 카드 등급 |
| `E` | **32** | 강력 카드 등급 |
| `F` | **64** | 필살 카드 등급. 보드 최적화 필요 |

---

## 1. 문자열

### StringTBL_KR

모든 화면 표시 텍스트를 UID로 참조한다. 다국어 대응 시 `StringTBL_EN` 등을 동일 UID로 추가한다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 시트 행 식별자 |
| `UID` | `number` | 문자열 고유 식별자. 범위별 용도 구분 (위 UID 범위표 참조) |
| `KR` | `string` | 한국어 문자열 |

**참조 관계**

- 카드·챔피언·적·상태이상·특성·팀·희귀도·의도·이벤트 모든 시트의 `TitleStringID`, `DescStringID`에서 참조

**예시**

| Name | UID | KR |
|------|-----|----|
| str_status_vulnerable_title | 10001 | 취약 |
| str_status_vulnerable_desc | 10002 | 받는 피해가 50% 증가합니다 |
| str_trait_swift_title | 10101 | 신속 |
| str_card_shield_strike_title | 200001 | 방패 강타 |
| str_card_shield_strike_desc | 200002 | 적에게 22의 피해를 입히고 아군 전체에게 방어막 4를 부여합니다 |
| str_champion_kestrel | 260001 | 케스트럴 (Kestrel) |
| str_enemy_warden | 261001 | 제1감시자 |
| str_event_ruin_encounter | 270001 | 폐허에서 낡은 상자를 발견했다. 열어볼까? |

---

## 2. 카드 시스템

### CardAbilityTBL

카드 또는 적이 사용하는 개별 효과 단위. 하나의 카드는 `Ability1~4`를 통해 최대 4개의 어빌리티를 참조할 수 있다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 어빌리티 식별자 PK. 예: `kestrel_shield_strike` |
| `Type` | `string` | `Attacks` \| `Heals` \| `Buffs` \| `Debuffs` \| `Passives` \| `Enemy` |
| `ID` | `number` | 고유 ID |
| `SelectTrigger` | `string` | 트리거 레이블. GlobalEnum.AbilityTrigger 참조 |
| `Trigger` | `number` | 트리거 enum 값 |
| `TrigCond1~3` | `string?` | 트리거 발동 추가 조건 |
| `SelectTarget` | `string` | 대상 레이블. GlobalEnum.AbilityTarget 참조 |
| `Target` | `number` | 대상 enum 값 |
| `TgtCond1~3` | `string?` | 대상 필터 조건 |
| `Effect1` | `string?` | 주 효과. 예: `damage`, `heal`, `add_shield` |
| `Effect2` | `string?` | 보조 효과 |
| `Status1` | `string?` | 적용 상태이상. `CardStatusTBL.Name` 참조 |
| `Status2` | `string?` | 두 번째 상태이상 |
| `EffectValue` | `number?` | 효과 수치 |
| `UpgradeValue` | `number?` | 강화 시 effectValue 증가량 |
| `SelectUpBonus` | `string?` | 강화 보너스 타입 레이블 |
| `UpgradeBonus` | `number?` | 강화 보너스 수치 |
| `ChainAbility` | `string?` | 연쇄 발동 어빌리티 `Name` |
| `TargetFx` | `string?` | 효과 연출 키. 예: `SlashFX`, `AoeFX`, `CurseFX` |

**참조 관계**

- `Status1`, `Status2` → `CardStatusTBL.Name`
- `ChainAbility` → `CardAbilityTBL.Name` (자기 참조)
- `CardTBL.ability1~4`에서 참조됨
- `EnemyTBL.ability1`에서 참조됨

**예시**

| Name | Type | ID | SelectTrigger | Trigger | SelectTarget | Target | TgtCond1 | effect1 | effectValue | upgradeValue | status1 | TargetFx |
|------|------|----|---------------|---------|--------------|--------|----------|---------|:-----------:|:------------:|---------|---------|
| kestrel_shield_strike | Attacks | 1001 | OnPlay | 10 | PlayTarget | 20 | is_not_allied | damage | 22 | 3 | | SlashFX |
| kestrel_rally | Buffs | 1002 | OnPlay | 10 | AllCharacters | 7 | is_allied | add_shield | 4 | 1 | | ShieldFX |
| cipher_vuln_analysis | Debuffs | 1014 | OnPlay | 10 | PlayTarget | 20 | is_not_allied | | | | vulnerable | CurseFX |
| enemy_atk_warden_s22 | Enemy | 2001 | OnPlay | 10 | PlayTarget | 20 | is_character | damage | 22 | | | SlashFX |

---

### CardStatusTBL

버프·디버프 상태이상 정의. 각 상태이상의 효과 종류, 지속 방식, 표시 정보를 관리한다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 상태이상 식별자 PK. 예: `vulnerable`, `slow` |
| `ID` | `number` | 고유 ID |
| `SelectEffect` | `string` | GlobalEnum.StatusEffect 레이블 |
| `StatusEffect` | `number` | StatusEffect enum 값 |
| `SelectDuration` | `string` | GlobalEnum.StatusDuration 레이블 |
| `StatusDuration` | `number` | `Persistant=0`, `OneTurn=2`, `AutoReduce=10` |
| `IsNegative` | `boolean` | `TRUE`=디버프, `FALSE`=버프 |
| `TitleStringID` | `number` | StringTBL UID (10000~) |
| `DescStringID` | `number` | StringTBL UID (10000~) |
| `Icon` | `string` | 아이콘 에셋 키 |
| `Fx` | `string?` | 적용 연출 키 |
| `Animation` | `string?` | 적용 애니메이션 키 |

**참조 관계**

- `TitleStringID`, `DescStringID` → `StringTBL_KR.UID`
- `CardAbilityTBL.status1`, `Status2`에서 참조됨

**예시**

| Name | ID | SelectEffect | statusEffect | SelectDuration | statusDuration | isNegative | titleStringId | descStringId |
|------|----|--------------|:------------:|----------------|:--------------:|:----------:|:-------------:|:------------:|
| attack_power | 101 | AttackPower | 10 | Persistant | 0 | FALSE | 10001 | 10002 |
| armor | 102 | Armor | 15 | Persistant | 0 | FALSE | 10003 | 10004 |
| vulnerable | 201 | Vulnerable | 32 | AutoReduce | 10 | TRUE | 10011 | 10012 |
| slow | 202 | SlowDown | 70 | AutoReduce | 10 | TRUE | 10021 | 10022 |
| bleed | 203 | Bleed | 44 | AutoReduce | 10 | TRUE | 10031 | 10032 |

---

### CardTraitTBL

카드의 특성 태그. 특정 시너지 조건이나 상호작용 트리거에 사용한다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 특성 식별자. 예: `swift`, `heavy`, `arcane` |
| `ID` | `number` | 고유 ID |
| `TitleStringID` | `number` | StringTBL UID (10000~). 특성 표시 이름 |
| `DescStringID` | `number` | StringTBL UID (10000~). 특성 설명 |
| `Icon` | `string` | 아이콘 에셋 키 |

**참조 관계**

- `TitleStringID`, `DescStringID` → `StringTBL_KR.UID`
- `CardTBL.trait1`, `Trait2`에서 참조됨
- `EnemyTBL.trait1`에서 참조됨

**예시**

| Name | ID | titleStringId | descStringId | icon |
|------|----|:-------------:|:------------:|------|
| swift | 101 | 10101 | 10102 | icon_trait_swift |
| heavy | 102 | 10103 | 10104 | icon_trait_heavy |
| arcane | 103 | 10105 | 10106 | icon_trait_arcane |
| sentinel | 104 | 10107 | 10108 | icon_trait_sentinel |

---

### CardTeamTBL

카드 및 챔피언이 속한 팀(진영). 팀별로 시너지나 제약이 발동될 수 있다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 팀 식별자. 예: `vanguard`, `cipher`, `wanderer` |
| `ID` | `number` | 고유 ID |
| `TitleStringID` | `number` | StringTBL UID (10000~). 팀 표시 이름 |
| `Icon` | `string` | 팀 아이콘 에셋 키 |
| `Color` | `string` | 팀 대표 색상. 16진수 코드. 예: `#4A90D9` |

**참조 관계**

- `TitleStringID` → `StringTBL_KR.UID`
- `CardTBL.team`, `ChampionTBL.team`에서 참조됨

**예시**

| Name | ID | titleStringId | icon | color |
|------|----|:-------------:|------|-------|
| vanguard | 101 | 10201 | icon_team_vanguard | #4A90D9 |
| cipher | 102 | 10202 | icon_team_cipher | #9B59B6 |
| wanderer | 103 | 10203 | icon_team_wanderer | #E67E22 |
| warden | 104 | 10204 | icon_team_warden | #C0392B |

---

### CardRarityTBL

카드 희귀도 등급. 상점 출현 확률과 UI 표시에 사용한다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 희귀도 식별자. 예: `common`, `rare`, `epic` |
| `ID` | `number` | 고유 ID |
| `TitleStringID` | `number` | StringTBL UID (10000~). 희귀도 표시 이름 |
| `Icon` | `string` | 희귀도 아이콘 에셋 키 |
| `Probability` | `number` | 카드 보상 선택지 등장 가중치 (0.0~1.0) |

**참조 관계**

- `TitleStringID` → `StringTBL_KR.UID`
- `CardTBL.rarity`에서 참조됨
- `MapEvent_BattleTBL.CardRarity`에서 참조됨

**예시**

| Name | ID | titleStringId | icon | probability |
|------|----|:-------------:|------|:-----------:|
| common | 101 | 10301 | icon_rarity_common | 0.60 |
| rare | 102 | 10302 | icon_rarity_rare | 0.30 |
| epic | 103 | 10303 | icon_rarity_epic | 0.08 |
| legendary | 104 | 10304 | icon_rarity_legendary | 0.02 |

---

### CardIntentTBL

적 카드 사용 시 플레이어에게 표시되는 행동 예고(의도) 아이콘 정의.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 의도 식별자. 예: `intent_attack`, `intent_defend`, `intent_buff` |
| `ID` | `number` | 고유 ID |
| `IsShow` | `boolean` | UI에 의도 표시 여부. `FALSE`이면 숨김 (기습 공격 등) |
| `Priority` | `number` | 복수 의도 충돌 시 표시 우선순위. 값이 낮을수록 우선 |
| `TitleStringID` | `number` | StringTBL UID (10000~). 의도 이름 |
| `DescStringID` | `number` | StringTBL UID (10000~). 의도 설명 |
| `Icon` | `string` | 의도 아이콘 에셋 키 |

**참조 관계**

- `TitleStringID`, `DescStringID` → `StringTBL_KR.UID`
- `CardTBL.intent`에서 참조됨

**예시**

| Name | ID | isShow | priority | titleStringId | descStringId | icon |
|------|----|:------:|:--------:|:-------------:|:------------:|------|
| intent_attack | 101 | TRUE | 10 | 10401 | 10402 | icon_intent_attack |
| intent_attack_heavy | 102 | TRUE | 10 | 10403 | 10404 | icon_intent_attack_heavy |
| intent_defend | 103 | TRUE | 20 | 10405 | 10406 | icon_intent_defend |
| intent_buff | 104 | TRUE | 30 | 10407 | 10408 | icon_intent_buff |
| intent_unknown | 105 | FALSE | 99 | 10409 | 10410 | icon_intent_unknown |

---

### CardTBL

플레이어와 적이 사용하는 카드 전체를 정의한다. `tileRank`와 `upgradedTileRank`는 2048 보드 메커니즘 전용 필드이다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Type` | `string` | 카드 그룹명. 예: `Adventurer`, `Enemies`, `Neutral` |
| `ID` | `string` | 카드 식별자 PK. 예: `aggressive_stance` |
| `TitleStringID` | `number` | StringTBL UID. 카드 표시 이름 |
| `DescStringID` | `number` | StringTBL UID. 카드 설명 |
| `ArtIcon` | `string` | 카드 아이콘 에셋 키 |
| `ArtFull` | `string` | 카드 풀샷 이미지 에셋 키 |
| `SelectCardType` | `string` | CardType 선택 레이블. GlobalEnum.CardType 참조 |
| `CardType` | `number` | 카드 타입 enum 값. `Skill=20`, `Power=30` |
| `SelectItemType` | `string` | ItemType 선택 레이블 |
| `ItemType` | `number` | 아이템 타입 enum 값. `None=0`, `Consumable=22`, `Card=24`, `Passive=26`, `Quest=20` |
| `Team` | `string` | `CardTeamTBL.ID` 참조. 소속 팀 |
| `Rarity` | `string` | `CardRarityTBL.ID` 참조. 희귀도 |
| `Mana` | `number` | 발동 마나 비용 |
| `Trait1` | `string?` | `CardTraitTBL.ID` 참조. 첫 번째 특성 |
| `Trait2` | `string?` | `CardTraitTBL.ID` 참조. 두 번째 특성. 공란 가능 |
| `Ability1` | `string` | `CardAbilityTBL.ID` 참조. 주 효과 |
| `Ability2~4` | `string?` | 추가 어빌리티. 공란 가능 |
| `UpgradeMax` | `number` | 최대 강화 횟수 |
| `UpgradeMana` | `number?` | 강화 후 마나 비용. `-1`이면 변경 없음 |
| `ShopCost` | `number` | 상점 구매 가격 (골드) |
| `Intent` | `string?` | `CardIntentTBL.ID` 참조. 적 사용 시 표시할 의도 |
| `SpawnFx` | `string?` | 카드 등장 이펙트 키 |
| `SpawnAudio` | `string?` | 카드 등장 사운드 키 |
| `CasterAnim` | `string?` | 시전 애니메이션 키 |
| `TargetAnim` | `string?` | 대상 애니메이션 키 |
| `SelectAvailability` | `string?` | 사용가능 조건 레이블 |
| `Availability` | `string?` | 사용가능 조건 값. `Available` 또는 조건 문자열 |

**참조 관계**

- `Team` → `CardTeamTBL.ID`
- `Rarity` → `CardRarityTBL.ID`
- `Trait1`, `Trait2` → `CardTraitTBL.ID`
- `Ability1~4` → `CardAbilityTBL.ID`
- `Intent` → `CardIntentTBL.ID`
- `StartCardDeckTBL.Slot1~10`에서 참조됨
- `ChampionTBL.RewardCard1`, `RewardCard2`에서 참조됨

**예시**

| Type | ID | TitleStringID | CardType | Team | Rarity | Mana | Trait1 | Ability1 | Ability2 | UpgradeMax | ShopCost | Intent |
|------|----|:-------------:|:--------:|------|--------|:----:|--------|----------|----------|:----------:|:--------:|--------|
| Adventurer | aggressive_stance | 200000 | 20 | adventurer | common | 0 | skill | gain_courageous2 | gain_weak2 | 3 | 100 | |
| Adventurer | prudent_attack | 200018 | 20 | adventurer | common | 1 | attack | attack_damage2 | gain_shield2 | 3 | 100 | |
| Enemies | bandit_backstab | 220000 | 20 | enemies | common | 1 | attack | enemy_damage5_back | | 3 | 0 | intent_attack |
| Neutral | defend | 240006 | 20 | neutral | starter | 1 | basic | gain_shield3 | | 3 | 100 | |

---

## 3. 캐릭터·적

### ChampionTBL

플레이어가 파티에 편성하는 챔피언 캐릭터. 스탯 체계는 HP·Speed·Hand·Energy 4종으로 구성되며, 레벨업 시 `LvUp*` 값만큼 증가한다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 챔피언 식별자 PK |
| `ID` | `number` | 고유 ID |
| `TitleStringID` | `number` | StringTBL UID (260000~). 챔피언 표시 이름 |
| `ArtFull` | `string` | 챔피언 풀샷 이미지 에셋 키 |
| `ArtPortrait` | `string` | 챔피언 초상화 이미지 에셋 키 |
| `Prefab` | `string` | 챔피언 프리팹 에셋 키 |
| `HP` | `number` | 초기 최대 체력 |
| `Speed` | `number` | 초기 행동 속도. 낮을수록 먼저 행동 |
| `Hand` | `number` | 초기 손패 최대 장수 |
| `Energy` | `number` | 초기 턴당 최대 에너지 |
| `LvUpHP` | `number` | 레벨업당 체력 증가량 |
| `LvUpSpeed` | `number` | 레벨업당 속도 증가량 |
| `LvUpHand` | `number` | 레벨업당 손패 증가량 |
| `LvUpEnergy` | `number` | 레벨업당 에너지 증가량 |
| `Team` | `string` | `CardTeamTBL.Name` 참조. 소속 팀 |
| `StartDeck` | `string` | `StartCardDeckTBL.Name` 참조. 런 시작 초기 덱 |
| `RewardCard1` | `string?` | `CardTBL.Name` 참조. 전투 후 보상 카드 후보 1 |
| `RewardCard2` | `string?` | `CardTBL.Name` 참조. 전투 후 보상 카드 후보 2 |

**참조 관계**

- `TitleStringID` → `StringTBL_KR.UID`
- `Team` → `CardTeamTBL.Name`
- `StartDeck` → `StartCardDeckTBL.Name`
- `RewardCard1`, `RewardCard2` → `CardTBL.Name`

**예시**

| Name | ID | titleStringId | hp | speed | hand | energy | LvUpHP | LvUpSpeed | LvUpHand | LvUpEnergy | team | StartDeck |
|------|----|:-------------:|:--:|:-----:|:----:|:------:|:------:|:---------:|:--------:|:----------:|------|-----------|
| kestrel | 1001 | 260001 | 80 | 3 | 5 | 3 | 8 | 0 | 0 | 1 | vanguard | deck_kestrel_start |
| cipher | 1002 | 260002 | 60 | 2 | 6 | 4 | 5 | 0 | 1 | 0 | cipher | deck_cipher_start |
| wanderer | 1003 | 260003 | 70 | 3 | 5 | 3 | 6 | 1 | 0 | 0 | wanderer | deck_wanderer_start |

---

### EnemyTBL

전투에 등장하는 적. 챔피언과 동일한 스탯 구조를 사용하며, `CardDeck`을 통해 행동 카드를 참조한다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 적 식별자 PK |
| `ID` | `number` | 고유 ID |
| `TitleStringID` | `number` | StringTBL UID (261000~). 적 표시 이름 |
| `ArtFull` | `string` | 적 풀샷 이미지 에셋 키 |
| `ArtPortrait` | `string` | 적 초상화 이미지 에셋 키 |
| `Prefab` | `string` | 적 프리팹 에셋 키 |
| `HP` | `number` | 최대 체력 |
| `Speed` | `number` | 행동 속도 |
| `Hand` | `number` | 손패 최대 장수 |
| `Energy` | `number` | 턴당 최대 에너지 |
| `LvUpMax` | `number` | 최대 레벨업 횟수. 전투 이벤트 `EnemyLevel`에 따라 적용 |
| `LvUpHP` | `number` | 레벨업당 체력 증가량 |
| `LvUpSpeed` | `number` | 레벨업당 속도 증가량 |
| `LvUpHand` | `number` | 레벨업당 손패 증가량 |
| `LvUpEnergy` | `number` | 레벨업당 에너지 증가량 |
| `Behavior` | `string` | 행동 AI 패턴 식별자 |
| `Trait1` | `string?` | `CardTraitTBL.Name` 참조. 특성 태그 |
| `Ability1` | `string?` | `CardAbilityTBL.Name` 참조. 고유 패시브 어빌리티 |
| `CardDeck` | `string` | `StartCardDeckTBL.Name` 참조. 행동에 사용하는 카드 덱 |
| `RewardGold` | `number` | 처치 시 획득 골드 |
| `RewardXP` | `number` | 처치 시 획득 경험치 |
| `SpawnFx` | `string?` | 전투 등장 연출 키 |

**참조 관계**

- `TitleStringID` → `StringTBL_KR.UID`
- `Trait1` → `CardTraitTBL.Name`
- `Ability1` → `CardAbilityTBL.Name`
- `CardDeck` → `StartCardDeckTBL.Name`
- `MapEvent_BattleTBL.enemy1~4`에서 참조됨

**예시**

| Name | ID | titleStringId | hp | speed | hand | energy | LvUpMax | LvUpHP | behavior | CardDeck | RewardGold | RewardXP |
|------|----|:-------------:|:--:|:-----:|:----:|:------:|:-------:|:------:|----------|----------|:----------:|:--------:|
| drone_guard | 2001 | 261001 | 30 | 4 | 3 | 2 | 5 | 5 | ai_aggressive | deck_drone_guard | 10 | 15 |
| warden_1st | 2101 | 261101 | 120 | 3 | 5 | 4 | 3 | 20 | ai_boss_phase | deck_warden_1st | 50 | 100 |

---

### StartCardDeckTBL

챔피언 시작 덱 또는 적 행동 카드 덱을 정의한다. 슬롯은 최대 10개이며, 공란 슬롯은 덱에 포함되지 않는다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 덱 식별자 PK |
| `Type` | `string` | `Champion` — 챔피언 시작 덱 / `Enemies` — 적 행동 덱 |
| `ID` | `number` | 고유 ID |
| `Slot1~Slot10` | `string?` | `CardTBL.Name` 참조. 각 슬롯의 카드. 공란이면 슬롯 없음 |

**참조 관계**

- `Slot1~10` → `CardTBL.Name`
- `ChampionTBL.StartDeck`에서 참조됨
- `EnemyTBL.CardDeck`에서 참조됨

**예시**

| Name | Type | ID | Slot1 | Slot2 | Slot3 | Slot4 | Slot5 | Slot6 |
|------|------|----|-------|-------|-------|-------|-------|-------|
| deck_kestrel_start | Champion | 5001 | kestrel_shield_strike | kestrel_shield_strike | kestrel_iron_wall | kestrel_rally | kestrel_basic_atk | |
| deck_cipher_start | Champion | 5002 | cipher_vuln_analysis | cipher_vuln_analysis | cipher_data_burst | cipher_observe | cipher_basic_atk | |
| deck_drone_guard | Enemies | 6001 | enemy_atk_drone_s12 | enemy_atk_drone_s12 | enemy_buff_drone | | | |

---

## 4. 맵·이벤트

### MapTBL

로그라이크 런에서 생성되는 맵의 구조 파라미터를 정의한다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 맵 식별자 PK |
| `ID` | `number` | 고유 ID |
| `TitleStringID` | `number` | StringTBL UID. 맵 표시 이름 |
| `MapScene` | `string` | 맵 배경 씬 에셋 키 |
| `BattleScene` | `string` | 전투 배경 씬 에셋 키 |
| `Depth` | `number` | 맵 세로 깊이 (층 수) |
| `WidthMin` | `number` | 층당 최소 노드 수 |
| `WidthMax` | `number` | 층당 최대 노드 수 |
| `ForkProbability` | `number` | 경로 분기 확률 (0.0~1.0) |
| `RandomEventID` | `string` | `MapRandomEventTBL.Name` 참조 |
| `FixedWidthID` | `string?` | `MapFixedWidthTBL.ID` 참조. 공란이면 고정 너비 없음 |
| `FixedEventID` | `string?` | `MapFixedEventTBL.ID` 참조. 공란이면 고정 이벤트 없음 |
| `MapTutorial` | `string?` | 튜토리얼 설정 키. 공란이면 일반 런 |

**참조 관계**

- `RandomEventID` → `MapRandomEventTBL.Name`
- `FixedWidthID` → `MapFixedWidthTBL.ID`
- `FixedEventID` → `MapFixedEventTBL.ID`

**예시**

| Name | ID | depth | WidthMin | WidthMax | ForkProbability | RandomEventID | FixedEventID |
|------|----|:-----:|:--------:|:--------:|:---------------:|---------------|--------------|
| map_chapter1 | 7001 | 12 | 2 | 4 | 0.35 | random_ch1 | fixed_ch1 |
| map_chapter1_hard | 7002 | 14 | 3 | 5 | 0.40 | random_ch1_hard | fixed_ch1 |

---

### MapRandomEventTBL

맵 노드에 랜덤 배치될 이벤트 풀을 정의한다. 동일 맵 내에서 같은 이벤트가 중복 배치되지 않도록 풀 방식으로 관리한다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 랜덤 이벤트 풀 식별자 |
| `ID` | `number` | 고유 ID |
| `SelectType` | `string` | 이벤트 유형 레이블. GlobalEnum.MapEventType 참조 |
| `type` | `string` | 이벤트 유형 enum 값 |
| `EventID` | `string` | 해당 유형의 이벤트 `Name` 참조 |

**참조 관계**

- `EventID` → 유형에 따라 `MapEvent_BattleTBL`, `MapEvent_ChoiceTBL`, `MapEvent_TradeTBL`, `MapEvent_EffectTBL`, `MapEvent_ShopTBL`, `MapEvent_OtherTBL` 중 하나의 `Name`
- `MapTBL.RandomEventID`에서 참조됨

---

### MapFixedWidthTBL

특정 깊이(층)의 노드 너비를 강제 지정한다. 분기 없이 단일 경로를 강제하거나 특정 층의 너비를 고정할 때 사용한다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `ID` | `number` | 고유 ID |
| `Depth1~12` | `number?` | 해당 깊이(층)의 강제 너비. `0` 또는 공란이면 MapTBL의 WidthMin~WidthMax 범위로 랜덤 생성 |

**참조 관계**

- `MapTBL.FixedWidthID`에서 참조됨

---

### MapFixedEventTBL

특정 깊이(층)에 고정 배치되는 이벤트를 정의한다. 보스 방이나 중요 이벤트 위치를 강제 고정할 때 사용한다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 고정 이벤트 세트 식별자 |
| `ID` | `number` | 고유 ID |
| `Depth` | `number` | 배치 깊이(층) |
| `IndexMin` | `number` | 배치 가능한 최소 노드 인덱스 |
| `IndexMax` | `number` | 배치 가능한 최대 노드 인덱스 |
| `EventID` | `string` | 배치할 이벤트 `Name` 참조 |

**참조 관계**

- `EventID` → 유형에 따라 각 `MapEvent_*TBL.Name`
- `MapTBL.FixedEventID`에서 참조됨

---

### MapEvent_BattleTBL

전투 이벤트. 등장 적 구성, 난이도(EnemyLevel), 보상을 정의한다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 전투 이벤트 식별자 PK |
| `ID` | `number` | 고유 ID |
| `Icon` | `string` | 맵 노드 표시 아이콘 에셋 키 |
| `DepthMin` | `number` | 등장 가능 최소 깊이 |
| `DepthMax` | `number` | 등장 가능 최대 깊이 |
| `EnemyLevel` | `number` | 적 레벨 오프셋. `EnemyTBL.LvUpMax` 범위 내 |
| `Enemy1~4` | `string?` | `EnemyTBL.Name` 참조. 등장 적. 공란이면 해당 슬롯 없음 |
| `ExtraEnemy` | `string?` | `ExtraEnemyTBL.Name` 참조. 조건부 추가 적 |
| `RewardGold` | `number` | 클리어 시 추가 골드 (적 처치 보상과 별개) |
| `RewardXP` | `number` | 클리어 시 경험치 |
| `IsRewardCards` | `boolean` | 카드 보상 제공 여부 |
| `CardRarity` | `string?` | `CardRarityTBL.Name` 참조. 카드 보상 희귀도 필터 |
| `IsRewardItem` | `boolean` | 아이템 보상 제공 여부 |
| `ItemRarity` | `string?` | `CardRarityTBL.ID` 참조. 아이템 보상 희귀도 필터 |
| `ItemTeam` | `string?` | `CardTeamTBL.ID` 참조. 아이템 보상 팀 필터 |
| `Tutorial` | `string?` | 튜토리얼 설정 키. 공란이면 일반 전투 |
| `WinEvent` | `string?` | 승리 시 연계 발동할 이벤트 `Name` |

**참조 관계**

- `Enemy1~4` → `EnemyTBL.Name`
- `ExtraEnemy` → `ExtraEnemyTBL.Name`
- `CardRarity` → `CardRarityTBL.Name`

**예시**

| Name | ID | DepthMin | DepthMax | EnemyLevel | enemy1 | enemy2 | rewardGold | rewardXP | IsRewardCards | CardRarity |
|------|----|:--------:|:--------:|:----------:|--------|--------|:----------:|:--------:|:-------------:|------------|
| battle_ch1_normal_1 | 8001 | 1 | 4 | 0 | drone_guard | drone_guard | 5 | 20 | TRUE | common |
| battle_ch1_elite_1 | 8011 | 5 | 9 | 1 | drone_guard | drone_guard | 15 | 40 | TRUE | rare |
| battle_ch1_boss | 8021 | 10 | 12 | 0 | warden_1st | | 30 | 80 | TRUE | epic |

---

### MapEvent_ChoiceTBL

플레이어가 선택지를 고르는 이벤트. 선택에 따라 `MapEvent_EffectTBL`이나 다른 이벤트가 연계된다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 선택지 이벤트 식별자 |
| `ID` | `number` | 고유 ID |
| `DepthMin` | `number` | 등장 가능 최소 깊이 |
| `DepthMax` | `number` | 등장 가능 최대 깊이 |
| `DescStringID` | `number` | StringTBL UID (270000~). 이벤트 설명 |
| `Choice1Title` | `string` | 선택지 1 제목 |
| `Choice1Desc` | `string?` | 선택지 1 설명 |
| `Choice1Effect` | `string` | 선택지 1 발동 효과. `MapEvent_EffectTBL.Name` 참조 |
| `Choice2~4Title/Desc/Effect` | `string?` | 선택지 2~4. 공란이면 해당 선택지 없음 |

**참조 관계**

- `DescStringID` → `StringTBL_KR.UID`
- `Choice*Effect` → `MapEvent_EffectTBL.Name`

**예시**

| Name | ID | DepthMin | DepthMax | DescStringID | Choice1Title | Choice1Effect | Choice2Title | Choice2Effect |
|------|----|:--------:|:--------:|:------------:|--------------|---------------|--------------|---------------|
| choice_ruin_box | 9001 | 1 | 12 | 270001 | 열어본다 | effect_ruin_box_open | 그냥 지나친다 | effect_nothing |

---

### MapEvent_TradeTBL

골드나 체력을 소비하고 이득을 얻는 교역 이벤트.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 교역 이벤트 식별자 |
| `ID` | `number` | 고유 ID |
| `Icon` | `string` | 맵 노드 표시 아이콘 에셋 키 |
| `SelectEventTarget` | `string` | 대상 레이블 |
| `EventTarget` | `string` | 이벤트 대상 식별자 |
| `SpendItem` | `string?` | 소비 아이템 ID. 공란이면 없음 |
| `SpendGold` | `number` | 소비 골드. `0`이면 없음 |
| `SpendHP` | `number` | 소비 체력. `0`이면 없음 |
| `GainGold` | `number` | 획득 골드 |
| `GainXP` | `number` | 획득 경험치 |
| `GainHeal` | `number` | 회복량. `0`이면 없음 |
| `GainItem1` | `string?` | 획득 아이템 ID 1 |
| `GainItem2` | `string?` | 획득 아이템 ID 2 |
| `GainItem3` | `string?` | 획득 아이템 ID 3 |
| `GainAlly` | `string?` | 획득 아군 ID. `EnemyTBL` 또는 `ChampionTBL` 참조 |
| `DescStringID` | `number` | StringTBL UID (270000~). 이벤트 설명 |

**예시**

| Name | ID | SpendGold | SpendHP | GainGold | GainXP | GainHeal | DescStringID |
|------|----|:---------:|:-------:|:--------:|:------:|:--------:|:------------:|
| trade_gold_for_heal | 9101 | 20 | 0 | 0 | 0 | 15 | 270101 |
| trade_hp_for_gold | 9102 | 0 | 10 | 25 | 0 | 0 | 270102 |

---

### MapEvent_EffectTBL

직접적인 효과를 발동하는 이벤트 단위. 다른 이벤트의 결과로 연계 호출되는 경우가 많다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 효과 이벤트 식별자 |
| `ID` | `number` | 고유 ID |
| `Icon` | `string` | 맵 노드 표시 아이콘 에셋 키 |
| `Condition1` | `string?` | 이벤트 발동 조건. 공란이면 무조건 발동 |
| `SelectEventTarget` | `string` | 대상 레이블 |
| `EventTarget` | `string` | 이벤트 대상 식별자 |
| `Effect1` | `string?` | 주 효과 |
| `Effect2` | `string?` | 보조 효과 |
| `Value` | `number?` | 효과 수치 |
| `ChainEventID` | `string?` | 연쇄 발동할 이벤트 `Name` |
| `DescStringID` | `number?` | StringTBL UID (270000~). 결과 설명 텍스트 |

---

### MapEvent_OtherTBL

전투·선택지·교역에 해당하지 않는 특수 이벤트 (보물 상자, 세계 상태 변경 등).

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 이벤트 식별자 |
| `ID` | `number` | 고유 ID |
| `SelectType` | `string` | 이벤트 유형 레이블. GlobalEnum.MapEventType 참조 |
| `EventType` | `string` | 이벤트 유형 enum 값 |
| `Icon` | `string` | 노드 표시 아이콘 에셋 키 |
| `Rarity` | `string?` | 희귀도. 이벤트 보상 등급에 영향 |
| `SelectWorldState` | `string?` | WorldState 조건 레이블 |
| `WorldState` | `string?` | GlobalEnum.WorldState 참조. 이벤트 출현 조건 플래그 |
| `FreeUpgrade` | `string?` | 무료 강화 이벤트 설정 키 |

---

### MapEvent_ShopTBL

상점 이벤트. 카드와 아이템 구매가 가능한 상점 노드를 정의한다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 상점 이벤트 식별자 |
| `ID` | `number` | 고유 ID |
| `Icon` | `string` | 맵 노드 표시 아이콘 에셋 키 |
| `DepthMin` | `number` | 등장 가능 최소 깊이 |
| `DepthMax` | `number` | 등장 가능 최대 깊이 |
| `BuyMult` | `number` | 구매 가격 배율. 기본값 `1.0` |
| `SellyMult` | `number` | 판매 가격 배율. 기본값 `0.5` |
| `Item1` | `string?` | 고정 진열 아이템 ID 1 |
| `Item2` | `string?` | 고정 진열 아이템 ID 2 |
| `Item3` | `string?` | 고정 진열 아이템 ID 3 |
| `CardsRand` | `number` | 상점에 진열되는 카드 수 (랜덤 선택) |
| `ItemsRand` | `number` | 상점에 진열되는 아이템 수 (랜덤 선택) |
| `ItemRandSlot1~4` | `string?` | 랜덤 아이템 슬롯 설정 키. 아이템 풀 제한 시 사용 |

---

### ExtraEnemyTBL

전투 이벤트에서 조건부로 추가 등장하는 적 세트. 파티 규모(챔피언 수)에 따라 적 수를 조절할 때 사용한다. 두 개의 조건 세트를 정의할 수 있으며, 각 세트는 `ChampionMin`과 `Enemy1~4`를 한 묶음으로 한다.

**컬럼**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `Name` | `string` | 추가 적 세트 식별자 |
| `ID` | `number` | 고유 ID |
| `ChampionMin` | `number` | 이 세트가 등장하는 최소 파티 챔피언 수 |
| `Enemy1~4` | `string?` | `EnemyTBL.Name` 참조. 추가 등장 적 |
| `ChampionMin` (2nd) | `number?` | 두 번째 조건의 최소 챔피언 수 |
| `Enemy1~4` (2nd) | `string?` | 두 번째 조건의 추가 적. 공란이면 세트 없음 |

**참조 관계**

- `Enemy1~4` → `EnemyTBL.Name`
- `MapEvent_BattleTBL.ExtraEnemy`에서 참조됨

---

## 5. 공통

### GlobalEnum

코드와 시트 간의 숫자 enum 값을 단일 테이블로 관리한다. 모든 `select*` 컬럼의 레이블과 실제 enum 숫자값이 이 시트에서 정의된다.

**시트 구조**

GlobalEnum은 일반 테이블과 달리 한글/영문 헤더 행이 없다. 여러 enum 그룹이 가로로 병렬 배치되는 다단(multi-column) 레이아웃을 사용한다.

- **행 0**: 각 그룹 블록의 첫 열에 그룹명 표기 (예: `StatusEffect`, `StatusDuration`)
- **행 1**: 각 그룹의 서브 헤더 (`id`, `enum`, `desc`)
- **행 2~**: 실제 enum 값

각 그룹 블록은 3열(`id` | `enum` | `desc`)로 구성되며, 빈 열로 구분된다.

**참조 관계**

- 참조를 받는 방향. 모든 시트의 `Select*` 컬럼이 이 시트를 참조함
- 직접 외래키 제약은 없으나, 빌드 시 검증 단계에서 값 일치 여부 확인

**주요 그룹 요약**

| group | 주요 값 |
|-------|---------|
| `TileRank` | `A=2, B=4, C=8, D=16, E=32, F=64` |
| `AbilityTrigger` | `None=0, Passive=2, OnPlay=10, StartOfTurn=20, EndOfTurn=22, OnTileMerge=30, OnDamaged=42` |
| `AbilityTarget` | `None=0, CharacterSelf=4, AllCharacters=7, PlayTarget=20, AllEnemies=25, RandomEnemy=26` |
| `StatusEffect` | `AttackPower=10, Armor=15, Stunned=20, Vulnerable=32, Blind=35, Poisoned=40, Bleed=44, SlowDown=70` |
| `StatusDuration` | `Persistant=0, OneTurn=2, AutoReduce=10` |
| `CardType` | `Skill=1, Power=2` |
| `MapEventType` | `Battle=1, Choice=2, Trade=3, Effect=4, Shop=5, Other=9` |
| `WorldState` | 런 진행 상황·해금 조건 플래그 (값은 런타임 조건에 따라 확장) |

**예시**

| group | id | enum | desc |
|-------|----|------|------|
| TileRank | 2 | A | 2048 보드 타일 숫자 2 |
| TileRank | 4 | B | 2048 보드 타일 숫자 4 |
| TileRank | 8 | C | 2048 보드 타일 숫자 8 |
| TileRank | 16 | D | 2048 보드 타일 숫자 16 |
| TileRank | 32 | E | 2048 보드 타일 숫자 32 |
| TileRank | 64 | F | 2048 보드 타일 숫자 64 |
| AbilityTrigger | 10 | OnPlay | 카드가 손패에서 발동될 때 |
| AbilityTrigger | 20 | StartOfTurn | 턴 시작 시 |
| AbilityTrigger | 30 | OnTileMerge | 보드에서 타일이 병합될 때 |
| AbilityTarget | 20 | PlayTarget | 플레이어가 선택한 대상 |
| AbilityTarget | 7 | AllCharacters | 전체 캐릭터 (아군+적군) |
| StatusEffect | 32 | Vulnerable | 취약 상태. 받는 피해 증가 |
| StatusDuration | 10 | AutoReduce | 매 턴 스택 1 감소 |
| MapEventType | 1 | Battle | 전투 이벤트 |
| MapEventType | 2 | Choice | 선택지 이벤트 |
