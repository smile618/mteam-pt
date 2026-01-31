# mteam-pt CLI usage (local)

This documents the agreed usage pattern for this workspace.

## Search movies

Command:

```sh
/run/current-system/sw/bin/node /Users/fox/clawd/skills/mteam-pt/src/cli.js search \
  --keyword "<keyword>" \
  --mode movie \
  --page <page> \
  --pageSize <pageSize>
```

Example:

```sh
/run/current-system/sw/bin/node /Users/fox/clawd/skills/mteam-pt/src/cli.js search --keyword "哪吒" --mode movie --page 1 --pageSize 20
```

Behavior:
- Use this when the user says "搜电影：<keyword>".
- Show results and ask the user which item to download.

## Download

Command:

```sh
/run/current-system/sw/bin/node /Users/fox/clawd/skills/mteam-pt/src/cli.js download --id <id>
```

Example:

```sh
/run/current-system/sw/bin/node /Users/fox/clawd/skills/mteam-pt/src/cli.js download --id 1027701
```

Notes:
- The user selects the target by `id` from the search results.
- Do not download until the user confirms the `id`.
