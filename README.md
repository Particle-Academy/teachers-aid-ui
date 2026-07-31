# @particle-academy/teachers-aid-ui

Teachers Aid Chat UX — an authoring chat with file drop and a **propose-then-approve** plan review, built on [Fancy UI](https://github.com/Particle-Academy/react-fancy) primitives.

The React half of [`particle-academy/teachers-aid`](https://github.com/Particle-Academy/teachers-aid). Every component is **controlled and transport-agnostic**: it takes data and callbacks and imports no router or HTTP client, so the same surface sits on Inertia, a `fetch` call or a websocket.

## Install

```sh
npm install @particle-academy/teachers-aid-ui
```

Peer deps: `react` 18/19 and `@particle-academy/react-fancy` v4+.

Tailwind must be told to scan the package, or it emits none of the classes:

```css
@source "../../node_modules/@particle-academy/teachers-aid-ui/dist";
```

## Use

```jsx
import { TeachersAidChat } from '@particle-academy/teachers-aid-ui';

<TeachersAidChat
    agentName="TAC"
    history={history}
    plan={plan}
    busy={busy}
    pending={pending}
    configured={hasApiKey}
    onSend={(message, files, reset) => post(message, files, reset)}
    onApply={() => post('/plan/apply')}
    onDiscard={() => post('/plan/discard')}
    onReset={() => post('/reset')}
    banner={<Callout color="amber">…</Callout>}
/>
```

`TeachersAidChat` composes the three pieces below. Use them directly if you want a different arrangement.

## Components

| | |
|---|---|
| `TeachersAidChat` | The whole surface: plan review, transcript, composer. |
| `PlanReview` | The approval list. Renders nothing when the plan is empty. |
| `ChatTranscript` | The conversation, with an optional working indicator. |
| `MessageComposer` | Message box with drag-and-drop attachments. |

### PlanReview is the approval step

It is the only place a proposal becomes rows, so every operation is inspectable **before** anything is written — raw attributes included. A reviewer who cannot see what they are approving is not really approving it, and "Apply" on an opaque list is just a slower yes.

Forward references are surfaced too: an operation carrying `ref: "c1"` reads *"referenced later as $c1"*, so it is obvious that a later lesson attaches to the course above it rather than to something that already exists.

### Two details that look like polish and are not

**The transcript renders `display`, not `content`.** `content` is what the model was sent, with extracted file text folded in — rendering it would paste a whole handbook back at the teacher.

**`MessageComposer` takes `busy` and `disabled` separately.** The box is also disabled when no model is configured, and wiring the spinner to `disabled` leaves it spinning forever, which reads as "working" when nothing is happening at all.

### Why not react-fancy's `PromptInput`?

It is the closer fit on paper — slash commands, mentions, a token meter, drop-to-attach. But it maps dropped files to `{ id, name, bytes }` and discards the `File`, so the chip renders and the upload can never happen. Reported upstream; `MessageComposer` goes away the day the attachment carries the file.

## Types

`ChangePlan`, `ChangeOperation`, `ChatEntry` mirror what the PHP package serialises, but nothing here imports it — these components are a view over plain JSON, so a host on any backend can feed them.

## Develop

```sh
npm install
npm run build     # tsup -> dist (esm + cjs + d.ts)
npm run lint      # tsc --noEmit
```

## License

MIT.
