---
title: "feat: Add Minimal Linear Task Workflow"
type: feat
status: planned
date: 2026-04-07
---

# feat: Add Minimal Linear Task Workflow

## Overview

Add a thin repo-owned Linear helper and minimal repo instructions so this repo can answer prompts like “what’s next on our task list” by checking Linear first, and can mark the active Linear issue `Done` after verified completion.

This should copy the useful part of AIHome’s approach, not the whole system:
- thin adapter
- explicit config
- machine-readable output
- no dependency on `../AIHome` at runtime

## Problem Statement / Motivation

This repo already has a short Linear policy file in [`docs/linear.md`](/Users/randy/Git/website/docs/linear.md), but it does not have an execution surface for:
- querying the repo’s actual Linear backlog
- remembering the currently active Linear issue
- moving a completed issue to `Done`

That means the assistant can only follow Linear manually or through external tools, which is fragile and not repo-local. If the goal is “ask what’s next” and have the assistant behave consistently in this repo, the repo needs a tiny first-party task workflow surface.

## Research Summary

### Existing Repo State

- [`docs/linear.md`](/Users/randy/Git/website/docs/linear.md) defines workflow and issue-writing conventions, but no helper commands or auth/config contract.
- This repo has no existing Linear helper under `scripts/`.
- This repo has no `.env.example` or other committed env contract for Linear auth.
- Existing scripts are lightweight and repo-local, so a small `scripts/linear-task.mjs` fits current patterns.

### AIHome Pattern Worth Reusing

From `../AIHome`:
- Linear integration uses the official GraphQL API through a thin repo-owned adapter.
- AIHome’s docs explicitly avoid switching to an unofficial generic CLI.
- AIHome exposes narrow commands like status/sync instead of a sprawling abstraction layer.
- AIHome treats local context as first-class and keeps machine-readable outputs available.

That pattern is the right one here. Importing AIHome directly is not.

### External Research Decision

Skipped. The repo already has the relevant local precedent (`docs/linear.md` + AIHome’s thin-adapter pattern), and this is an integration-shape decision, not a framework ambiguity.

## Proposed Solution

Implement a minimal Linear task workflow with three parts:

1. Add a small repo-local helper script:
   - `next` → select the highest-priority actionable issue from the configured `website` project backlog
   - `list` → print the actionable queue in compact order
   - `done [ISSUE_ID]` → move the target issue to `Done`

2. Add committed config for project/team/state mapping:
   - project name
   - team key/name
   - canonical workflow state names
   - default “next task” mode

3. Add concise repo instructions so assistant behavior is unambiguous:
   - when the user asks “what’s next”, check Linear first
   - when tracked work is completed and verified, mark the active issue `Done`
   - if auth/config is missing, fail explicitly and do not guess

## Technical Approach

### Files To Add / Update

| File | Change |
|---|---|
| `scripts/linear-task.mjs` | New helper for `next`, `list`, `done` |
| `.linear-task.json` | New repo config for project/team/state mapping |
| `tmp/linear-active-issue.json` | Session-local active issue context file written by helper |
| `package.json` | Add `linear:next`, `linear:list`, `linear:done` scripts |
| `AGENTS.md` | Add concise Linear task workflow instructions |
| `docs/linear.md` | Expand from policy doc to actual operator instructions |

### 1. Helper Command Surface

Add `scripts/linear-task.mjs` with these subcommands:

- `next`
  - fetch open issues for the configured project
  - choose one deterministic “next” item
  - print human-readable summary
  - optionally emit JSON with `--json`
  - write active issue context to `tmp/linear-active-issue.json`

- `list`
  - fetch actionable issues for the configured project
  - print compact ordered backlog
  - optionally emit JSON with `--json`

- `done [ISSUE_ID]`
  - resolve issue from explicit ID, active context file, or branch name
  - verify issue exists and is not already `Done`
  - move it to configured `Done` state
  - clear or refresh active issue context

### 2. Config Contract

Add committed config file `.linear-task.json` with fields like:

```json
{
  "projectName": "website",
  "teamKey": "WEB",
  "states": {
    "backlog": "Backlog",
    "planned": "Planned",
    "inProgress": "In Progress",
    "inReview": "In Review",
    "done": "Done",
    "blocked": "Blocked"
  },
  "nextMode": "project-backlog"
}
```

This keeps state naming explicit and avoids hidden assumptions inside the helper.

### 3. Active Issue Context

Use `tmp/linear-active-issue.json` as session-local memory for the last selected task.

Resolution order for `done`:
1. explicit issue ID argument
2. active issue context file
3. branch name containing issue key
4. fail and ask

This is enough to support natural “mark it done” behavior without needing a full local database.

### 4. “What’s Next” Selection Rules

Default next-task mode: `project-backlog`

Ordering:
1. `In Progress`
2. `Planned`
3. `Backlog`

Exclusions:
- exclude `Done`
- exclude `Blocked` from auto-selection
- if everything is blocked, surface blocked items clearly instead of picking one

Tie-breaks within a state bucket:
1. Linear priority descending
2. oldest updated issue first

This keeps the rule deterministic and simple.

### 5. Linear API Shape

Use the official Linear GraphQL API directly from the helper.

Needed operations:
- query project by configured name/key
- query issues for that project with state + priority + identifiers
- query workflow states for the team/project as needed
- mutation to update issue state for `done`

Keep the adapter narrow. Do not add a generic Linear wrapper layer beyond what this helper needs.

### 6. Auth Contract

Require `LINEAR_API_KEY` in environment.

Behavior:
- if missing, helper exits with a clear message
- do not silently fall back to AIHome or other tools
- document the requirement in `docs/linear.md` and `AGENTS.md`

## Acceptance Criteria

- [ ] `npm run linear:next` returns the expected top actionable issue from the `website` project
- [ ] `npm run linear:list` shows the ordered actionable backlog
- [ ] `npm run linear:done -- ISSUE-ID` moves that issue to `Done`
- [ ] `npm run linear:done` works after a prior `linear:next` call without repeating the issue ID
- [ ] Missing `LINEAR_API_KEY` fails clearly and safely
- [ ] `AGENTS.md` clearly tells the assistant to check Linear first for “what’s next”
- [ ] `AGENTS.md` clearly tells the assistant to mark verified completed work `Done`
- [ ] No runtime dependency on `../AIHome`

## Dependencies & Risks

- **Risk:** State names in the actual Linear workspace may differ from `docs/linear.md`.
  - **Mitigation:** keep state names explicit in `.linear-task.json`, not inferred in code.
- **Risk:** Project name may not uniquely identify the intended project.
  - **Mitigation:** include `teamKey` and validate project lookup at runtime.
- **Risk:** Auto-closing to `Done` may be too aggressive for some workflows.
  - **Mitigation:** document the default explicitly; allow later extension to `In Review` if needed.
- **Risk:** Session-local active issue file can become stale.
  - **Mitigation:** verify issue state before mutation; clear on success.

## Verification Plan

1. Set `LINEAR_API_KEY` in shell
2. Run:
   - `npm run linear:next`
   - `npm run linear:list`
3. Confirm selected issue matches the expected top backlog item
4. Run:
   - `npm run linear:done -- ISSUE-ID`
5. Confirm issue state in Linear changes to `Done`
6. Run:
   - `npm run linear:next`
   - `npm run linear:done`
7. Confirm active-issue fallback works
8. Run with auth removed
   - confirm clear failure message and non-zero exit

## Implementation Notes

- Keep output compact by default, with `--json` for machine-readable use.
- Keep the helper in plain Node ESM to match repo conventions.
- Avoid adding dependencies solely for env/config handling unless they already exist.
- `AGENTS.md` should be concise: enough to drive assistant behavior, not a long integration manual.

## References & Research

### Internal References

- [`docs/linear.md`](/Users/randy/Git/website/docs/linear.md)
- [`AGENTS.md`](/Users/randy/Git/website/AGENTS.md)
- [`package.json`](/Users/randy/Git/website/package.json)
- `../AIHome/docs/integrations/linear.md`
- `../AIHome/scripts/linear_status.py`

### Institutional Learnings

- Reuse AIHome’s “thin repo-owned adapter” rule.
- Do not depend on unofficial CLIs or external repo runtime coupling for core workflow behavior.
