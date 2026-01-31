function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Higher is better.
export function scoreTorrent(t) {
  const completed = toNumber(t?.status?.timesCompleted, 0);
  const seeders = toNumber(t?.status?.seeders, 0);
  const size = toNumber(t?.size, 0);

  // Normalize size as a penalty; avoid division-by-zero.
  const sizeGiB = size > 0 ? size / (1024 ** 3) : 0;

  // Heuristics:
  // - Completed count is a strong signal.
  // - Seeders are very important.
  // - Smaller size preferred, but not at the expense of dead torrents.
  return completed * 3 + seeders * 10 - sizeGiB * 2;
}

export function rankTorrents(torrents) {
  return [...torrents]
    .map((t) => ({ t, score: scoreTorrent(t) }))
    .sort((a, b) => b.score - a.score)
    .map(({ t }) => t);
}
