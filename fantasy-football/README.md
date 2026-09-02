# Yahoo Fantasy Football Draft

Working folder for draft prep, live-draft notes, and post-draft roster analysis.

## Layout

| Path | Purpose |
|---|---|
| `data/league.md` | League settings: size, scoring, roster slots, draft type |
| `data/my-team.md` | My roster (picks as they happen) |
| `data/rosters.md` | Every other team's roster |
| `analysis/` | Written analysis output |

## Getting data in

Claude runs in a remote container and cannot see the Chrome session on your
machine. Pick one:

1. **Paste** — copy the draft board / roster pages into the `data/*.md` files.
2. **Screenshot** — drop images into `data/` and attach them in chat.
3. **Local Claude Code + Playwright MCP** — run Claude Code on the machine
   where Chrome is logged in. The repo's `.mcp.json` already registers the
   Playwright MCP server; point it at your existing Chrome profile so it
   reuses the Yahoo session instead of a cold browser.
