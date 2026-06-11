// ─── 구글 시트 → JSON 변환 (브라우저 전용) ───────────────────────────────────
// 시트가 "링크가 있는 사람 모두 보기"로 공개되어 있어야 동작합니다.
// gviz CSV: 복수 헤더 행(한글/영문)을 한 줄로 합산 → "한글명 EnglishKey"
//           마지막 토큰이 항상 영문 컬럼명이므로 그것만 추출해 헤더로 사용

const SPREADSHEET_ID = '1SRpzgAzrPeH7GlxGkBo3hs83RiYDknOo3uXKJkeRubM';

// ── CSV 파서 ─────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (line[i] === ',' && !inQ) {
      result.push(cur); cur = '';
    } else {
      cur += line[i];
    }
  }
  result.push(cur);
  return result;
}

// gviz가 합산한 헤더 셀에서 영문 컬럼명(마지막 토큰)을 추출
// "타이틀id TitleStringID" → "TitleStringID"
// "Type" → "Type"  (단독 영문도 그대로)
function extractKey(combined) {
  const parts = combined.trim().split(/\s+/);
  return parts[parts.length - 1] || combined;
}

function parseCSV(csvText) {
  const lines = csvText.replace(/\r/g, '').trim().split('\n');
  // line 0 = gviz 결합 헤더,  line 1+ = 데이터
  const rawHeaders = parseCSVLine(lines[0]);
  // 중복 헤더 처리 (ExtraEnemyTBL의 ChampionMin/Enemy1~4 등)
  const count = {};
  const headers = rawHeaders.map(h => {
    const key = extractKey(h);
    count[key] = (count[key] || 0) + 1;
    return count[key] > 1 ? `${key}_${count[key]}` : key;
  });
  return lines.slice(1)
    .filter(l => l.trim() !== '')
    .map(line => {
      const vals = parseCSVLine(line);
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
    });
}

async function fetchSheet(name) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&headers=3&sheet=${encodeURIComponent(name)}`;
  const res = await fetch(url, { credentials: 'omit' });
  if (!res.ok) throw new Error(`"${name}" 시트 로드 실패 (${res.status}). 시트가 공개 설정인지 확인하세요.`);
  return parseCSV(await res.text());
}

// ── 변환 헬퍼 ────────────────────────────────────────────────────────────────

const num  = v => (v === '' || v === undefined ? 0 : Number(v));
const bool = v => v === '1' || String(v).toUpperCase() === 'TRUE';
const opt  = (v, fn) => (v !== undefined && String(v).trim() !== '') ? fn(v) : {};

// ── 변환 함수 ────────────────────────────────────────────────────────────────

function buildStrings(rows) {
  return rows.map(r => ({ UID: num(r.UID), KR: r.KR }));
}

function buildTraits(rows) {
  return rows.map(r => ({
    ID: r.ID, TitleStringID: num(r.TitleStringID), DescStringID: num(r.DescStringID), Icon: r.Icon,
  }));
}

function buildTeams(rows) {
  return rows.map(r => ({
    ID: r.ID, TitleStringID: num(r.TitleStringID), Icon: r.Icon, Color: r.Color,
  }));
}

function buildRarities(rows) {
  return rows.map(r => ({
    ID: r.ID, TitleStringID: num(r.TitleStringID), Icon: r.Icon, Probability: num(r.Probability),
  }));
}

function buildIntents(rows) {
  return rows.map(r => ({
    ID: r.ID, IsShow: bool(r.IsShow), Priority: num(r.Priority),
    TitleStringID: num(r.TitleStringID), DescStringID: num(r.DescStringID), Icon: r.Icon,
  }));
}

function buildAbilities(rows) {
  return rows.map(r => ({
    Type: r.Type, ID: r.ID,
    SelectTrigger: r.SelectTrigger, Trigger: num(r.Trigger),
    ...opt(r.TrigCond1, v => ({ TrigCond1: v })),
    ...opt(r.TrigCond2, v => ({ TrigCond2: v })),
    ...opt(r.TrigCond3, v => ({ TrigCond3: v })),
    SelectTarget: r.SelectTarget, Target: num(r.Target),
    ...opt(r.TgtCond1,  v => ({ TgtCond1: v })),
    ...opt(r.TgtCond2,  v => ({ TgtCond2: v })),
    ...opt(r.TgtCond3,  v => ({ TgtCond3: v })),
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

function buildStatuses(rows) {
  return rows.map(r => ({
    ID: r.ID,
    SelectEffect: r.SelectEffect, StatusEffect: num(r.StatusEffect),
    SelectDuration: r.SelectDuration, StatusDuration: num(r.StatusDuration),
    IsNegative: bool(r.IsNegative),
    TitleStringID: num(r.TitleStringID), DescStringID: num(r.DescStringID),
    Icon: r.Icon,
    ...opt(r.Fx,        v => ({ Fx: v })),
    ...opt(r.Animation, v => ({ Animation: v })),
  }));
}

function buildCards(rows) {
  return rows.map(r => ({
    Type: r.Type, ID: r.ID,
    TitleStringID: num(r.TitleStringID), DescStringID: num(r.DescStringID),
    ArtIcon: r.ArtIcon, ArtFull: r.ArtFull,
    CardType: num(r.CardType), ItemType: num(r.ItemType),
    Team: r.Team, Rarity: r.Rarity, Mana: num(r.Mana),
    ...opt(r.Trait1,    v => ({ Trait1: v })),
    ...opt(r.Trait2,    v => ({ Trait2: v })),
    ...opt(r.Ability1,  v => ({ Ability1: v })),
    ...opt(r.Ability2,  v => ({ Ability2: v })),
    ...opt(r.Ability3,  v => ({ Ability3: v })),
    ...opt(r.Ability4,  v => ({ Ability4: v })),
    UpgradeMax: num(r.UpgradeMax), UpgradeMana: num(r.UpgradeMana), ShopCost: num(r.ShopCost),
    ...opt(r.Intent,    v => ({ Intent: v })),
    ...opt(r.SpawnFx,   v => ({ SpawnFx: v })),
    ...opt(r.SpawnAudio,v => ({ SpawnAudio: v })),
    CasterAnim: r.CasterAnim,
    ...opt(r.TargetAnim,v => ({ TargetAnim: v })),
    Availability: num(r.Availability),
  }));
}

function buildChampions(rows) {
  return rows.map(r => ({
    ID: r.ID, TitleStringID: num(r.TitleStringID),
    ArtFull: r.ArtFull, ArtPortrait: r.ArtPortrait, Prefab: r.Prefab,
    HP: num(r.HP), Speed: num(r.Speed), Hand: num(r.Hand), Energy: num(r.Energy),
    LvUpHP: num(r.LvUpHP), LvUpSpeed: num(r.LvUpSpeed), LvUpHand: num(r.LvUpHand), LvUpEnergy: num(r.LvUpEnergy),
    Team: r.Team, StartDeck: r.StartDeck,
    ...opt(r.RewardCard1, v => ({ RewardCard1: v })),
    ...opt(r.RewardCard2, v => ({ RewardCard2: v })),
  }));
}

function buildEnemies(rows) {
  return rows.map(r => ({
    ID: r.ID, TitleStringID: num(r.TitleStringID),
    ArtFull: r.ArtFull, ArtPortrait: r.ArtPortrait, Prefab: r.Prefab,
    HP: num(r.HP), Speed: num(r.Speed), Hand: num(r.Hand), Energy: num(r.Energy),
    LvUpMax: num(r.LvUpMax), LvUpHP: num(r.LvUpHP), LvUpSpeed: num(r.LvUpSpeed),
    LvUpHand: num(r.LvUpHand), LvUpEnergy: num(r.LvUpEnergy),
    Behavior: r.Behavior,
    ...opt(r.Trait1,   v => ({ Trait1: v })),
    ...opt(r.Ability1, v => ({ Ability1: v })),
    CardDeck: r.CardDeck, RewardGold: num(r.RewardGold), RewardXP: num(r.RewardXP),
    ...opt(r.SpawnFx,  v => ({ SpawnFx: v })),
  }));
}

function buildDecks(rows) {
  return rows.map(r => ({
    Type: r.Type, ID: r.ID,
    Slots: [r.Slot1,r.Slot2,r.Slot3,r.Slot4,r.Slot5,r.Slot6,r.Slot7,r.Slot8,r.Slot9,r.Slot10]
      .filter(s => s !== ''),
  }));
}

function buildMaps(rows) {
  return rows.map(r => ({
    ID: r.ID, TitleStringID: num(r.TitleStringID),
    MapScene: r.MapScene, BattleScene: r.BattleScene,
    Depth: num(r.Depth), WidthMin: num(r.WidthMin), WidthMax: num(r.WidthMax),
    ForkProbability: num(r.ForkProbability),
    RandomEventID: r.RandomEventID,
    ...opt(r.FixedWidthID,  v => ({ FixedWidthID: v })),
    ...opt(r.FixedEventID,  v => ({ FixedEventID: v })),
    ...opt(r.MapTutorial,   v => ({ MapTutorial: v })),
  }));
}

function buildMapRandomEvents(rows) {
  return rows.map(r => ({
    ID: r.ID, SelectType: r.SelectType, Type: num(r.Type), EventID: r.EventID,
  }));
}

function buildMapFixedWidth(rows) {
  return rows.map(r => ({
    ID: r.ID,
    Depths: [1,2,3,4,5,6,7,8,9,10,11,12].map(i => num(r[`Depth${i}`])),
  }));
}

function buildMapFixedEvents(rows) {
  return rows.map(r => ({
    ID: r.ID, Depth: num(r.Depth), IndexMin: num(r.IndexMin), IndexMax: num(r.IndexMax), EventID: r.EventID,
  }));
}

function buildBattleEvents(rows) {
  return rows.map(r => ({
    ID: r.ID, DepthMin: num(r.DepthMin), DepthMax: num(r.DepthMax),
    Icon: r.Icon, EnemyLevel: num(r.EnemyLevel),
    Enemies: [r.Enemy1,r.Enemy2,r.Enemy3,r.Enemy4].filter(e => e !== ''),
    ...opt(r.ExtraEnemy,   v => ({ ExtraEnemy: v })),
    RewardGold: num(r.RewardGold), RewardXP: num(r.RewardXP),
    IsRewardCards: bool(r.IsRewardCards),
    ...opt(r.CardRarity,   v => ({ CardRarity: v })),
    IsRewardItem: bool(r.IsRewardItem),
    ...opt(r.ItemRarity,   v => ({ ItemRarity: v })),
    ...opt(r.ItemTeam,     v => ({ ItemTeam: v })),
    ...opt(r.Tutorial,     v => ({ Tutorial: v })),
    ...opt(r.WinEvent,     v => ({ WinEvent: v })),
  }));
}

function buildExtraEnemies(rows) {
  // ChampionMin·Enemy1~4 세트가 2쌍 → 중복 헤더 _2 접미사
  return rows.map(r => ({
    ID: r.ID,
    Cond1: {
      ChampionMin: num(r.ChampionMin),
      Enemies: [r.Enemy1,r.Enemy2,r.Enemy3,r.Enemy4].filter(e => e !== ''),
    },
    Cond2: {
      ChampionMin: num(r.ChampionMin_2),
      Enemies: [r.Enemy1_2,r.Enemy2_2,r.Enemy3_2,r.Enemy4_2].filter(e => e !== ''),
    },
  }));
}

function buildChoiceEvents(rows) {
  return rows.map(r => {
    const choices = [];
    for (let i = 1; i <= 4; i++) {
      const effect = r[`Choice${i}Effect`];
      if (effect && effect !== '') {
        choices.push({ TitleStringID: num(r[`Choice${i}Title`]), DescStringID: num(r[`Choice${i}Desc`]), EffectID: effect });
      }
    }
    return {
      ID: r.ID, DepthMin: num(r.DepthMin), DepthMax: num(r.DepthMax),
      Icon: r.Icon, DescStringID: num(r.DescStringID), Choices: choices,
    };
  });
}

function buildTradeEvents(rows) {
  return rows.map(r => ({
    ID: r.ID, Icon: r.Icon,
    SelectEventTarget: r.SelectEventTarget, EventTarget: num(r.EventTarget),
    ...opt(r.SpendItem, v => ({ SpendItem: v })),
    SpendGold: num(r.SpendGold), SpendHP: num(r.SpendHP),
    GainItems: [r.GainItem1,r.GainItem2,r.GainItem3].filter(v => v !== ''),
    ...opt(r.GainAlly,  v => ({ GainAlly: v })),
    GainGold: num(r.GainGold), GainXP: num(r.GainXP), GainHeal: num(r.GainHeal),
    DescStringID: num(r.DescStringID),
  }));
}

function buildEffectEvents(rows) {
  return rows.map(r => ({
    ID: r.ID, Icon: r.Icon,
    ...opt(r.Condition1,        v => ({ Condition1: v })),
    SelectEventTarget: r.SelectEventTarget, EventTarget: num(r.EventTarget),
    Effect1: r.Effect1,
    ...opt(r.Effect2,           v => ({ Effect2: v })),
    Value: num(r.Value),
    ...opt(r.ChainEventID,      v => ({ ChainEventID: v })),
    DescStringID: num(r.DescStringID),
  }));
}

function buildOtherEvents(rows) {
  return rows.map(r => ({
    ID: r.ID, SelectType: r.SelectType, EventType: num(r.EventType),
    Icon: r.Icon, Rarity: r.Rarity,
    ...opt(r.WorldState,  v => ({ WorldState: num(v) })),
    ...opt(r.FreeUpgrade, v => ({ FreeUpgrade: v })),
  }));
}

function buildShopEvents(rows) {
  return rows.map(r => ({
    ID: r.ID, DepthMin: num(r.DepthMin), DepthMax: num(r.DepthMax),
    Icon: r.Icon, BuyMult: num(r.BuyMult), SellyMult: num(r.SellyMult),
    FixedItems: [r.Item1,r.Item2,r.Item3].filter(v => v !== ''),
    CardsRand: num(r.CardsRand), ItemsRand: num(r.ItemsRand),
    ItemRandSlots: [r.ItemRandSlot1,r.ItemRandSlot2,r.ItemRandSlot3,r.ItemRandSlot4].filter(v => v !== ''),
  }));
}

// ── 공통 유틸 ────────────────────────────────────────────────────────────────

async function loadJSZip() {
  return new Promise((resolve, reject) => {
    if (window.JSZip) return resolve();
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function withBtn(btnId, label, fn) {
  const btn = document.getElementById(btnId);
  const set = t => { if (btn) { btn.textContent = t; btn.disabled = t !== label; } };
  set('⏳ 처리 중...');
  fn(set).catch(e => alert('오류: ' + e.message)).finally(() => set(label));
}

// ── 전체 빌드 핸들러 ─────────────────────────────────────────────────────────

async function buildAndDownloadData() {
  withBtn('btn-build-data', '📦 JSON 전체 다운로드', async (set) => {
    await loadJSZip();
    set('⏳ 시트 읽는 중...');

    const [
      strRows, traitRows, teamRows, rarityRows, intentRows,
      abilRows, statusRows, cardRows,
      champRows, enemyRows, deckRows,
      mapRows, randRows, fixedWidthRows, fixedEvtRows,
      battleRows, extraRows, choiceRows, tradeRows, effectRows, otherRows, shopRows,
    ] = await Promise.all([
      fetchSheet('StringTBL_KR'),
      fetchSheet('CardTraitTBL'), fetchSheet('CardTeamTBL'),
      fetchSheet('CardRarityTBL'), fetchSheet('CardIntentTBL'),
      fetchSheet('CardAbilityTBL'), fetchSheet('CardStatusTBL'), fetchSheet('CardTBL'),
      fetchSheet('ChampionTBL'), fetchSheet('EnemyTBL'), fetchSheet('StartCardDeckTBL'),
      fetchSheet('MapTBL'), fetchSheet('MapRandomEventTBL'),
      fetchSheet('MapFixedWidthTBL'), fetchSheet('MapFixedEventTBL'),
      fetchSheet('MapEvent_BattleTBL'), fetchSheet('ExtraEnemyTBL'),
      fetchSheet('MapEvent_ChoiceTBL'), fetchSheet('MapEvent_TradeTBL'),
      fetchSheet('MapEvent_EffectTBL'), fetchSheet('MapEvent_OtherTBL'),
      fetchSheet('MapEvent_ShopTBL'),
    ]);

    set('⏳ JSON 변환 중...');
    const zip = new JSZip();
    zip.file('strings.json',   JSON.stringify(buildStrings(strRows), null, 2));
    zip.file('metadata.json',  JSON.stringify({
      traits: buildTraits(traitRows), teams: buildTeams(teamRows),
      rarities: buildRarities(rarityRows), intents: buildIntents(intentRows),
    }, null, 2));
    zip.file('abilities.json', JSON.stringify(buildAbilities(abilRows), null, 2));
    zip.file('statuses.json',  JSON.stringify(buildStatuses(statusRows), null, 2));
    zip.file('cards.json',     JSON.stringify(buildCards(cardRows), null, 2));
    zip.file('champions.json', JSON.stringify(buildChampions(champRows), null, 2));
    zip.file('enemies.json',   JSON.stringify({
      enemies: buildEnemies(enemyRows), decks: buildDecks(deckRows),
    }, null, 2));
    zip.file('maps.json',      JSON.stringify({
      maps:         buildMaps(mapRows),
      randomEvents: buildMapRandomEvents(randRows),
      fixedWidths:  buildMapFixedWidth(fixedWidthRows),
      fixedEvents:  buildMapFixedEvents(fixedEvtRows),
      battleEvents: buildBattleEvents(battleRows),
      extraEnemies: buildExtraEnemies(extraRows),
      choiceEvents: buildChoiceEvents(choiceRows),
      tradeEvents:  buildTradeEvents(tradeRows),
      effectEvents: buildEffectEvents(effectRows),
      otherEvents:  buildOtherEvents(otherRows),
      shopEvents:   buildShopEvents(shopRows),
    }, null, 2));

    set('⏳ ZIP 생성 중...');
    downloadBlob(await zip.generateAsync({ type: 'blob' }), 'gamedata.zip');
  });
}
