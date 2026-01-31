import path from 'node:path';
import { loadDotEnv, getEnv } from './env.js';
import { MTeamClient } from './mteam-api.js';
import { rankTorrents } from './rank.js';
import { mapUiFields, discountLabel } from './format.js';
import { downloadToFile } from './download.js';

// Keep last search results in-memory for this process run.
let lastResults = [];

function parseModeFromText(text) {
  const t = String(text || '').toLowerCase();
  if (t.includes('电视剧') || t.includes('tvshow') || t.includes('剧')) return 'tvshow';
  if (t.includes('电影') || t.includes('movie') || t.includes('片')) return 'movie';
  return 'normal';
}

function extractKeyword(text) {
  // Accept "搜电视剧：越狱" / "搜索 movie: 沙丘" / "search --keyword xxx".
  const s = String(text || '').trim();
  const m = s.match(/[:：]\s*(.+)$/);
  if (m) return m[1].trim();

  const m2 = s.match(/--keyword\s+"?([^\n\r"]+)"?/);
  if (m2) return m2[1].trim();

  // Fallback: strip leading verbs.
  return s.replace(/^(帮我)?(搜索|搜|search)\s*/i, '').trim();
}

function extractPick(text) {
  const s = String(text || '');
  // "下载第 3 个" / "下3" / "下载 3"
  const m = s.match(/第\s*(\d+)\s*(个|条)?/);
  if (m) return Number(m[1]);
  const m2 = s.match(/\b(\d+)\b/);
  if (m2) return Number(m2[1]);
  return null;
}

function renderList(torrents, { limit = 20 } = {}) {
  const ranked = rankTorrents(torrents).slice(0, limit);
  const lines = [];
  for (let i = 0; i < ranked.length; i++) {
    const t = ranked[i];
    const ui = mapUiFields(t);
    const badge = discountLabel(ui.discount);

    lines.push(
      `${i + 1}. [${t.id}] ${ui.title}`,
    );
    lines.push(
      `   ${ui.createdAt} | ${ui.size}${ui.rating ? ' | ' + ui.rating : ''}`,
    );
    lines.push(
      `   Tags: ${ui.tags.length ? ui.tags.join(', ') : '-'}${badge ? ' | ' + badge : ''}`,
    );
    lines.push(
      `   Seeders: ${ui.seeders} | Leechers: ${ui.leechers} | Completed: ${ui.completed}`,
    );
  }
  return lines.join('\n');
}

export async function handleChat(text) {
  // Load env from skill folder.
  loadDotEnv(path.resolve(path.dirname(new URL(import.meta.url).pathname), '../.env'));
  loadDotEnv();

  const apiKey = getEnv('MTEAM_API_KEY', { required: true });
  const baseUrl = getEnv('MTEAM_BASE_URL', { fallback: 'https://api.m-team.cc' });
  const downloadDir = getEnv('DOWNLOAD_DIR', { required: true });
  const timeoutMs = getEnv('HTTP_TIMEOUT_MS', { fallback: '20000' });

  const client = new MTeamClient({ apiKey, baseUrl, timeoutMs });

  const s = String(text || '').trim();

  if (/^(doctor|检查|校验)/i.test(s)) {
    const r = await client.validateApiKey();
    return r.isValid ? 'OK: API key valid.' : `FAIL: ${r.errorMessage}`;
  }

  if (s.includes('下载') || s.toLowerCase().startsWith('download')) {
    const pick = extractPick(s);
    if (!pick || pick < 1) {
      return '请说："下载第 N 个"（先搜索一次），或直接给 torrentId："下载 id=123456"。';
    }
    const t = lastResults[pick - 1];
    if (!t) return `没有找到第 ${pick} 个。你可以先 "搜电视剧：越狱" 再下载。`;

    const url = await client.genDlToken(t.id);
    const name = t.smallDescr || t.name || `mteam_${t.id}`;
    const filename = `${name}__${t.id}.torrent`;
    const out = await downloadToFile(url, { dir: path.resolve(process.cwd(), downloadDir), filename });
    return `已下载：${out}`;
  }

  // Default: search
  const mode = parseModeFromText(s);
  const keyword = extractKeyword(s);
  if (!keyword) return '请提供关键词，例如："搜电视剧：越狱"';

  const res = await client.searchTorrents({ keyword, mode, pageNumber: 1, pageSize: 20 });
  const ranked = rankTorrents(res.torrents);
  lastResults = ranked;

  const header = `找到 ${ranked.length} 条（按 已完成/做种优先、体积更小 优先排序）。回复："下载第 1 个" 即可下载。`;
  return `${header}\n\n${renderList(ranked, { limit: 20 })}`;
}

// CLI entry: node agent.js "搜电视剧：越狱"
if (import.meta.url === `file://${process.argv[1]}`) {
  const input = process.argv.slice(2).join(' ');
  handleChat(input)
    .then((out) => {
      process.stdout.write(String(out || '') + '\n');
    })
    .catch((e) => {
      process.stderr.write((e?.message || String(e)) + '\n');
      process.exit(1);
    });
}
