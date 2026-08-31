# Compound Engineering for this website

The native Codex plugin provides optional planning, code review, and learning capture. This directory configures development workflows; it is not imported by Vite or deployed as a site asset.

## Workflow

| Use | Codex invocation | Result |
| --- | --- | --- |
| Plan a substantial change | `$ce-plan <request>` | A dated plan under `docs/plans/` |
| Review a change | `$ce-code-review base:<commit-before-the-change>` | Findings only; no fixes, push, or PR |
| Check a small change quickly | `$ce-code-review quick base:<commit-before-the-change>` | The host's built-in review |
| Capture a reusable lesson | `$ce-compound` | A grounded solution under `docs/solutions/` when there is a useful lesson |
| Inspect plugin health | `$ce-setup` | Configuration and optional-tool diagnostics |

Use a real base commit for reviews: after deployment, `origin/gh-pages` already contains the implementation and would produce an empty diff. Existing plans and solutions stay in place. Small, clear fixes can use the normal direct workflow.

## Defaults

`config.yaml` is the shared configuration. `config.example.yaml` is an exact copy of the plugin's supported-settings template, included for reference. An optional `config.local.yaml` overrides ordinary keys and is ignored by git; it is not needed for this setup. `docs_root` is always read from the shared file.

- Markdown artifacts use the existing `docs/` tree.
- Planning skips redundant scope confirmation; real blockers still need an answer.
- Implementation stays on the current host/model. Automatic cross-model reviews are off.
- PR teaching sections and automatic PR monitoring are off.
- Full autonomous execution (`lfg`), cross-model delegation, PR creation, and production deployment require an explicit request. These workflow boundaries live in `AGENTS.md`; installing the plugin does not schedule or start them.
- `DESIGN.md`, npm, `playwright-cli`, the `dev` branch, and `just deploy` remain authoritative. Browser verification waits for the relevant animation state. `agent-browser` and `ast-grep` are optional; their absence in the generic health check is not a reason to replace the project browser driver or install packages.
- Reviews prioritize reproducible defects and requirement violations. Design preferences require a separate request.

## Installation and updates

Validated with Compound Engineering 3.23.4 and Codex CLI 0.151.0 on 2026-08-30. The plugin is installed in the user's Codex profile, so its skills are available across that profile; these defaults apply to this repository only.

The [installation pilot](../docs/reviews/2026-08-30-compound-engineering-pilot.md) records the health/build checks and the report-only review result, including an outstanding cached-navigation regression in the earlier video changes.

```sh
codex plugin marketplace add EveryInc/compound-engineering-plugin
codex plugin add compound-engineering@compound-engineering-plugin
```

Restart Codex after installation so the skill catalog and instructions refresh. On another machine, run the same commands and open this repository. The existing disabled Claude installation is separate; this setup does not enable or update it.

To update intentionally, refresh the marketplace with `codex plugin marketplace upgrade compound-engineering-plugin`, reinstall with `codex plugin add compound-engineering@compound-engineering-plugin`, restart, and run `$ce-setup`. Review the resulting example/config changes before committing them.

## Migration and rollback

Pre-install settings, instructions, skills, and prompts were copied to the private local directory `$HOME/.codex/backups/compound-engineering/2026-08-30-202043-website/`. Its migration manifest records the exact retired entry points. Old `workflows-*` commands, the old `setup` skill, and superseded browser/deep-plan workflow entry points are archived rather than deleted. Standalone specialist skills remain available for other projects.

The obsolete global Codex tool map is removed through AIHome's `scripts/sync_codex_rules.py --remove-legacy-compound-map`; ordinary rule synchronization is unchanged. Never hand-edit the generated global `AGENTS.md`.

To roll back, remove the native plugin with `codex plugin remove compound-engineering@compound-engineering-plugin`, restore only archived entry points listed in the backup manifest, and revert this repository's setup commit if desired. Compare settings before restoring anything; do not overwrite unrelated later changes. Restoring the obsolete tool map is not needed to use the archived skills.

References: [installation](https://github.com/EveryInc/compound-engineering-plugin#codex-cli), [configuration](https://github.com/EveryInc/compound-engineering-plugin/blob/main/docs/guides/configuration.md), [migration](https://github.com/EveryInc/compound-engineering-plugin/blob/main/docs/install/upgrading.md).
