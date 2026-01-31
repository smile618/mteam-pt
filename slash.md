# mteam-pt slash command

This skill is configured with:
- user-invocable: true
- command-dispatch: tool
- command-tool: exec
- command-arg-mode: raw

That means invoking `/mteam-pt ...` will directly call the `exec` tool with the raw args string.

Examples:

- Search movie:
  `/mteam-pt /run/current-system/sw/bin/node /Users/fox/clawd/skills/mteam-pt/src/cli.js search --keyword "哪吒" --mode movie --page 1 --pageSize 20`

- Search tvshow:
  `/mteam-pt /run/current-system/sw/bin/node /Users/fox/clawd/skills/mteam-pt/src/cli.js search --keyword "越狱" --mode tvshow --page 1 --pageSize 20`

- Download by id:
  `/mteam-pt /run/current-system/sw/bin/node /Users/fox/clawd/skills/mteam-pt/src/cli.js download --id 1027701`
