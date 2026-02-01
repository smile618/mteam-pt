import fs from 'node:fs';
import path from 'node:path';

export async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

function sanitizeFilename(name) {
  // Keep torrent filenames readable but also safely short for common filesystems.
  return String(name)
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function ensureTorrentExt(base) {
  return base.toLowerCase().endsWith('.torrent') ? base : `${base}.torrent`;
}

export async function downloadToFile(url, { dir, filename } = {}) {
  await ensureDir(dir);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);

  const base = sanitizeFilename(filename || 'download.torrent') || 'download.torrent';
  const outPath = path.resolve(dir, ensureTorrentExt(base));

  const buf = Buffer.from(await res.arrayBuffer());
  await fs.promises.writeFile(outPath, buf);

  return outPath;
}
