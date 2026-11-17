# Using @particle-academy/teachers-aid-ui — guide for agents

How an agent installs and uses this package in a consumer app. What the package
is, is in [README.md](./README.md). Notes for working ON this repo's code are in
[CONTRIBUTING.md](./CONTRIBUTING.md).

## Install

```bash
npm install @particle-academy/teachers-aid-ui
```

- **Peers:** `@particle-academy/react-fancy` `>=4`, `react ^19`,
  `react-dom ^19`. **Node:** `>=22`.
- **Tailwind v4 must scan the package**, or it emits none of its classes:

  ```css
  @source "../../node_modules/@particle-academy/teachers-aid-ui/dist";
  ```

- The backend is the Composer package `particle-academy/teachers-aid`, though
  any backend that serves the same JSON works.

## Find it on the Fancy MCP server

The catalog server is `https://ui.particle.academy/mcp` (streamable HTTP, no API
key; MCP id `fancy-ui`). This package's registry entries (`package` =
`teachers-aid-ui`):

- `teachers-aid-chat`, `chat-transcript`, `message-composer`, `plan-review`

Use `search-components` ("authoring chat", "plan review") to find them,
`install-instructions` for the exact commands, and `get-component` for the
source bundle. Vendored source: `npx fancy-cli@latest add <slug>`. The backend
is found with `search-backend-packages` (stack `php`).

## API essentials

- **Components:** `TeachersAidChat` (the whole surface: plan review,
  transcript, composer), `PlanReview`, `ChatTranscript`, `MessageComposer`.
- **Controlled and transport-agnostic:** data and callbacks in, no router or
  HTTP client inside. `TeachersAidChat` takes `agentName`, `history`, `plan`,
  `busy`, `pending`, `configured`, `banner`, and `onSend(message, files,
  reset)`, `onApply`, `onDiscard`, `onReset`.
- **Types:** `ChangePlan`, `ChangeOperation`, `ChatEntry` mirror what the PHP
  package serialises, as plain JSON.

## Traps

- **`PlanReview` is the approval step. Never auto-apply a plan** or skip the
  review. A plan is applied whole or not at all; there is no per-operation
  reject.
- **Authorization lives on the route that applies the plan.** The backend's
  `PlanApplier` does not consult `laravel-courses`' `AuthorizesCourseAdmin`, so
  put the apply route behind admin middleware.
- **The transcript renders each entry's `display`, falling back to `content`.**
  `content` is what the model was sent, with extracted file text folded in, so
  a host on another backend should fill `display` or the teacher sees the whole
  handbook pasted back.
- **`busy` and `disabled` are separate on `MessageComposer`.** The box is also
  disabled when no model is configured; wiring the spinner to `disabled` leaves
  it spinning forever.
- **Agent replies render sanitised** (through `ContentRenderer`), because the
  reply is model output.
