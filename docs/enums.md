# GlobalEnum

게임 전반에서 사용하는 열거형(enum) 정의 목록입니다.  
Google Sheets `GlobalEnum` 탭과 동기화하여 관리합니다.

| 그룹 | 설명 |
|------|------|
| [StatusEffect](#statuseffect) | 상태이상 종류 |
| [StatusDuration](#statusduration) | 상태이상 지속 방식 |
| [AbilityTrigger](#abilitytrigger) | 능력 발동 시점 |
| [AbilityTarget](#abilitytarget) | 능력 적용 대상 |
| [Conditions](#conditions) | 조건 필터 목록 |
| [Effects](#effects) | 효과 목록 |
| [CardType](#cardtype) | 카드 타입 |
| [ItemType](#itemtype) | 아이템 타입 |
| [CardAvailability](#cardavailability) | 카드 사용 가능 조건 |
| [MapEventType](#mapeventtype) | 맵 이벤트 타입 |
| [WorldState](#worldstate) | 월드 상태 |

---

## StatusEffect

상태이상 효과 종류. `CardStatusTBL`의 `StatusEffect` 컬럼에서 참조.

| id | enum | 설명 |
|----|:----:|------|
| `ManaCostBonus` | 2 | 카드 비용 증감 |
| `SpeedBonus` | 7 | 스피드 증감 |
| `HandBonus` | 8 | 핸드 사이즈 증감 |
| `AttackPower` | 10 | 물리 피해 보너스 |
| `MagicPower` | 12 | 마법 피해 보너스 |
| `Armor` | 15 | 매 턴 시작 시 쉴드 획득 |
| `Stunned` | 20 | X턴 동안 행동 불가 |
| `Sleep` | 22 | 공격받을 때까지 행동 불가 |
| `Courageous` | 30 | 피해량 50% 증가 |
| `Fearful` | 31 | 피해량 50% 감소 |
| `Vulnerable` | 32 | 받는 피해 50% 증가 |
| `Evasive` | 33 | 받는 피해 50% 감소 |
| `Poisoned` | 40 | 매 턴 시작 시 HP 감소 (쉴드 무시) |
| `Burned` | 42 | 매 턴 시작 시 HP 감소 (쉴드 방어 가능) |
| `StatusResistance` | 50 | 부정적 상태이상 면역 |
| `BurnHeal` | 52 | 화상 피해가 회복으로 전환 |
| `Thorn` | 55 | 공격받을 때 공격자에게 피해 반사 |
| `Keep` | 60 | 턴 종료 시 카드가 버려지지 않음 |

---

## StatusDuration

상태이상 지속 방식. `CardStatusTBL`의 `StatusDuration` 컬럼에서 참조.

| id | enum | 설명 |
|----|:----:|------|
| `Persistant` | 0 | 수동으로 제거될 때까지 유지 |
| `OneTurn` | 2 | 1턴 후 제거 |
| `AutoReduce` | 10 | 매 턴 스택 1 감소 |

---

## AbilityTrigger

능력이 발동하는 시점. `CardAbilityTBL`의 `trigger` 컬럼에서 참조.

| id | enum | 설명 |
|----|:----:|------|
| `None` | 0 | — |
| `Ongoing` | 2 | 플레이 중 항상 활성 (일부 효과 미지원) |
| `OnPlay` | 10 | 카드를 플레이할 때 |
| `OnPlayOther` | 12 | 다른 카드를 플레이할 때 |
| `StartOfTurn` | 20 | 매 턴 시작 시 |
| `EndOfTurn` | 22 | 매 턴 종료 시 |
| `OnDraw` | 30 | 카드를 드로우할 때 |
| `OnDrawOther` | 31 | 다른 카드를 드로우할 때 |
| `OnDeath` | 40 | 해당 캐릭터가 죽을 때 |
| `OnDeathOther` | 41 | 아무 캐릭터가 죽을 때 |
| `OnDamaged` | 42 | 해당 캐릭터가 피해를 받을 때 |
| `BattleStart` | 50 | 전투 시작 시 |
| `BattleEnd` | 52 | 전투 종료 시 |

---

## AbilityTarget

능력이 적용되는 대상. `CardAbilityTBL`의 `Target` 컬럼에서 참조.

| id | enum | 설명 |
|----|:----:|------|
| `None` | 0 | — |
| `CardSelf` | 1 | 능력을 가진 카드 자신 |
| `CharacterSelf` | 4 | 능력을 가진 캐릭터 자신 |
| `AllCharacters` | 7 | 모든 캐릭터 |
| `AllCardsHand` | 11 | 핸드의 모든 카드 |
| `AllCardsAllPiles` | 12 | 모든 파일의 카드 |
| `AllSlots` | 15 | 모든 슬롯 |
| `AllCardData` | 17 | 카드 데이터 전체 (Create 효과 전용) |
| `PlayTarget` | 20 | 카드를 플레이할 때 선택한 대상 (스킬 전용) |
| `AbilityTriggerer` | 25 | 트랩을 발동시킨 카드 |
| `SelectTarget` | 30 | 보드 위 카드·플레이어·슬롯 직접 선택 |
| `CardSelector` | 40 | 카드 선택 메뉴 |
| `ChoiceSelector` | 50 | 선택지 메뉴 |
| `LastPlayed` | 70 | 마지막으로 플레이된 카드 |
| `LastTargeted` | 72 | 마지막으로 능력 대상이 된 카드 |
| `LastDestroyed` | 74 | 마지막으로 파괴된 카드 |
| `LastSummoned` | 77 | 마지막으로 소환·생성된 카드 |

---

## Conditions

능력 발동 조건 필터 목록. `CardAbilityTBL`의 `T_conditions_*` 컬럼에서 사용.

| enum |
|------|
| `filter_first_1` |
| `filter_first_6` |
| `filter_first_7` |
| `filter_highest_hp` |
| `filter_lowest_hp` |
| `filter_random_1` |
| `filter_random_2` |
| `filter_random_3` |
| `has_banana` |
| `has_discard_character` |
| `has_discard_spell` |
| `has_map` |
| `is_alive` |
| `is_allied` |
| `is_at_back` |
| `is_at_front` |
| `is_attack` |
| `is_card` |
| `is_character` |
| `is_curse` |
| `is_fearful` |
| `is_first_turn` |
| `is_growth2` |
| `is_in_deck` |
| `is_in_discard` |
| `is_in_equipped` |
| `is_in_hand` |
| `is_in_temp` |
| `is_not_allied` |
| `is_not_empty` |
| `is_not_in_deck` |
| `is_not_in_discard` |
| `is_not_in_hand` |
| `is_not_in_temp` |
| `is_not_same` |
| `is_not_self` |
| `is_not_slot` |
| `is_not_stealth` |
| `is_not_your_turn` |
| `is_owner_not_self` |
| `is_owner_self` |
| `is_paralysed` |
| `is_same_owner` |
| `is_side_champion` |
| `is_side_enemy` |
| `is_skill` |
| `is_slot` |
| `is_slot_empty` |
| `is_slot_x1` |
| `is_spell` |
| `is_wolf` |
| `is_your_turn` |
| `once_per_turn` |
| `rolled_4P` |
| `selected_cost_greater_0` |

---

## Effects

능력 효과 목록. `CardAbilityTBL`의 `Effect1`, `Effect2` 컬럼에서 사용.

| enum |
|------|
| `add_energy` |
| `add_gold` |
| `add_growth` |
| `add_hand_size` |
| `add_hp` |
| `add_mana` |
| `add_mana_next` |
| `add_phase` |
| `add_shield` |
| `add_speed` |
| `add_xp` |
| `clear_status_all` |
| `clear_temp` |
| `consume_item` |
| `create_temp` |
| `damage` |
| `damage_half` |
| `damage_hp` |
| `damage_shield` |
| `destroy` |
| `discard` |
| `draw` |
| `draw_next` |
| `gain_exhausted` |
| `gain_lost` |
| `gain_mana` |
| `gain_wounded` |
| `heal` |
| `map_gold_boost` |
| `map_shop_buy_boost` |
| `map_xp_boost` |
| `play_card` |
| `redraw_hand` |
| `remove_courageous` |
| `remove_evasive` |
| `remove_fearful` |
| `remove_weak` |
| `repeat_projectile` |
| `reset_stats` |
| `resurrect` |
| `roll_d6` |
| `send_deck` |
| `send_hand` |
| `send_void` |
| `set_energy` |
| `set_hand_size` |
| `set_hp` |
| `set_mana` |
| `set_speed` |
| `set_target` |
| `shuffle_deck` |
| `summon_cursed` |
| `summon_egg` |
| `summon_snake` |
| `transform_chicken` |
| `upgrade_card` |

---

## CardType

카드의 기본 타입. `CardTBL`의 `CardType` 컬럼에서 참조.

| id | enum |
|----|:----:|
| `None` | 0 |
| `Skill` | 20 |
| `Power` | 30 |

---

## ItemType

아이템 카드 세부 타입. `CardTBL`의 `ItemType` 컬럼에서 참조.

| id | enum |
|----|:----:|
| `None` | 0 |
| `ItemQuest` | 20 |
| `ItemConsumable` | 22 |
| `ItemCard` | 24 |
| `ItemPassive` | 26 |

---

## CardAvailability

카드 사용 가능 조건. `CardTBL`의 `Availability` 컬럼에서 참조.

| id | enum | 비고 |
|----|:----:|------|
| `Available` | 0 | 기본 사용 가능 |
| `Unlockable` | 10 | 잠금 해제 필요 |
| `Unlisted` | 20 | 목록에 미표시 |
| `ChampionActive` | 10 | 해당 챔피언 활성 시 사용 가능 |
| `ChampionAll` | 15 | 모든 챔피언 활성 시 사용 가능 |

---

## MapEventType

맵 이벤트 타입. `MapRandomEventTBL`·`MapFixedEventTBL`의 `Type` 컬럼에서 참조.

| id | enum |
|----|:----:|
| `Battle` | 0 |
| `Choice` | 10 |
| `Trade` | 20 |
| `Effect` | 30 |
| `Reward` | 40 |
| `State` | 50 |
| `Upgrade` | 60 |
| `Shop` | 70 |

---

## WorldState

게임 월드 상태. `MapEvent_OtherTBL`의 `WorldState` 컬럼에서 참조.

| id | enum |
|----|:----:|
| `None` | 0 |
| `Setup` | 2 |
| `Map` | 10 |
| `Battle` | 20 |
| `EventChoice` | 30 |
| `EventText` | 32 |
| `Reward` | 50 |
| `Trash` | 51 |
| `Shop` | 52 |
| `Upgrade` | 54 |
| `LevelUp` | 55 |
| `Ended` | 100 |
