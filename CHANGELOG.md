# Changelog

Notable changes to `@particle-academy/teachers-aid-ui`.

**BREAKING** marks anything that can stop working on upgrade. This package is
pre-1.0, so breaking changes land in MINOR releases — read those entries before
upgrading.

---

## [Unreleased]

## 0.1.0 — 2026-08-01

**First published release.** Chat transcript, composer with file drop, and the plan-review approval surface for the TAC agent. Controlled and transport-agnostic — no router, no HTTP client — so it runs under Inertia, fetch or a websocket. Agent output renders through `ContentRenderer` with sanitisation on by default, because a reply is model output and an uploaded file can talk a model into emitting markup.

### Added

- **CI** — matching the rest of the Fancy kit.
- This changelog. Entries start here rather than being reconstructed after the
  fact: the reasoning behind the earlier commits has already evaporated, and
  inventing it would be worse than admitting the gap.

