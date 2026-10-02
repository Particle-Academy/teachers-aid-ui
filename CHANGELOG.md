# Changelog

Notable changes to `@particle-academy/teachers-aid-ui`.

**BREAKING** marks anything that can stop working on upgrade. This package is
pre-1.0, so breaking changes land in MINOR releases — read those entries before
upgrading.

---

## [Unreleased]

## [0.3.0] - 2026-10-02

### Fixed

- **`PlanReview` hid the attribute the review exists to check.** Scalar attributes
  now render inline on every operation, without expanding anything.

  Attributes *were* all rendered — behind a click, one operation at a time, with
  Apply available from the start. So a reviewer saw
  *"Radio Discipline Check — a quiz on callsigns · 5 fields"* and could approve it
  having never seen `passing_score: 0`, the single field deciding whether that
  certification exam means anything.

  It matters because the proposal comes from a model and Teachers Aid extracts
  uploaded course material into the turn. `passing_score` is a legitimate,
  model-controlled field — nothing is bypassed when an injected instruction proposes
  zero. The tool is working as designed and **the review IS the control.** A control
  behind a click nobody is prompted to make is not one.

  The component's own docblock already said *"Apply on an opaque list is just a
  slower yes"*. It was true of the intent and false of the behaviour.

  **What you must DO:** nothing. Rows are taller. Long strings and nested objects
  stay behind the toggle, which now reads "N more fields".

- **Several operations can be expanded at once.** It was a single-index accordion,
  so reviewing a twelve-operation plan was twelve clicks with no way to compare two
  rows — its own quiet pressure to stop looking and click Apply.

### Changed

- `AGENTS.md` no longer claims `PlanReview` offers **"per-operation
  accept/reject"**. It does not, and never did: one of the existing tests asserts
  the opposite ("applies the whole plan or none of it"). It also no longer says
  "No suite yet" with 18 tests in the repo.

  Both corrected together because they are the same defect, and this estate was
  bitten by its bigger version the same day: `laravel-jobs`' agent file described an
  authentication bypass as a deliberate feature for two releases.

Raised by a consumer who went looking for a mass-assignment hole in the PHP side,
did not find one, and asked the better question — what can an admin actually see at
the moment they commit?


### Fixed

- **`CHANGELOG.md` is now in the published tarball.** `files` did not whitelist it, so npm never shipped it — and this package puts breaking changes in MINOR releases and tells you in the README to read the entry before taking one. The instruction existed for the author, who has the file, and not for the consumer, who is the only one being instructed. Nothing for you to do; the file simply arrives from this release on.

## 0.2.1 — 2026-08-18

### Fixed

- **Dark mode: five surfaces were pinned to a light-only colour.** Most of this
  package already used the kit's `secondary-*` scale, which react-fancy flips
  under `.dark` — so those parts were right all along. The exceptions were
  literals with no dark counterpart, which stayed put while the text over them
  correctly went near-white:

  - the message composer's drop zone and its dragging state (`MessageComposer`)
  - the chat panel shell (`TeachersAidChat`)
  - the Discard button and the attribute list (`PlanReview`)
  - inline `code` and `pre` tints in rendered markdown (`ChatTranscript`), where
    a 5%-black wash is invisible on a dark surface

  **Nothing to do on upgrade.** Light mode is unchanged; each of these now
  carries an explicit `dark:` counterpart.

  A `dark-mode` test now scans source for colour literals with no dark
  counterpart, so this cannot come back silently.

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

