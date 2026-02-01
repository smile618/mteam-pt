#!/run/current-system/sw/bin/node

import path from 'node:path';
import { loadDotEnv, getEnv } from './env.js';
import { MTeamClient } from './mteam-api.js';
import { downloadToFile } from './download.js';
import { rankTorrents } from './rank.js';
import { mapUiFields, discountLabel } from './format.js';
import { saveLastList, loadLastList } from './session-state.js';

// Load env relative to this skill folder first, then cwd.
loadDotEnv(path.resolve(path.dirname(new URL(import.meta.url).pathname), '../.env'));
loadDotEnv();

function usage(exitCode = 0) {
  const msg = `
Usage:
  mteam-pt doctor
  mteam-pt search --keyword <kw> [--mode normal|tvshow|movie] [--page N] [--pageSize N]
  mteam-pt download --id <torrentId>
  mteam-pt download --keyword <kw> [--pick N] [--mode normal|tvshow|movie] [--page N] [--pageSize N]

Env:
  MTEAM_API_KEY (required)
  MTEAM_BASE_URL (default: https://api.m-team.cc)
  DOWNLOAD_DIR (default: ./downloads)
  HTTP_TIMEOUT_MS (default: 20000)
`;
  console.log(msg.trim());
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      args._.push(a);
      continue;
    }
    const key = a.slice(2);
    const val = argv[i + 1];
    if (val === undefined || val.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = val;
      i++;
    }
  }
  return args;
}

function toInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pickMode(mode) {
  const m = String(mode || 'normal');
  if (m === 'normal' || m === 'tvshow' || m === 'movie') return m;
  throw new Error(`Invalid --mode: ${mode}`);
}

function printTorrents(torrents, { limit = 5 } = {}) {
  if (!torrents.length) {
    console.log('No results.');
    return;
  }

  const ranked = rankTorrents(torrents);
  saveLastList(ranked);

  for (let i = 0; i < Math.min(limit, ranked.length); i++) {
    const t = ranked[i];
    const idx = String(i + 1);

    const ui = mapUiFields(t);
    const badge = discountLabel(ui.discount);

    // Keep list items scannable: prefer the primary (often CN) title only.
    // Many M-Team names include multiple aliases separated by '/'.
    const title = String(ui.title).split('/')[0].trim();
    const stats = `${ui.size} | S:${ui.seeders} Done:${ui.completed}`;

    console.log(`${idx}) ${title}`);
    console.log(`   ${stats}${badge ? ' | 🏷️ ' + badge : ''}`);
    if (i !== Math.min(limit, ranked.length) - 1) console.log('');
  }
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('-h') || argv.includes('--help')) usage(0);

  const cmd = argv[0];
  const args = parseArgs(argv.slice(1));

  const apiKey = getEnv('MTEAM_API_KEY', { required: true });
  const baseUrl = getEnv('MTEAM_BASE_URL', { fallback: 'https://api.m-team.cc' });
  const downloadDir = getEnv('DOWNLOAD_DIR', { required: true });
  const timeoutMs = getEnv('HTTP_TIMEOUT_MS', { fallback: '20000' });

  const client = new MTeamClient({ apiKey, baseUrl, timeoutMs });

  if (cmd === 'doctor') {
    const r = await client.validateApiKey();
    if (r.isValid) {
      console.log('OK: API key looks valid (search API succeeded).');
      process.exit(0);
    }
    console.error(`FAIL: ${r.errorMessage}`);
    process.exit(2);
  }

  if (cmd === 'search') {
    const keyword = args.keyword ?? '';
    if (!keyword) throw new Error('Missing --keyword');

    const mode = pickMode(args.mode);
    const pageNumber = toInt(args.page ?? args.pageNumber, 1);
    const pageSize = Math.min(100, toInt(args.pageSize, 20));

    const res = await client.searchTorrents({ keyword, mode, pageNumber, pageSize });
    console.log(`Results: ${res.torrents.length} / total ${res.total} (page ${res.pageNumber}/${res.totalPages || '?'})`);
    printTorrents(res.torrents, { limit: 5 });
    return;
  }

  if (cmd === 'download') {
    const id = args.id;
    const keyword = args.keyword;

    let torrent;

    if (id) {
      torrent = { id: String(id), name: `mteam_${id}` };
    } else {
      // Allow "download --pick N" to use the last saved list (from previous search).
      const pick = Math.max(1, toInt(args.pick, 0));

      if (pick) {
        const last = loadLastList();
        torrent = last[pick - 1];
        if (!torrent) throw new Error(`Pick out of range: --pick ${pick} (last results=${last.length})`);
      } else {
        if (!keyword) throw new Error('Need --id, or --pick N, or --keyword');
        const mode = pickMode(args.mode);
        const pageNumber = toInt(args.page ?? args.pageNumber, 1);
        const pageSize = Math.min(100, toInt(args.pageSize, 20));
        const pick2 = Math.max(1, toInt(args.pick, 1));

        const res = await client.searchTorrents({ keyword, mode, pageNumber, pageSize });
        const ranked = rankTorrents(res.torrents);
        saveLastList(ranked);
        torrent = ranked[pick2 - 1];
        if (!torrent) throw new Error(`Pick out of range: --pick ${pick2} (results=${ranked.length})`);
      }
    }

    const url = await client.genDlToken(torrent.id);
    if (!url) throw new Error('genDlToken returned empty url');

    const name = torrent.smallDescr || torrent.name || `mteam_${torrent.id}`;
    const filename = `${name}__${torrent.id}.torrent`;
    const out = await downloadToFile(url, { dir: path.resolve(process.cwd(), downloadDir), filename });
    console.log(out);
    return;
  }

  usage(1);
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
