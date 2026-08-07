# Changelog

Notable changes to `@particle-academy/teachers-aid-ui`.

**BREAKING** marks anything that can stop working on upgrade. This package is
pre-1.0, so breaking changes land in MINOR releases — read those entries before
upgrading.

---

## [Unreleased]

## 0.2.0 — 2026-08-07

### Changed

- **BREAKING — Node 22 is no longer supported.** `engines.node` moves from `>=22` to `>=22`.

  **What you must do:** on Node 22 or newer, nothing. Note npm only *warns* on an `engines` mismatch while **pnpm fails the install**, so this surfaces differently depending on your package manager. Node 18 is end-of-life and 20 is maintenance-only.

- **BREAKING — React 18 is no longer supported.** `peerDependencies.react` / `react-dom` are now `^19.0.0`.

  **What you must do:** on React 19, nothing. On React 18, stay on the previous release, or upgrade your app to 19 first.

  React 18 support was a claim nothing tested — every build and test in this package ran against 19, so the 18 half of the old range was never executed. An untested compatibility claim is worse than an absent one, because it reads as support.

### Why

These are the kit 0.5 platform floors, applied across every package at once so a consumer never has to resolve a mix. **No API changed, nothing was removed, nothing was renamed** — only what the package requires.


### Fixed

- **The primary actions rendered as unstyled grey slabs in any host that does
  not declare `bg-brand`.** Send and Apply forced
  `!bg-brand hover:!bg-primary-600 !text-white`. Nothing in react-fancy defines
  `bg-brand` — a host either declares that utility itself or Tailwind generates
  no such class, it resolves to nothing, and the most important control on the
  surface comes out grey. There is no error to trace: the markup is correct and
  the class is simply absent.

  It looked right everywhere it was tested only because the one host testing it
  happened to declare the token.

  Colour is now a `color` prop on `MessageComposer` and `PlanReview`, defaulting
  to `red` and threaded through `TeachersAidChat`. **What you must DO: nothing**
  unless you were relying on `bg-brand` being forced — pass `color` to pick, or
  leave it.

  Same defect and same fix as `@particle-academy/classroom` 0.4.0.

## 0.1.0 — 2026-08-01

**First published release.** Chat transcript, composer with file drop, and the plan-review approval surface for the TAC agent. Controlled and transport-agnostic — no router, no HTTP client — so it runs under Inertia, fetch or a websocket. Agent output renders through `ContentRenderer` with sanitisation on by default, because a reply is model output and an uploaded file can talk a model into emitting markup.

### Added

- **CI** — matching the rest of the Fancy kit.
- This changelog. Entries start here rather than being reconstructed after the
  fact: the reasoning behind the earlier commits has already evaporated, and
  inventing it would be worse than admitting the gap.

