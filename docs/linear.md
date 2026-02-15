# Linear (Solo + Multi-Repo + LLM Agents)

## Setup Choice
- One Linear workspace for everything.
- Projects are per-repo/product (example: `website`, `producer-producer`).
- Keep labels minimal (type + agent): `bug`, `feature`, `chore`, `tech-debt`, `agent:ui`, `agent:build`, etc.

## Workflow (States)
- `Backlog` -> `Planned` -> `In Progress` -> `In Review` -> `Done`
- Optional: `Blocked` only if you will actually use it.

## Issue Requirements (LLM-Friendly)
Each issue must include:
- Outcome: 1 sentence describing the user-visible result.
- Acceptance criteria: 2-5 checkboxes.
- Constraints: explicit do/don't (repo rules, files to avoid, etc.).
- Verification: exact commands/pages to check.

## GitHub / PR Conventions
- Put the Linear issue ID in branch + PR title (example: `WEB-123 add docs/linear.md`).
- PR description includes: `Closes WEB-123`.
- Prefer 1 issue -> 1 PR (split only when necessary; state why).

## Repo-Specific Notes
- Follow `AGENTS.md` (commands, boundaries, verification expectations).
- For this repo: do not edit `index.html` or `src/main-index.js` (legacy).

