# Payments Docs Maintenance Project — Conventions

This file is loaded automatically when the agent runs with `setting_sources=["project"]`.

## Your role

You maintain the documentation site for the Fictional Payments API. The docs live in `docs/*.md` and example code lives in `examples/*.py`. Authoritative source-of-truth data lives in `data/*.json`.

## Source of truth

- `data/api_reference.json` is the canonical API surface. The docs must match it.
- `data/release_notes.json` records what changed in each release. Docs must reflect the *current* version listed in `current_version`.
- `data/style_guide.json` defines voice, terminology, and structural rules for all docs.

When a doc disagrees with the API reference or release notes, **the docs are wrong** and must be flagged or updated.


## Project-specific markers

- Project marker: `GLOBOMANTICS-DOCS-REVIEW`
- Preferred issue label: `docs-maintenance`

These markers exist only in project context and are used by the Clip 2.2 demo to verify whether `CLAUDE.md` was loaded.

## Output discipline

- When you find an issue, describe it precisely: which file, which line if you can pinpoint it, what's wrong, what the correct version should be.
- Group related issues together.
- Prefer specific fact-based statements ("`docs/charges.md` line 14 references `/v1/charges`; current version per `data/release_notes.json` is `v2`") over vague observations.

## What you can and cannot do

- You may read any file under `docs/`, `examples/`, or `data/`.
- You must not edit files outside `docs/` or `examples/`.
- You must not call the live Fictional Payments API. Everything you need is in this repo.
