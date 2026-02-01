---
name: mteam-pt
description: Search and download M-Team torrents (movies/TV shows). Use natural language like "搜电视剧：越狱" or "下载第1个".
user-invocable: true
command-dispatch: tool
command-arg-mode: raw
metadata:
  {
    "openclaw":
      {
        "emoji": "🎬",
        "requires": { "bins": ["node"], "env": ["MTEAM_API_KEY", "DOWNLOAD_DIR"] },
        "primaryEnv": "MTEAM_API_KEY"
      }
  }
---

Use this skill to search and download `.torrent` files from M-Team via its API.

## How to use (chat)

Ask naturally using Chinese or English:

**Search examples**:
- "搜电视剧：越狱"
- "搜电影：哪吒"
- "找一下权力的游戏"

**Download examples**:
- "下载第 1 个"
- "下载第 3 个种子"

## Features

- Searches torrents by keyword (supports movie/tvshow/normal modes)
- Ranks results intelligently:
  - Prioritizes higher completion count (timesCompleted)
  - Considers seeders and file size
- Displays compact, scannable results:
  - Title (primary name only)
  - Size, seeders, completion count
  - Discount badges (免费, 2X, etc.)
- Downloads selected torrent to configured DOWNLOAD_DIR

## Manual CLI (debug)

From repo root:

```bash
node {baseDir}/src/cli.js doctor
node {baseDir}/src/cli.js search --keyword "哪吒" --mode movie
node {baseDir}/src/cli.js download --keyword "哪吒" --mode movie --pick 1
node {baseDir}/src/cli.js download --id 123456
```

## Environment Variables

Create `{baseDir}/.env` or configure in `~/.openclaw/openclaw.json`:

- `MTEAM_API_KEY` (required) - Your M-Team API key
- `DOWNLOAD_DIR` (required) - Directory to save .torrent files
- `MTEAM_BASE_URL` (optional, default: `https://api.m-team.cc`)
- `HTTP_TIMEOUT_MS` (optional, default: `20000`)
