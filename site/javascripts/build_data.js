// ─── 구글 시트 → JSON 변환 (브라우저 전용) ───────────────────────────────────
// 시트가 "링크가 있는 사람 모두 보기"로 공개되어 있어야 동작합니다.
// gviz CSV: 복수 헤더 행(한글/설명/영문)을 한 줄로 합산 → "한글명 설명 EnglishKey"
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
  // 중복 헤더 처리 (예: CardAbilityTBL의 T_conditions_1/2/3)
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
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
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
  return rows.map(r => ({ uid: num(r.UID), kr: r.KR }));
}

function buildTraits(rows) {
  return rows.map(r => ({
    id: r.ID, titleStringId: num(r.TitleStringID), descStringId: num(r.DescStringID), icon: r.Icon,
  }));
}

function buildTeams(rows) {
  return rows.map(r => ({
    id: r.ID, titleStringId: num(r.TitleStringID), icon: r.Icon, color: r.Color,
  }));
}

function buildRarities(rows) {
  return rows.map(r => ({
    id: r.ID, titleStringId: num(r.TitleStringID), icon: r.Icon, probability: num(r.Probability),
  }));
}

function buildIntents(rows) {
  return rows.map(r => ({
    id: r.ID, isShow: bool(r.IsShow), priority: num(r.Priority),
    titleStringId: num(r.TitleStringID), descStringId: num(r.DescStringID), icon: r.Icon,
  }));
}

function buildAbilities(rows) {
  // T_conditions_1/2/3 중복: 첫 번째=트리거 조건, 두 번째(_2)=대상 조건
  return rows.map(r => ({
    type: r.Type, id: r.ID,
    selectTrigger: r.selectTtrigger, trigger: num(r.trigger),
    ...opt(r.T_conditions_1,   v => ({ trigCond1: v })),
    ...opt(r.T_conditions_2,   v => ({ trigCond2: v })),
    ...opt(r.T_conditions_3,   v => ({ trigCond3: v })),
    selectTarget: r.selectTarget, target: num(r.Target),
    ...opt(r.T_conditions_1_2, v => ({ tgtCond1: v })),
    ...opt(r.T_conditions_2_2, v => ({ tgtCond2: v })),
    ...opt(r.T_conditions_3_2, v => ({ tgtCond3: v })),
    ...opt(r.Effect1,          v => ({ effect1: v })),
    ...opt(r.Effect2,          v => ({ effect2: v })),
    ...opt(r.Status1,          v => ({ status1: v })),
    ...opt(r.Status2,          v => ({ status2: v })),
    ...opt(r.EffectValue,      v => ({ effectValue: num(v) })),
    ...opt(r.UpgradeValue,     v => ({ upgradeValue: num(v) })),
    ...opt(r.SelectUpBonus,    v => ({ selectUpBonus: v })),
    ...opt(r.UpgradeBonus,     v => ({ upgradeBonus: num(v) })),
    ...opt(r.Chain_Ability,    v => ({ chainAbility: v })),
    ...opt(r.Target_Fx,        v => ({ targetFx: v })),
  }));
}

function buildStatuses(rows) {
  return rows.map(r => ({
    id: r.ID,
    selectEffect: r.selectEffect, statusEffect: num(r.StatusEffect),
    selectDuration: r.selectDuration, statusDuration: num(r.StatusDuration),
    isNegative: bool(r.IsNegative),
    titleStringId: num(r.TitleStringID), descStringId: num(r.DescStringID),
    icon: r.Icon,
    ...opt(r.Fx,        v => ({ fx: v })),
    ...opt(r.Animation, v => ({ animation: v })),
  }));
}

function buildCards(rows) {
  return rows.map(r => ({
    type: r.Type, id: r.ID,
    titleStringId: num(r.TitleStringID), descStringId: num(r.DescStringID),
    artIcon: r.ArtIcon, artFull: r.ArtFull,
    cardType: num(r.CardType), itemType: num(r.ItemType),
    team: r.Team, rarity: r.Rarity, mana: num(r.Mana),
    ...opt(r.Trait1,    v => ({ trait1: v })),
    ...opt(r.Trait2,    v => ({ trait2: v })),
    ...opt(r.Ability1,  v => ({ ability1: v })),
    ...opt(r.Ability2,  v => ({ ability2: v })),
    ...opt(r.Ability3,  v => ({ ability3: v })),
    ...opt(r.Ability4,  v => ({ ability4: v })),
    upgradeMax: num(r.UpgradeMax), upgradeMana: num(r.UpgradeMana), shopCost: num(r.ShopCost),
    ...opt(r.Intent,    v => ({ intent: v })),
    ...opt(r.SpawnFx,   v => ({ spawnFx: v })),
    ...opt(r.SpawnAudio,v => ({ spawnAudio: v })),
    casterAnim: r.CasterAnim,
    ...opt(r.TargetAnim,v => ({ targetAnim: v })),
    availability: num(r.Availability),
  }));
}

function buildChampions(rows) {
  return rows.map(r => ({
    id: r.ID, titleStringId: num(r.TitleStringID),
    artFull: r.ArtFull, artPortrait: r.ArtPortrait, prefab: r.Prefab,
    hp: num(r.HP), speed: num(r.Speed), hand: num(r.Hand), energy: num(r.Energy),
    lvUpHp: num(r.LvUp_HP), lvUpSpeed: num(r.LvUp_Speed), lvUpHand: num(r.LvUp_Hand), lvUpEnergy: num(r.LvUp_Energy),
    team: r.Team, startDeck: r.StartDeck,
    ...opt(r.Reward_Card1, v => ({ rewardCard1: v })),
    ...opt(r.Reward_Card2, v => ({ rewardCard2: v })),
  }));
}

function buildEnemies(rows) {
  return rows.map(r => ({
    id: r.ID, titleStringId: num(r.TitleStringID),
    artFull: r.ArtFull, artPortrait: r.ArtPortrait, prefab: r.Prefab,
    hp: num(r.HP), speed: num(r.Speed), hand: num(r.Hand), energy: num(r.Energy),
    lvUpMax: num(r.LvUp_Max), lvUpHp: num(r.LvUp_HP), lvUpSpeed: num(r.LvUp_Speed),
    lvUpHand: num(r.LvUp_Hand), lvUpEnergy: num(r.LvUp_Energy),
    behavior: r.Behavior,
    ...opt(r.Trait1,   v => ({ trait1: v })),
    ...opt(r.Ability1, v => ({ ability1: v })),
    cardDeck: r.CardDeck, rewardGold: num(r.Reward_Gold), rewardXP: num(r.Reward_XP),
    ...opt(r.Spawn_Fx, v => ({ spawnFx: v })),
  }));
}

function buildDecks(rows) {
  return rows.map(r => ({
    type: r.Type, id: r.ID,
    slots: [r.slot1,r.slot2,r.slot3,r.slot4,r.slot5,r.slot6,r.slot7,r.slot8,r.slot9,r.slot10]
      .filter(s => s !== ''),
  }));
}

function buildMaps(rows) {
  return rows.map(r => ({
    id: r.ID, titleStringId: num(r.TitleStringID),
    mapScene: r.MapScene, battleScene: r.BattleScene,
    depth: num(r.Depth), widthMin: num(r.Width_min), widthMax: num(r.Width_max),
    forkProbability: num(r.Fork_probability),
    randomEventId: r.RandomEventID,
    ...opt(r.FixedWidthID,  v => ({ fixedWidthId: v })),
    ...opt(r.FixedEventID,  v => ({ fixedEventId: v })),
    ...opt(r.Map_tutorial,  v => ({ mapTutorial: v })),
  }));
}

function buildMapRandomEvents(rows) {
  return rows.map(r => ({
    id: r.ID, selectType: r.Select_type, type: num(r.Type), eventId: r.EventID,
  }));
}

function buildMapFixedWidth(rows) {
  return rows.map(r => ({
    id: r.ID,
    depths: [1,2,3,4,5,6,7,8,9,10,11,12].map(i => num(r[`Depth${i}`])),
  }));
}

function buildMapFixedEvents(rows) {
  return rows.map(r => ({
    id: r.ID, depth: num(r.Depth), indexMin: num(r.Index_min), indexMax: num(r.Index_max), eventId: r.EventID,
  }));
}

function buildBattleEvents(rows) {
  return rows.map(r => ({
    id: r.ID, depthMin: num(r.Depth_Min), depthMax: num(r.Depth_Max),
    icon: r.Icon, enemyLevel: num(r.EnemyLevel),
    enemies: [r.Enemy1,r.Enemy2,r.Enemy3,r.Enemy4].filter(e => e !== ''),
    ...opt(r.ExtraEnemy,  v => ({ extraEnemy: v })),
    rewardGold: num(r.RewardGold), rewardXP: num(r.RewardXP),
    isRewardCards: bool(r.IsRewardCards),
    ...opt(r.CardRarity,  v => ({ cardRarity: v })),
    isRewardItem: bool(r.IsRewardItem),
    ...opt(r.ItemRarity,  v => ({ itemRarity: v })),
    ...opt(r.ItemTeam,    v => ({ itemTeam: v })),
    ...opt(r.Tutorial,    v => ({ tutorial: v })),
    ...opt(r.Win_Event,   v => ({ winEvent: v })),
  }));
}

function buildExtraEnemies(rows) {
  // Champion_Min·Enemy1~4 세트가 2쌍 → 중복 헤더 _2 접미사
  return rows.map(r => ({
    id: r.ID,
    cond1: {
      championMin: num(r.Champion_Min),
      enemies: [r.Enemy1,r.Enemy2,r.Enemy3,r.Enemy4].filter(e => e !== ''),
    },
    cond2: {
      championMin: num(r.Champion_Min_2),
      enemies: [r.Enemy1_2,r.Enemy2_2,r.Enemy3_2,r.Enemy4_2].filter(e => e !== ''),
    },
  }));
}

function buildChoiceEvents(rows) {
  return rows.map(r => {
    const choices = [];
    for (let i = 1; i <= 4; i++) {
      const effect = r[`Choise${i}_Effect`];
      if (effect && effect !== '') {
        choices.push({ title: r[`Choise${i}_Title`], desc: r[`Choise${i}_Desc`], effect });
      }
    }
    return {
      id: r.ID, depthMin: num(r.Depth_Min), depthMax: num(r.Depth_Max),
      icon: r.Icon, descStringId: num(r.DescStringID), choices,
    };
  });
}

function buildTradeEvents(rows) {
  return rows.map(r => ({
    id: r.ID, icon: r.Icon,
    selectEventTarget: r.SelectEventTarget, eventTarget: num(r.EventTarget),
    ...opt(r.SpendItem, v => ({ spendItem: v })),
    spendGold: num(r.SpendGold), spendHp: num(r.SpendHp),
    gainItems: [r.GainItem1,r.GainItem2,r.GainItem3].filter(v => v !== ''),
    ...opt(r.GainAlly,  v => ({ gainAlly: v })),
    gainGold: num(r.GainGold), gainXp: num(r.GainXp), gainHeal: num(r.GainHeal),
    descStringId: num(r.DescStringID),
  }));
}

function buildEffectEvents(rows) {
  return rows.map(r => ({
    id: r.ID, icon: r.Icon,
    ...opt(r.Condition1,        v => ({ condition1: v })),
    selectEventTarget: r.SelectEventTarget, eventTarget: num(r.EventTarget),
    effect1: r.Effect1,
    ...opt(r.Effect2,           v => ({ effect2: v })),
    value: num(r.Effect3),
    ...opt(r.ChainEventID,      v => ({ chainEventId: v })),
    descStringId: num(r.DescStringID),
  }));
}

function buildOtherEvents(rows) {
  return rows.map(r => ({
    id: r.ID, selectType: r.SelectType, eventType: num(r.EventType),
    icon: r.Icon, rarity: r.Rarity,
    ...opt(r.WorldState, v => ({ worldState: num(v) })),
    ...opt(r.FreeUpgrade, v => ({ freeUpgrade: v })),
  }));
}

function buildShopEvents(rows) {
  return rows.map(r => ({
    id: r.ID, depthMin: num(r.Depth_Min), depthMax: num(r.Depth_Max),
    icon: r.Icon, buyMult: num(r.Buy_mult), sellMult: num(r.Selly_mult),
    fixedItems: [r.Item1,r.Item2,r.Item3].filter(v => v !== ''),
    cardsRand: num(r.Cards_Rand), itemsRand: num(r.Items_Rand),
    itemRandSlots: [r.ItemRand_Slot1,r.ItemRand_Slot2,r.ItemRand_Slot3,r.ItemRand_Slot4].filter(v => v !== ''),
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
