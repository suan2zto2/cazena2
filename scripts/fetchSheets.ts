import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import type {
  Stage, Character, Card, Monster,
  EnemyAction, ActionPattern, PhaseThreshold,
  TileRank, StageType, EnemyType, CardEffectType, TargetType, ActionType, TargetMode,
} from './types';

// ─── 설정 ─────────────────────────────────────────────────────────────────────

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'service-account.json');
const SPREADSHEET_ID = process.env.SPREADSHEET_ID ?? '';
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

async function readSheet(sheets: ReturnType<typeof google.sheets>, sheetName: string): Promise<Record<string, string>[]> {
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

function num(v: string) { return Number(v); }
function bool(v: string) { return v.toUpperCase() === 'TRUE'; }
function optional<T>(v: string, fn: (s: string) => T): T | undefined {
  return v.trim() !== '' ? fn(v) : undefined;
}
function numArray(v: string): number[] {
  return v.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
}

// ─── 변환 함수 ────────────────────────────────────────────────────────────────

function buildChapters(
  chapterRows: Record<string, string>[],
  actConfigRows: Record<string, string>[],
) {
  const actsByChapter = new Map<string, object[]>();
  for (const r of actConfigRows) {
    if (!actsByChapter.has(r.chapterId)) actsByChapter.set(r.chapterId, []);
    actsByChapter.get(r.chapterId)!.push({
      actNumber: num(r.actNumber),
      stageCount: num(r.stageCount),
      supplyPositions: r.supplyPositions.trim() !== '' ? numArray(r.supplyPositions) : [],
      bossMonsterId: r.bossMonsterId,
    });
  }

  return chapterRows.map(r => ({
    id: r.id,
    title: r.title,
    storyType: r.storyType,
    actCount: num(r.actCount),
    acts: (actsByChapter.get(r.id) ?? []).sort((a: any, b: any) => a.actNumber - b.actNumber),
  }));
}

function buildStages(stageRows: Record<string, string>[], stageMonsterRows: Record<string, string>[]): Stage[] {
  const monstersByStage = new Map<string, { monsterId: string; position: number }[]>();
  for (const r of stageMonsterRows) {
    if (!monstersByStage.has(r.stageId)) monstersByStage.set(r.stageId, []);
    monstersByStage.get(r.stageId)!.push({ monsterId: r.monsterId, position: num(r.position) });
  }

  return stageRows.map(r => {
    const base = {
      id: r.id,
      chapterId: r.chapterId,
      actNumber: num(r.actNumber),
      stageType: r.stageType as StageType,
    };
    if (r.stageType === 'SUPPLY' || r.stageType === 'UNKNOWN') return base as Stage;
    return {
      ...base,
      maxSlides: num(r.maxSlides),
      tileSpawnConfig: {
        values: numArray(r.tileValues),
        weights: numArray(r.tileWeights),
      },
      monsters: (monstersByStage.get(r.id) ?? []).sort((a, b) => a.position - b.position),
    } as Stage;
  });
}

function buildCharacters(rows: Record<string, string>[]): Character[] {
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    baseHp: num(r.baseHp),
    isDlc: bool(r.isDlc),
  }));
}

function buildCards(rows: Record<string, string>[]): Card[] {
  return rows.map(r => ({
    id: r.id,
    ownerCharacterId: r.ownerCharacterId,
    name: r.name,
    tileRank: r.tileRank as TileRank,
    effectType: r.effectType as CardEffectType,
    effectParams: {
      targetType: r.targetType as TargetType,
      damage: optional(r.damage, num),
      healAmount: optional(r.healAmount, num),
      buffId: optional(r.buffId, s => s),
      debuffId: optional(r.debuffId, s => s),
      duration: optional(r.duration, num),
    },
    upgradedTileRank: optional(r.upgradedTileRank, s => s as TileRank),
  }));
}

function buildEnemyAction(r: Record<string, string>): EnemyAction {
  return {
    actionType: r.actionType as ActionType,
    targetMode: r.targetMode as TargetMode,
    power: num(r.power),
    effectId: optional(r.effectId, s => s),
    effectDuration: optional(r.effectDuration, num),
    resetCount: num(r.resetCount),
    scheduledTurns: r.scheduledTurns.trim() !== '' ? numArray(r.scheduledTurns) : undefined,
  };
}

function buildActionPattern(actions: Record<string, string>[], initialCount: number): ActionPattern {
  const actionRows = actions
    .filter(r => r.role === 'action')
    .sort((a, b) => num(a.orderIndex) - num(b.orderIndex));
  const defaultRow = actions.find(r => r.role === 'default');
  return {
    initialCount,
    actions: actionRows.map(buildEnemyAction),
    defaultAction: buildEnemyAction(defaultRow ?? actionRows[0]),
  };
}

function buildMonsters(
  monsterRows: Record<string, string>[],
  actionRows: Record<string, string>[],
  bossPhaseRows: Record<string, string>[],
): Monster[] {
  return monsterRows.map(r => {
    const myActions = actionRows.filter(a => a.monsterId === r.id);
    const phase1Actions = myActions.filter(a => a.phase === '1');
    const actionPattern = buildActionPattern(phase1Actions, num(r.initialCount));

    let phaseThresholds: PhaseThreshold[] | undefined;
    if (r.enemyType === 'BOSS') {
      const myPhases = bossPhaseRows
        .filter(p => p.monsterId === r.id)
        .sort((a, b) => num(b.triggerValue) - num(a.triggerValue));

      phaseThresholds = myPhases.map(p => {
        const phaseActions = myActions.filter(a => a.phase === p.phaseNumber);
        const transitionRow = phaseActions.find(a => a.role === 'transition');
        return {
          phaseNumber: num(p.phaseNumber),
          triggerValue: num(p.triggerValue),
          actionPattern: buildActionPattern(phaseActions, num(p.initialCount)),
          transitionAction: transitionRow ? buildEnemyAction(transitionRow) : undefined,
        };
      });
    }

    return {
      id: r.id,
      displayName: r.displayName,
      enemyType: r.enemyType as EnemyType,
      maxHp: num(r.maxHp),
      initialShield: num(r.initialShield),
      actionPattern,
      phaseThresholds,
    };
  });
}

function buildStoryScenes(rows: Record<string, string>[]) {
  return rows.map(r => ({
    id: r.id,
    chapterId: r.chapterId,
    triggerType: r.triggerType,
    sceneAssetId: r.sceneAssetId,
    ...(r.monsterId.trim() !== '' && { monsterId: r.monsterId }),
    ...(r.stageId.trim()   !== '' && { stageId:   r.stageId }),
  }));
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!SPREADSHEET_ID) {
    console.error('SPREADSHEET_ID 환경변수를 설정하거나 스크립트 상단에 직접 입력하세요.');
    process.exit(1);
  }

  console.log('Google Sheets 연결 중...');
  const sheets = await getSheets();

  console.log('시트 읽는 중...');
  const [
    chapterRows, actConfigRows,
    stageRows, stageMonsterRows,
    characterRows, cardRows,
    monsterRows, actionRows, bossPhaseRows,
    storySceneRows,
  ] = await Promise.all([
    readSheet(sheets, 'Chapter'),
    readSheet(sheets, 'ActConfig'),
    readSheet(sheets, 'Stage'),
    readSheet(sheets, 'StageMonster'),
    readSheet(sheets, 'Character'),
    readSheet(sheets, 'Card'),
    readSheet(sheets, 'Monster'),
    readSheet(sheets, 'MonsterAction'),
    readSheet(sheets, 'BossPhase'),
    readSheet(sheets, 'StoryScene'),
  ]);

  console.log('JSON 변환 중...');
  const chapters    = buildChapters(chapterRows, actConfigRows);
  const stages      = buildStages(stageRows, stageMonsterRows);
  const characters  = buildCharacters(characterRows);
  const cards       = buildCards(cardRows);
  const monsters    = buildMonsters(monsterRows, actionRows, bossPhaseRows);
  const storyScenes = buildStoryScenes(storySceneRows);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'chapters.json'),     JSON.stringify(chapters,    null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'stages.json'),       JSON.stringify(stages,      null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'characters.json'),   JSON.stringify(characters,  null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'cards.json'),        JSON.stringify(cards,       null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'monsters.json'),     JSON.stringify(monsters,    null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'story_scenes.json'), JSON.stringify(storyScenes, null, 2));

  console.log(`완료: ${OUTPUT_DIR} 에 저장됨`);
  console.log(`  chapters.json     (${chapters.length}개)`);
  console.log(`  stages.json       (${stages.length}개)`);
  console.log(`  characters.json   (${characters.length}개)`);
  console.log(`  cards.json        (${cards.length}개)`);
  console.log(`  monsters.json     (${monsters.length}개)`);
  console.log(`  story_scenes.json (${storyScenes.length}개)`);
}

main().catch(console.error);
