import fs from 'node:fs';
import path from 'node:path';

const STATE_PATH = path.resolve(process.cwd(), '.mteam-pt.session.json');

export function saveLastList(torrents) {
  const data = {
    savedAt: new Date().toISOString(),
    torrents: (torrents || []).slice(0, 100).map((t) => ({
      id: t.id,
      name: t.name,
      smallDescr: t.smallDescr,
      createdDate: t.createdDate,
      size: t.size,
      labelsNew: t.labelsNew,
      imdbRating: t.imdbRating,
      doubanRating: t.doubanRating,
      status: t.status,
    })),
  };
  fs.writeFileSync(STATE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function loadLastList() {
  try {
    const raw = fs.readFileSync(STATE_PATH, 'utf8');
    const json = JSON.parse(raw);
    return Array.isArray(json?.torrents) ? json.torrents : [];
  } catch {
    return [];
  }
}
