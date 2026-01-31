function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function formatBytes(bytesLike) {
  const bytes = toNumber(bytesLike, 0);
  if (!bytes) return '?';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const digits = i === 0 ? 0 : v >= 100 ? 0 : v >= 10 ? 1 : 2;
  return `${v.toFixed(digits)} ${units[i]}`;
}

export function formatCompactInt(nLike) {
  const n = toNumber(nLike, 0);
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

export function formatRelativeTime(dateString) {
  const d = new Date(String(dateString).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(dateString || '');

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}小时前`;

  const diffDay = Math.floor(diffHr / 24);
  const pad2 = (x) => String(x).padStart(2, '0');
  const hhmm = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

  if (diffDay === 1) return `昨天 ${hhmm}`;
  if (diffDay < 7) return `${diffDay}天前`;

  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd} ${hhmm}`;
}

export function mapUiFields(t) {
  const title = t?.smallDescr || t?.name || '(no title)';
  const createdAt = formatRelativeTime(t?.createdDate);
  const size = formatBytes(t?.size);

  const imdb = t?.imdbRating;
  const douban = t?.doubanRating;
  const rating = imdb ? `IMDB: ${imdb}` : douban ? `Douban: ${douban}` : '';

  const tags = Array.isArray(t?.labelsNew) ? t.labelsNew.slice(0, 5) : [];

  const discount = t?.status?.discount || '';
  const seeders = t?.status?.seeders ?? '';
  const leechers = t?.status?.leechers ?? '';
  const completed = formatCompactInt(t?.status?.timesCompleted);

  return {
    title,
    createdAt,
    size,
    rating,
    tags,
    discount,
    seeders,
    leechers,
    completed,
  };
}

export function discountLabel(discount) {
  switch (discount) {
    case 'FREE':
      return '免费';
    case 'PERCENT_50':
      return '50%';
    case 'PERCENT_30':
      return '30%';
    case 'PERCENT_70':
      return '70%';
    case '_2X_FREE':
      return '2X+免费';
    case '_2X':
      return '2X';
    case '_2X_PERCENT_50':
      return '2X+50%';
    default:
      return '';
  }
}
