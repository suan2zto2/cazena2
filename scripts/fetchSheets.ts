import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import type {
  StringEntry, CardTrait, CardTeam, CardRarity, CardIntent,
  Ability, StatusEffect, Card, Champion, Enemy, CardDeck,
  GameMap, MapRandomEvent, MapFixedEvent,
  BattleEvent, ChoiceEvent, ChoiceOption, TradeEvent, EffectEvent, OtherEvent, ShopEvent,
  ExtraEnemy, GlobalEnumEntry,
  AbilityType, CardType, DeckType,
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

async function readSheet(
  sheets: ReturnType<typeof google.sheets>,
  sheetName: string,
): Promise<Record<string, string>[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });
  const [header, ...rows] = res.data.values ?? [];
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
  return rows.map(r => ({ uid: num(r.UID), kr: r.KR }));
}

function buildTraits(rows: Record<string, string>[]): CardTrait[] {
  return rows.map(r => ({
    id: r.ID,
    titleStringId: num(r.titleStringId),
    descStringId: num(r.descStringId),
    icon: r.icon,
  }));
}

function buildTeams(rows: Record<string, string>[]): CardTeam[] {
  return rows.map(r => ({
    id: r.ID,
    titleStringId: num(r.titleStringId),
    icon: r.icon,
    color: r.color,
  }));
}

function buildRarities(rows: Record<string, string>[]): CardRarity[] {
  return rows.map(r => ({
    id: r.ID,
    titleStringId: num(r.titleStringId),
    icon: r.icon,
    probability: num(r.probability),
  }));
}

function buildIntents(rows: Record<string, string>[]): CardIntent[] {
  return rows.map(r => ({
    id: r.ID,
    isShow: bool(r.isShow),
    priority: num(r.priority),
    titleStringId: num(r.titleStringId),
    descStringId: num(r.descStringId),
    icon: r.icon,
  }));
}

function buildAbilities(rows: Record<string, string>[]): Ability[] {
  return rows.map(r => ({
    type: r.Type as AbilityType,
    id: r.ID,
    selectTrigger: r.selectTrigger,
    trigger: num(r.trigger),
    ...opt(r.trigCond1, v => ({ trigCond1: v })),
    ...opt(r.trigCond2, v => ({ trigCond2: v })),
    ...opt(r.trigCond3, v => ({ trigCond3: v })),
    selectTarget: r.selectTarget,
    target: num(r.target),
    ...opt(r.tgtCond1, v => ({ tgtCond1: v })),
    ...opt(r.tgtCond2, v => ({ tgtCond2: v })),
    ...opt(r.tgtCond3, v => ({ tgtCond3: v })),
    ...opt(r.effect1,       v => ({ effect1: v })),
    ...opt(r.effect2,       v => ({ effect2: v })),
    ...opt(r.status1,       v => ({ status1: v })),
    ...opt(r.status2,       v => ({ status2: v })),
    ...opt(r.effectValue,   v => ({ effectValue: num(v) })),
    ...opt(r.upgradeValue,  v => ({ upgradeValue: num(v) })),
    ...opt(r.selectUpBonus, v => ({ selectUpBonus: v })),
    ...opt(r.upgradeBonus,  v => ({ upgradeBonus: num(v) })),
    ...opt(r.chainAbility,  v => ({ chainAbility: v })),
    ...opt(r.targetFx,      v => ({ targetFx: v })),
  }));
}

function buildStatuses(rows: Record<string, string>[]): StatusEffect[] {
  return rows.map(r => ({
    id: r.ID,
    selectEffect: r.selectEffect,
    statusEffect: num(r.statusEffect),
    selectDuration: r.selectDuration,
    statusDuration: num(r.statusDuration),
    isNegative: bool(r.isNegative),
    titleStringId: num(r.titleStringId),
    descStringId: num(r.descStringId),
    icon: r.icon,
    fx: r.fx,
    animation: r.animation,
  }));
}

function buildCards(rows: Record<string, string>[]): Card[] {
  return rows.map(r => ({
    id: r.ID,
    titleStringId: num(r.titleStringId),
    descStringId: num(r.descStringId),
    cardType: r.cardType as CardType,
    team: r.team,
    rarity: r.rarity,
    mana: num(r.mana),
    ...opt(r.trait1,           v => ({ trait1: v })),
    ...opt(r.trait2,           v => ({ trait2: v })),
    ...opt(r.ability1,         v => ({ ability1: v })),
    ...opt(r.ability2,         v => ({ ability2: v })),
    ...opt(r.ability3,         v => ({ ability3: v })),
    ...opt(r.ability4,         v => ({ ability4: v })),
    upgradeMax: num(r.upgradeMax),
    upgradeMana: num(r.upgradeMana),
    shopCost: num(r.shopCost),
    ...opt(r.intent,           v => ({ intent: v })),
    tileRank: r.tileRank as import('./types').TileRank,
    ...opt(r.upgradedTileRank, v => ({ upgradedTileRank: v as import('./types').TileRank })),
  }));
}

function buildChampions(rows: Record<string, string>[]): Champion[] {
  return rows.map(r => ({
    id: r.ID,
    titleStringId: num(r.titleStringId),
    hp: num(r.hp),
    speed: num(r.speed),
    hand: num(r.hand),
    energy: num(r.energy),
    lvUpHp: num(r.lvUpHp),
    lvUpSpeed: num(r.lvUpSpeed),
    lvUpHand: num(r.lvUpHand),
    lvUpEnergy: num(r.lvUpEnergy),
    team: r.team,
    startDeck: r.startDeck,
    rewardCard1: r.rewardCard1,
    rewardCard2: r.rewardCard2,
  }));
}

function buildEnemies(rows: Record<string, string>[]): Enemy[] {
  return rows.map(r => ({
    id: r.ID,
    titleStringId: num(r.titleStringId),
    hp: num(r.hp),
    speed: num(r.speed),
    hand: num(r.hand),
    energy: num(r.energy),
    lvUpMax: num(r.lvUpMax),
    lvUpHp: num(r.lvUpHp),
    lvUpSpeed: num(r.lvUpSpeed),
    lvUpHand: num(r.lvUpHand),
    lvUpEnergy: num(r.lvUpEnergy),
    behavior: r.behavior,
    ...opt(r.trait1,   v => ({ trait1: v })),
    ...opt(r.ability1, v => ({ ability1: v })),
    cardDeck: r.cardDeck,
    rewardGold: num(r.rewardGold),
    rewardXP: num(r.rewardXP),
    ...opt(r.spawnFx,  v => ({ spawnFx: v })),
  }));
}

function buildDecks(rows: Record<string, string>[]): CardDeck[] {
  return rows.map(r => ({
    type: r.Type as DeckType,
    id: r.ID,
    slots: [r.slot1, r.slot2, r.slot3, r.slot4, r.slot5, r.slot6, r.slot7, r.slot8, r.slot9, r.slot10]
      .filter(s => s !== ''),
  }));
}

function buildMaps(rows: Record<string, string>[]): GameMap[] {
  return rows.map(r => ({
    id: r.ID,
    titleStringId: num(r.titleStringId),
    depth: num(r.depth),
    widthMin: num(r.widthMin),
    widthMax: num(r.widthMax),
    forkProbability: num(r.forkProbability),
    randomEventId: r.randomEventId,
    fixedEventId: r.fixedEventId,
  }));
}

function buildMapRandomEvents(rows: Record<string, string>[]): MapRandomEvent[] {
  return rows.map(r => ({
    id: r.ID,
    selectType: r.selectType,
    type: num(r.type),
    eventId: r.eventId,
  }));
}

function buildMapFixedEvents(rows: Record<string, string>[]): MapFixedEvent[] {
  return rows.map(r => ({
    id: r.ID,
    depth: num(r.depth),
    indexMin: num(r.indexMin),
    indexMax: num(r.indexMax),
    eventId: r.eventId,
  }));
}

function buildBattleEvents(rows: Record<string, string>[]): BattleEvent[] {
  return rows.map(r => ({
    id: r.ID,
    depthMin: num(r.depthMin),
    depthMax: num(r.depthMax),
    enemyLevel: num(r.enemyLevel),
    enemies: [r.enemy1, r.enemy2, r.enemy3, r.enemy4].filter(e => e !== ''),
    rewardGold: num(r.rewardGold),
    rewardXP: num(r.rewardXP),
    isRewardCards: bool(r.isRewardCards),
    ...opt(r.cardRarity, v => ({ cardRarity: v })),
    ...opt(r.winEvent,   v => ({ winEvent: v })),
  }));
}

function buildChoiceEvents(rows: Record<string, string>[]): ChoiceEvent[] {
  return rows.map(r => {
    const choices: ChoiceOption[] = [];
    for (let i = 1; i <= 4; i++) {
      const title  = r[`choice${i}Title`];
      const desc   = r[`choice${i}Desc`];
      const effect = r[`choice${i}Effect`];
      if (effect && effect !== '') {
        choices.push({ titleStringId: num(title), descStringId: num(desc), effectId: effect });
      }
    }
    return { id: r.ID, depthMin: num(r.depthMin), depthMax: num(r.depthMax), descStringId: num(r.descStringId), choices };
  });
}

function buildTradeEvents(rows: Record<string, string>[]): TradeEvent[] {
  return rows.map(r => ({
    id: r.ID,
    selectEventTarget: r.selectEventTarget,
    eventTarget: num(r.eventTarget),
    spendGold: num(r.spendGold),
    spendHp: num(r.spendHp),
    gainGold: num(r.gainGold),
    gainXp: num(r.gainXp),
    gainHeal: num(r.gainHeal),
    descStringId: num(r.descStringId),
  }));
}

function buildEffectEvents(rows: Record<string, string>[]): EffectEvent[] {
  return rows.map(r => ({
    id: r.ID,
    selectEventTarget: r.selectEventTarget,
    eventTarget: num(r.eventTarget),
    effect1: r.effect1,
    ...opt(r.effect2,     v => ({ effect2: v })),
    value: num(r.value),
    ...opt(r.chainEventId,v => ({ chainEventId: v })),
    descStringId: num(r.descStringId),
  }));
}

function buildOtherEvents(rows: Record<string, string>[]): OtherEvent[] {
  return rows.map(r => ({
    id: r.ID,
    selectType: r.selectType,
    eventType: num(r.eventType),
    icon: r.icon,
    ...opt(r.rarity,     v => ({ rarity: v })),
    ...opt(r.worldState, v => ({ worldState: v })),
  }));
}

function buildShopEvents(rows: Record<string, string>[]): ShopEvent[] {
  return rows.map(r => ({
    id: r.ID,
    depthMin: num(r.depthMin),
    depthMax: num(r.depthMax),
    buyMult: num(r.buyMult),
    sellyMult: num(r.sellyMult),
    cardsRand: num(r.cardsRand),
    itemsRand: num(r.itemsRand),
  }));
}

function buildExtraEnemies(rows: Record<string, string>[]): ExtraEnemy[] {
  return rows.map(r => ({
    id: r.ID,
    championMin: r.championMin,
    enemies: [r.enemy1, r.enemy2, r.enemy3, r.enemy4].filter(e => e !== ''),
  }));
}

function buildGlobalEnum(rows: Record<string, string>[]): GlobalEnumEntry[] {
  return rows.map(r => ({
    group: r.group,
    id: r.id,
    enum: num(r.enum),
    desc: r.desc,
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
    readSheet(sheets, 'DeckTBL'),
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
