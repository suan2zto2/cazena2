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
  const [, , header, ...rows] = res.data.values ?? []; // row1(한글)·row2(설명) 스킵, row3(영문)=헤더
  if (!header) return [];
  return rows.map(row =>
    Object.fromEntries(header.map((key: string, i: number) => [key, row[i] ?? '']))
  );
}

function num(v: string) { return v === '' ? 0 : Number(v); }
function bool(v: string) { return v === '1' || v.toUpperCase() === 'TRUE'; }
function opt<T>(v: string, fn: (s: string) => T): T | undefined {
  return v?.trim() !== '' ? fn(v) : undefined;
}

// ─── 변환 함수 ────────────────────────────────────────────────────────────────

function buildStrings(rows: Record<string, string>[]): StringEntry[] {
  return rows.map(r => ({ UID: num(r.UID), KR: r.KR }));
}

function buildTraits(rows: Record<string, string>[]): CardTrait[] {
  return rows.map(r => ({
    ID: r.ID,
    TitleStringID: num(r.TitleStringID),
    DescStringID: num(r.DescStringID),
    Icon: r.Icon,
  }));
}

function buildTeams(rows: Record<string, string>[]): CardTeam[] {
  return rows.map(r => ({
    ID: r.ID,
    TitleStringID: num(r.TitleStringID),
    Icon: r.Icon,
    Color: r.Color,
  }));
}

function buildRarities(rows: Record<string, string>[]): CardRarity[] {
  return rows.map(r => ({
    ID: r.ID,
    TitleStringID: num(r.TitleStringID),
    Icon: r.Icon,
    Probability: num(r.Probability),
  }));
}

function buildIntents(rows: Record<string, string>[]): CardIntent[] {
  return rows.map(r => ({
    ID: r.ID,
    IsShow: bool(r.IsShow),
    Priority: num(r.Priority),
    TitleStringID: num(r.TitleStringID),
    DescStringID: num(r.DescStringID),
    Icon: r.Icon,
  }));
}

function buildAbilities(rows: Record<string, string>[]): Ability[] {
  return rows.map(r => ({
    Type: r.Type as AbilityType,
    ID: r.ID,
    SelectTrigger: r.SelectTrigger,
    Trigger: num(r.Trigger),
    ...opt(r.TrigCond1, v => ({ TrigCond1: v })),
    ...opt(r.TrigCond2, v => ({ TrigCond2: v })),
    ...opt(r.TrigCond3, v => ({ TrigCond3: v })),
    SelectTarget: r.SelectTarget,
    Target: num(r.Target),
    ...opt(r.TgtCond1, v => ({ TgtCond1: v })),
    ...opt(r.TgtCond2, v => ({ TgtCond2: v })),
    ...opt(r.TgtCond3, v => ({ TgtCond3: v })),
    ...opt(r.Effect1,       v => ({ Effect1: v })),
    ...opt(r.Effect2,       v => ({ Effect2: v })),
    ...opt(r.Status1,       v => ({ Status1: v })),
    ...opt(r.Status2,       v => ({ Status2: v })),
    ...opt(r.EffectValue,   v => ({ EffectValue: num(v) })),
    ...opt(r.UpgradeValue,  v => ({ UpgradeValue: num(v) })),
    ...opt(r.SelectUpBonus, v => ({ SelectUpBonus: v })),
    ...opt(r.UpgradeBonus,  v => ({ UpgradeBonus: num(v) })),
    ...opt(r.ChainAbility,  v => ({ ChainAbility: v })),
    ...opt(r.TargetFx,      v => ({ TargetFx: v })),
  }));
}

function buildStatuses(rows: Record<string, string>[]): StatusEffect[] {
  return rows.map(r => ({
    ID: r.ID,
    SelectEffect: r.SelectEffect,
    StatusEffect: num(r.StatusEffect),
    SelectDuration: r.SelectDuration,
    StatusDuration: num(r.StatusDuration),
    IsNegative: bool(r.IsNegative),
    TitleStringID: num(r.TitleStringID),
    DescStringID: num(r.DescStringID),
    Icon: r.Icon,
    Fx: r.Fx,
    Animation: r.Animation,
  }));
}

function buildCards(rows: Record<string, string>[]): Card[] {
  return rows.map(r => ({
    ID: r.ID,
    TitleStringID: num(r.TitleStringID),
    DescStringID: num(r.DescStringID),
    CardType: r.CardType,
    Team: r.Team,
    Rarity: r.Rarity,
    Mana: num(r.Mana),
    ...opt(r.Trait1,   v => ({ Trait1: v })),
    ...opt(r.Trait2,   v => ({ Trait2: v })),
    ...opt(r.Ability1, v => ({ Ability1: v })),
    ...opt(r.Ability2, v => ({ Ability2: v })),
    ...opt(r.Ability3, v => ({ Ability3: v })),
    ...opt(r.Ability4, v => ({ Ability4: v })),
    UpgradeMax: num(r.UpgradeMax),
    UpgradeMana: num(r.UpgradeMana),
    ShopCost: num(r.ShopCost),
    ...opt(r.Intent,   v => ({ Intent: v })),
  } as Card));
}

function buildChampions(rows: Record<string, string>[]): Champion[] {
  return rows.map(r => ({
    ID: r.ID,
    TitleStringID: num(r.TitleStringID),
    HP: num(r.HP),
    Speed: num(r.Speed),
    Hand: num(r.Hand),
    Energy: num(r.Energy),
    LvUpHP: num(r.LvUpHP),
    LvUpSpeed: num(r.LvUpSpeed),
    LvUpHand: num(r.LvUpHand),
    LvUpEnergy: num(r.LvUpEnergy),
    Team: r.Team,
    StartDeck: r.StartDeck,
    RewardCard1: r.RewardCard1,
    RewardCard2: r.RewardCard2,
  }));
}

function buildEnemies(rows: Record<string, string>[]): Enemy[] {
  return rows.map(r => ({
    ID: r.ID,
    TitleStringID: num(r.TitleStringID),
    HP: num(r.HP),
    Speed: num(r.Speed),
    Hand: num(r.Hand),
    Energy: num(r.Energy),
    LvUpMax: num(r.LvUpMax),
    LvUpHP: num(r.LvUpHP),
    LvUpSpeed: num(r.LvUpSpeed),
    LvUpHand: num(r.LvUpHand),
    LvUpEnergy: num(r.LvUpEnergy),
    Behavior: r.Behavior,
    ...opt(r.Trait1,   v => ({ Trait1: v })),
    ...opt(r.Ability1, v => ({ Ability1: v })),
    CardDeck: r.CardDeck,
    RewardGold: num(r.RewardGold),
    RewardXP: num(r.RewardXP),
    ...opt(r.SpawnFx,  v => ({ SpawnFx: v })),
  }));
}

function buildDecks(rows: Record<string, string>[]): CardDeck[] {
  return rows.map(r => ({
    Type: r.Type as DeckType,
    ID: r.ID,
    Slots: [r.Slot1, r.Slot2, r.Slot3, r.Slot4, r.Slot5,
            r.Slot6, r.Slot7, r.Slot8, r.Slot9, r.Slot10]
      .filter(s => s !== ''),
  }));
}

function buildMaps(rows: Record<string, string>[]): GameMap[] {
  return rows.map(r => ({
    ID: r.ID,
    TitleStringID: num(r.TitleStringID),
    Depth: num(r.Depth),
    WidthMin: num(r.WidthMin),
    WidthMax: num(r.WidthMax),
    ForkProbability: num(r.ForkProbability),
    RandomEventID: r.RandomEventID,
    FixedEventID: r.FixedEventID,
  }));
}

function buildMapRandomEvents(rows: Record<string, string>[]): MapRandomEvent[] {
  return rows.map(r => ({
    ID: r.ID,
    SelectType: r.SelectType,
    Type: num(r.Type),
    EventID: r.EventID,
  }));
}

function buildMapFixedEvents(rows: Record<string, string>[]): MapFixedEvent[] {
  return rows.map(r => ({
    ID: r.ID,
    Depth: num(r.Depth),
    IndexMin: num(r.IndexMin),
    IndexMax: num(r.IndexMax),
    EventID: r.EventID,
  }));
}

function buildBattleEvents(rows: Record<string, string>[]): BattleEvent[] {
  return rows.map(r => ({
    ID: r.ID,
    DepthMin: num(r.DepthMin),
    DepthMax: num(r.DepthMax),
    EnemyLevel: num(r.EnemyLevel),
    Enemies: [r.Enemy1, r.Enemy2, r.Enemy3, r.Enemy4].filter(e => e !== ''),
    RewardGold: num(r.RewardGold),
    RewardXP: num(r.RewardXP),
    IsRewardCards: bool(r.IsRewardCards),
    ...opt(r.CardRarity, v => ({ CardRarity: v })),
    ...opt(r.WinEvent,   v => ({ WinEvent: v })),
  }));
}

function buildChoiceEvents(rows: Record<string, string>[]): ChoiceEvent[] {
  return rows.map(r => {
    const choices: ChoiceOption[] = [];
    for (let i = 1; i <= 4; i++) {
      const title  = r[`Choice${i}Title`];
      const desc   = r[`Choice${i}Desc`];
      const effect = r[`Choice${i}Effect`];
      if (effect && effect !== '') {
        choices.push({ TitleStringID: num(title), DescStringID: num(desc), EffectID: effect });
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

function buildTradeEvents(rows: Record<string, string>[]): TradeEvent[] {
  return rows.map(r => ({
    ID: r.ID,
    SelectEventTarget: r.SelectEventTarget,
    EventTarget: num(r.EventTarget),
    SpendGold: num(r.SpendGold),
    SpendHP: num(r.SpendHP),
    GainGold: num(r.GainGold),
    GainXP: num(r.GainXP),
    GainHeal: num(r.GainHeal),
    DescStringID: num(r.DescStringID),
  }));
}

function buildEffectEvents(rows: Record<string, string>[]): EffectEvent[] {
  return rows.map(r => ({
    ID: r.ID,
    SelectEventTarget: r.SelectEventTarget,
    EventTarget: num(r.EventTarget),
    Effect1: r.Effect1,
    ...opt(r.Effect2,      v => ({ Effect2: v })),
    Value: num(r.Value),
    ...opt(r.ChainEventID, v => ({ ChainEventID: v })),
    DescStringID: num(r.DescStringID),
  }));
}

function buildOtherEvents(rows: Record<string, string>[]): OtherEvent[] {
  return rows.map(r => ({
    ID: r.ID,
    SelectType: r.SelectType,
    EventType: num(r.EventType),
    Icon: r.Icon,
    ...opt(r.Rarity,     v => ({ Rarity: v })),
    ...opt(r.WorldState, v => ({ WorldState: v })),
  }));
}

function buildShopEvents(rows: Record<string, string>[]): ShopEvent[] {
  return rows.map(r => ({
    ID: r.ID,
    DepthMin: num(r.DepthMin),
    DepthMax: num(r.DepthMax),
    BuyMult: num(r.BuyMult),
    SellyMult: num(r.SellyMult),
    CardsRand: num(r.CardsRand),
    ItemsRand: num(r.ItemsRand),
  }));
}

function buildExtraEnemies(rows: Record<string, string>[]): ExtraEnemy[] {
  return rows.map(r => ({
    ID: r.ID,
    ChampionMin: r.ChampionMin,
    Enemies: [r.Enemy1, r.Enemy2, r.Enemy3, r.Enemy4].filter(e => e !== ''),
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

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Google Sheets 연결 중...');
  const sheets = await getSheets();

  console.log('시트 읽는 중...');
  const [
    strRows, traitRows, teamRows, rarityRows, intentRows,
    abilRows, statusRows, cardRows,
    champRows, enemyRows, deckRows,
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
    readSheet(sheets, 'CardStatusTBL'),
    readSheet(sheets, 'CardTBL'),
    readSheet(sheets, 'ChampionTBL'),
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
  const strings      = buildStrings(strRows);
  const metadata     = {
    traits:   buildTraits(traitRows),
    teams:    buildTeams(teamRows),
    rarities: buildRarities(rarityRows),
    intents:  buildIntents(intentRows),
  };
  const abilities    = buildAbilities(abilRows);
  const statuses     = buildStatuses(statusRows);
  const cards        = buildCards(cardRows);
  const champions    = buildChampions(champRows);
  const enemies      = buildEnemies(enemyRows);
  const decks        = buildDecks(deckRows);
  const maps         = buildMaps(mapRows);
  const mapEvents    = {
    randomEvents:  buildMapRandomEvents(randEvtRows),
    fixedEvents:   buildMapFixedEvents(fixedEvtRows),
    battleEvents:  buildBattleEvents(battleRows),
    choiceEvents:  buildChoiceEvents(choiceRows),
    tradeEvents:   buildTradeEvents(tradeRows),
    effectEvents:  buildEffectEvents(effectRows),
    otherEvents:   buildOtherEvents(otherRows),
    shopEvents:    buildShopEvents(shopRows),
    extraEnemies:  buildExtraEnemies(extraRows),
  };
  const globalEnum   = buildGlobalEnum(enumRows);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const write = (name: string, data: unknown) =>
    fs.writeFileSync(path.join(OUTPUT_DIR, name), JSON.stringify(data, null, 2));

  write('strings.json',    strings);
  write('metadata.json',   metadata);
  write('abilities.json',  abilities);
  write('statuses.json',   statuses);
  write('cards.json',      cards);
  write('champions.json',  champions);
  write('enemies.json',    enemies);
  write('decks.json',      decks);
  write('maps.json',       maps);
  write('mapEvents.json',  mapEvents);
  write('globalEnum.json', globalEnum);

  console.log(`\n✓ 완료: ${OUTPUT_DIR}`);
  console.log(`  strings.json     ${strings.length}행`);
  console.log(`  metadata.json    traits:${metadata.traits.length} teams:${metadata.teams.length} rarities:${metadata.rarities.length} intents:${metadata.intents.length}`);
  console.log(`  abilities.json   ${abilities.length}개`);
  console.log(`  statuses.json    ${statuses.length}개`);
  console.log(`  cards.json       ${cards.length}장`);
  console.log(`  champions.json   ${champions.length}명`);
  console.log(`  enemies.json     ${enemies.length}종`);
  console.log(`  decks.json       ${decks.length}개`);
  console.log(`  maps.json        ${maps.length}개`);
  console.log(`  mapEvents.json   battles:${mapEvents.battleEvents.length} choices:${mapEvents.choiceEvents.length} ...`);
  console.log(`  globalEnum.json  ${globalEnum.length}행`);
}

main().catch(console.error);
