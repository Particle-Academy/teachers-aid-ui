# AGENTS.md — @particle-academy/teachers-aid-ui

The React surface for `particle-academy/teachers-aid` — the TAC authoring agent.
Chat with it about course material; review and approve what it proposes.
`CLAUDE.md` symlinks here.

## The surface

| Component | Renders |
|---|---|
| `TeachersAidChat` | the whole thing — transcript + composer + plan review |
| `ChatTranscript` | the conversation |
| `MessageComposer` | input with file drop (handbooks, decks, question banks) |
| `PlanReview` | the proposed `ChangePlan` — whole-plan apply or discard |

## Rules

- **`PlanReview` is the trust boundary made visible.** The backend guarantees an
  agent cannot write — tools hold no repository, and `PlanApplier` is the only
  writer. This component is where a human turns a *proposal* into a change.
  **Never auto-apply a plan**, and never collapse the review step for
  "convenience". Trust-but-verify is the Fancy component contract's sixth
  requirement, and here it is the entire product.
- **Agent output is sanitised by default.** It renders through `ContentRenderer`
  because the reply is model output and an uploaded file can talk a model into
  emitting markup. Do not switch to raw HTML rendering.
- **Transport-agnostic on purpose.** No router, no HTTP client — so it runs under
  Inertia, `fetch`, or a websocket. Keep it that way: the host supplies the
  transport, the component supplies the surface.
- **Controlled, per the Fancy component contract.** `value` + `onChange`, stable
  `data-*` handles, JSON-friendly props.
- **Peer, not dependency, on `react-fancy`** (`>=4 <5` — bounded).

## Rule for whoever wires the backend

`PlanApplier` writes through Eloquent and does **not** consult
`laravel-courses`' `AuthorizesCourseAdmin`. That is correct layering, not a hole
— but it means **the route that invokes the applier is where authorization
lives.** Put it behind admin middleware. Don't fake a `Request` to make the
applier check a contract; a check that looks like enforcement but isn't is worse
than none.

## Testing

`npm test` -> vitest, 18 tests across `plan-review.test.tsx` and
`dark-mode.test.ts`. **DOM tests need `// @vitest-environment jsdom` at the top
of the file** -- there is no `vitest.config.*` here, so the default environment is
`node` and a render test without that pragma fails on `document` rather than on
its assertion. `Element.prototype.scrollIntoView` also needs stubbing, because
jsdom implements no scrolling and `ChatTranscript` scrolls to the newest turn.

> This section read **"No suite yet"**, and the table above promised
> **"per-operation accept/reject"**. Both were false: there were 18 tests, and one
> of them asserts the *opposite* of that promise -- "applies the whole plan or none
> of it: there is no per-operation reject".
>
> The second one is the dangerous shape, and this estate has just been bitten by
> it twice. `laravel-jobs`' own agent file called an authentication bypass a
> deliberate feature for two releases, and every agent who read it believed it. A
> doc describing a capability that does not exist is worse than a missing doc,
> because the reader stops looking.

**The highest-value test that still does not exist:** nothing asserts the surface
cannot apply a plan the host has not been given a chance to see -- i.e. that
`onApply` is unreachable without a render. The current suite covers "does not
apply on render" and "cannot apply twice", which is adjacent but not that.

## Publishing

Pure OIDC via Trusted Publishing — no tokens. `publish.yml` fires on `v*.*.*`
with `permissions: id-token: write`. **npm pinned to `11.18.0`**: OIDC needs
11.5+, the runner ships 10.x, and `npm@latest` (12.x) broke `--provenance`.

Note the repo/package split when configuring anything registry-side: the repo is
`teachers-aid-ui` and so is the package, but its sibling `fancy-passkeys-js`
publishes `@particle-academy/fancy-passkeys` — that mismatch has cost a failed
publish twice in this org.
