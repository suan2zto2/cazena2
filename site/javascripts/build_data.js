// ─── 구글 시트 → JSON 변환 (브라우저 전용) ───────────────────────────────────
// 시트가 "링크가 있는 사람 모두 보기"로 공개되어 있어야 동작합니다.

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

function csvToRows(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1)
    .filter(l => l.trim() !== '')
    .map(line => {
      const vals = parseCSVLine(line);
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
    });
}

async function fetchSheet(name) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${name}`;
  const res = await fetch(url, { credentials: 'omit' });
  if (!res.ok) throw new Error(`"${name}" 시트 로드 실패 (${res.status}). 시트가 공개 설정인지 확인하세요.`);
  return csvToRows(await res.text());
}

// ── 변환 헬퍼 ────────────────────────────────────────────────────────────────

const num  = v => (v === '' ? 0 : Number(v));
const bool = v => v.toUpperCase() === 'TRUE';
const opt  = (v, fn) => v.trim() !== '' ? fn(v) : undefined;
const nums = v => v.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));

// ── 변환 함수 (fetchSheets.ts 와 동일 로직) ──────────────────────────────────

function buildChapters(chapterRows, actConfigRows) {
  const actsByChapter = new Map();
  for (const r of actConfigRows) {
    if (!actsByChapter.has(r.chapterId)) actsByChapter.set(r.chapterId, []);
    actsByChapter.get(r.chapterId).push({
      actNumber: num(r.actNumber),
      stageCount: num(r.stageCount),
      supplyPositions: r.supplyPositions.trim() !== '' ? nums(r.supplyPositions) : [],
      bossMonsterId: r.bossMonsterId,
    });
  }
  return chapterRows.map(r => ({
    id: r.id,
    title: r.title,
    storyType: r.storyType,
    actCount: num(r.actCount),
    acts: (actsByChapter.get(r.id) ?? []).sort((a, b) => a.actNumber - b.actNumber),
  }));
}

function buildStages(stageRows, smRows) {
  const byStage = new Map();
  for (const r of smRows) {
    if (!byStage.has(r.stageId)) byStage.set(r.stageId, []);
    byStage.get(r.stageId).push({ monsterId: r.monsterId, position: num(r.position) });
  }
  return stageRows.map(r => {
    const base = { id: r.id, chapterId: r.chapterId, actNumber: num(r.actNumber), stageType: r.stageType };
    if (r.stageType === 'SUPPLY' || r.stageType === 'UNKNOWN') return base;
    return {
      ...base,
      maxSlides: num(r.maxSlides),
      tileSpawnConfig: { values: nums(r.tileValues), weights: nums(r.tileWeights) },
      monsters: (byStage.get(r.id) ?? []).sort((a, b) => a.position - b.position),
    };
  });
}

function buildStoryScenes(rows) {
  return rows.map(r => ({
    id: r.id,
    chapterId: r.chapterId,
    triggerType: r.triggerType,
    sceneAssetId: r.sceneAssetId,
    ...opt(r.monsterId, v => ({ monsterId: v })),
    ...opt(r.stageId,   v => ({ stageId:   v })),
  }));
}

function buildCharacters(rows) {
  return rows.map(r => ({ id: r.id, name: r.name, baseHp: num(r.baseHp), isDlc: bool(r.isDlc) }));
}

function buildCards(rows) {
  return rows.map(r => ({
    id: r.id,
    ownerCharacterId: r.ownerCharacterId,
    name: r.name,
    tileRank: r.tileRank,
    effectType: r.effectType,
    effectParams: {
      targetType: r.targetType,
      ...opt(r.damage,      v => ({ damage:      num(v) })),
      ...opt(r.healAmount,  v => ({ healAmount:   num(v) })),
      ...opt(r.buffId,      v => ({ buffId:       v })),
      ...opt(r.debuffId,    v => ({ debuffId:     v })),
      ...opt(r.duration,    v => ({ duration:     num(v) })),
    },
    ...opt(r.upgradedTileRank, v => ({ upgradedTileRank: v })),
  }));
}

function buildEnemyAction(r) {
  return {
    actionType: r.actionType,
    targetMode: r.targetMode,
    power: num(r.power),
    ...opt(r.effectId,       v => ({ effectId:       v })),
    ...opt(r.effectDuration, v => ({ effectDuration: num(v) })),
    resetCount: num(r.resetCount),
    ...opt(r.scheduledTurns, v => ({ scheduledTurns: nums(v) })),
  };
}

function buildActionPattern(actions, initialCount) {
  const sorted = actions.filter(r => r.role === 'action').sort((a, b) => num(a.orderIndex) - num(b.orderIndex));
  const def = actions.find(r => r.role === 'default') ?? sorted[0];
  return { initialCount, actions: sorted.map(buildEnemyAction), defaultAction: buildEnemyAction(def) };
}

function buildMonsters(monsterRows, actionRows, bossPhaseRows) {
  return monsterRows.map(r => {
    const myActions = actionRows.filter(a => a.monsterId === r.id);
    const actionPattern = buildActionPattern(myActions.filter(a => a.phase === '1'), num(r.initialCount));

    const phaseThresholds = r.enemyType !== 'BOSS' ? undefined :
      bossPhaseRows
        .filter(p => p.monsterId === r.id)
        .sort((a, b) => num(b.triggerValue) - num(a.triggerValue))
        .map(p => {
          const pa = myActions.filter(a => a.phase === p.phaseNumber);
          const tr = pa.find(a => a.role === 'transition');
          return {
            phaseNumber: num(p.phaseNumber),
            triggerValue: num(p.triggerValue),
            actionPattern: buildActionPattern(pa, num(p.initialCount)),
            ...tr && { transitionAction: buildEnemyAction(tr) },
          };
        });

    return {
      id: r.id, displayName: r.displayName, enemyType: r.enemyType,
      maxHp: num(r.maxHp), initialShield: num(r.initialShield),
      actionPattern, ...phaseThresholds && { phaseThresholds },
    };
  });
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

// ── 개별 파일 핸들러 ──────────────────────────────────────────────────────────

async function buildChaptersJson(btnId) {
  withBtn(btnId, '🔄 JSON 만들기', async (set) => {
    await loadJSZip();
    set('⏳ 시트 읽는 중...');
    const [chapterRows, actConfigRows] = await Promise.all([fetchSheet('Chapter'), fetchSheet('ActConfig')]);
    const data = JSON.stringify(buildChapters(chapterRows, actConfigRows), null, 2);
    downloadBlob(new Blob([data], { type: 'application/json' }), 'chapters.json');
  });
}

async function buildStagesJson(btnId) {
  withBtn(btnId, '🔄 JSON 만들기', async (set) => {
    await loadJSZip();
    set('⏳ 시트 읽는 중...');
    const [stageRows, smRows] = await Promise.all([fetchSheet('Stage'), fetchSheet('StageMonster')]);
    const data = JSON.stringify(buildStages(stageRows, smRows), null, 2);
    downloadBlob(new Blob([data], { type: 'application/json' }), 'stages.json');
  });
}

async function buildCharactersJson(btnId) {
  withBtn(btnId, '🔄 JSON 만들기', async (set) => {
    await loadJSZip();
    set('⏳ 시트 읽는 중...');
    const data = JSON.stringify(buildCharacters(await fetchSheet('Character')), null, 2);
    downloadBlob(new Blob([data], { type: 'application/json' }), 'characters.json');
  });
}

async function buildCardsJson(btnId) {
  withBtn(btnId, '🔄 JSON 만들기', async (set) => {
    await loadJSZip();
    set('⏳ 시트 읽는 중...');
    const data = JSON.stringify(buildCards(await fetchSheet('Card')), null, 2);
    downloadBlob(new Blob([data], { type: 'application/json' }), 'cards.json');
  });
}

async function buildMonstersJson(btnId) {
  withBtn(btnId, '🔄 JSON 만들기', async (set) => {
    await loadJSZip();
    set('⏳ 시트 읽는 중...');
    const [monRows, actRows, bpRows] = await Promise.all([
      fetchSheet('Monster'), fetchSheet('MonsterAction'), fetchSheet('BossPhase'),
    ]);
    const data = JSON.stringify(buildMonsters(monRows, actRows, bpRows), null, 2);
    downloadBlob(new Blob([data], { type: 'application/json' }), 'monsters.json');
  });
}

async function buildStoryScenesJson(btnId) {
  withBtn(btnId, '🔄 JSON 만들기', async (set) => {
    await loadJSZip();
    set('⏳ 시트 읽는 중...');
    const data = JSON.stringify(buildStoryScenes(await fetchSheet('StoryScene')), null, 2);
    downloadBlob(new Blob([data], { type: 'application/json' }), 'story_scenes.json');
  });
}

// ── 전체 빌드 핸들러 ─────────────────────────────────────────────────────────

async function buildAndDownloadData() {
  withBtn('btn-build-data', '🔄 구글 시트에서 JSON 만들기 (전체)', async (set) => {
    await loadJSZip();
    set('⏳ 시트 읽는 중...');
    const [
      chapterRows, actConfigRows,
      stageRows, smRows,
      charRows, cardRows,
      monRows, actRows, bpRows,
      sceneRows,
    ] = await Promise.all([
      fetchSheet('Chapter'), fetchSheet('ActConfig'),
      fetchSheet('Stage'), fetchSheet('StageMonster'),
      fetchSheet('Character'), fetchSheet('Card'),
      fetchSheet('Monster'), fetchSheet('MonsterAction'), fetchSheet('BossPhase'),
      fetchSheet('StoryScene'),
    ]);

    set('⏳ JSON 변환 중...');
    const zip = new JSZip();
    zip.file('chapters.json',     JSON.stringify(buildChapters(chapterRows, actConfigRows), null, 2));
    zip.file('stages.json',       JSON.stringify(buildStages(stageRows, smRows),            null, 2));
    zip.file('characters.json',   JSON.stringify(buildCharacters(charRows),                 null, 2));
    zip.file('cards.json',        JSON.stringify(buildCards(cardRows),                      null, 2));
    zip.file('monsters.json',     JSON.stringify(buildMonsters(monRows, actRows, bpRows),   null, 2));
    zip.file('story_scenes.json', JSON.stringify(buildStoryScenes(sceneRows),               null, 2));

    downloadBlob(await zip.generateAsync({ type: 'blob' }), 'tessera_weaver_data.zip');
  });
}
