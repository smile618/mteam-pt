import fs from 'node:fs';
import path from 'node:path';

// Minimal .env loader (no external deps).
export function loadDotEnv(dotEnvPath = path.resolve(process.cwd(), '.env')) {
  try {
    const raw = fs.readFileSync(dotEnvPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // It's ok if .env doesn't exist.
  }
}

export function getEnv(name, { required = false, fallback = undefined } = {}) {
  const v = process.env[name];
  if ((v === undefined || v === '') && required) {
    throw new Error(`Missing required env: ${name}`);
  }
  return v === undefined || v === '' ? fallback : v;
}
