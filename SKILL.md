---
name: mteam-pt
description: Search/filter/rank and download M-Team torrents (movie/tvshow) into configured DOWNLOAD_DIR
user-invocable: true
command-dispatch: tool
command-arg-mode: raw
metadata:
  {
    "clawdbot":
      {
        "requires":
          { "bins": ["node"], "env": ["MTEAM_API_KEY", "DOWNLOAD_DIR"] },
        "primaryEnv": "MTEAM_API_KEY",
      },
  }
---

Use this skill to search and download `.torrent` files from M-Team via its API.

## How to use (chat)

Ask naturally, e.g.:

- "搜电视剧：越狱"
- "搜电影：哪吒"
- "下载第 1 个"

## What this skill does

- Searches torrents (`mode`: movie/tvshow/normal)
- Ranks results with a preference for:
  - higher `timesCompleted`
  - higher `seeders`
  - smaller `size`
- Displays UI-friendly fields (title/relative time/size/rating/tags/discount badge)
- Downloads a selected torrent into the configured `DOWNLOAD_DIR`

## Manual CLI (debug)

From repo root:

```bash
node {baseDir}/src/cli.js doctor
node {baseDir}/src/cli.js search --keyword "哪吒" --mode movie
node {baseDir}/src/cli.js download --keyword "哪吒" --mode movie --pick 1
node {baseDir}/src/cli.js download --id 123456
```

## Env

Create `{baseDir}/.env`:

- `MTEAM_API_KEY` (required)
- `MTEAM_BASE_URL` (optional, default `https://api.m-team.cc`)
- `DOWNLOAD_DIR` (required)
- `HTTP_TIMEOUT_MS` (optional, default `20000`)
