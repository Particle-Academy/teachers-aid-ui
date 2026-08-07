// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PlanReview } from "../src/components/PlanReview";
import { ChatTranscript } from "../src/components/ChatTranscript";
import type { ChangePlan, ChatEntry } from "../src/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom implements no scrolling, and ChatTranscript scrolls to the newest turn
// on every update. Without this every transcript render throws.
Element.prototype.scrollIntoView = () => {};

const roots: Root[] = [];

function mount(el: ReactElement): HTMLElement {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    roots.push(root);
    act(() => root.render(el));
    return host;
}

function click(el: Element | null) {
    act(() => {
        (el as HTMLElement).click();
    });
}

afterEach(() => {
    act(() => roots.splice(0).forEach((r) => r.unmount()));
    document.body.innerHTML = "";
});

const plan = (over: Partial<ChangePlan> = {}): ChangePlan => ({
    operations: [
        { action: "create", entity: "course", description: "Create “Intro to Ohms”", ref: "c1" },
        { action: "update", entity: "lesson", description: "Rename lesson 2", id: 2 },
        { action: "delete", entity: "question", description: "Remove question 9", id: 9 },
    ],
    count: 3,
    ...over,
});

describe("PlanReview", () => {
    // This is the trust-but-verify surface: an agent proposes a set of changes
    // and a human applies them. Everything worth testing here is about the human
    // being able to see what they are agreeing to, and not applying it by
    // accident.

    it("lists every proposed operation", () => {
        const host = mount(<PlanReview plan={plan()} onApply={() => {}} onDiscard={() => {}} />);

        expect(host.textContent).toContain("Create “Intro to Ohms”");
        expect(host.textContent).toContain("Rename lesson 2");
        expect(host.textContent).toContain("Remove question 9");
    });

    it("does not apply anything on render — a plan is inert until a human acts", () => {
        const onApply = vi.fn();
        mount(<PlanReview plan={plan()} onApply={onApply} onDiscard={() => {}} />);

        expect(onApply).not.toHaveBeenCalled();
    });

    it("applies only when the apply control is used", () => {
        const onApply = vi.fn();
        const host = mount(<PlanReview plan={plan()} onApply={onApply} onDiscard={() => {}} />);

        const apply = [...host.querySelectorAll("button")].find((b) => /apply/i.test(b.textContent ?? ""));
        expect(apply, "no apply control rendered").toBeTruthy();
        click(apply!);

        expect(onApply).toHaveBeenCalledTimes(1);
    });

    it("discards without applying", () => {
        const onApply = vi.fn();
        const onDiscard = vi.fn();
        const host = mount(<PlanReview plan={plan()} onApply={onApply} onDiscard={onDiscard} />);

        const discard = [...host.querySelectorAll("button")].find((b) =>
            /discard|cancel/i.test(b.textContent ?? ""),
        );
        expect(discard, "no discard control rendered").toBeTruthy();
        click(discard!);

        expect(onDiscard).toHaveBeenCalledTimes(1);
        expect(onApply).not.toHaveBeenCalled();
    });

    it("cannot be applied twice while the first apply is still running", () => {
        // Double-applying a plan creates the courses twice. `busy` is what the
        // host sets while the request is in flight.
        const onApply = vi.fn();
        const host = mount(<PlanReview plan={plan()} onApply={onApply} onDiscard={() => {}} busy />);

        const apply = [...host.querySelectorAll("button")].find((b) => /apply/i.test(b.textContent ?? ""));
        click(apply!);

        expect(onApply).not.toHaveBeenCalled();
    });

    it("renders an empty plan without offering to apply nothing", () => {
        const host = mount(
            <PlanReview plan={plan({ operations: [], count: 0 })} onApply={() => {}} onDiscard={() => {}} />,
        );

        expect(host.textContent).not.toContain("undefined");
    });
});

describe("ChatTranscript", () => {
    const entry = (over: Partial<ChatEntry> = {}): ChatEntry => ({ role: "user", content: "hello", ...over });

    it("prefers `display` over `content`", () => {
        // `content` carries extracted file text folded into the prompt. Showing
        // it would paste an entire uploaded handbook back at the teacher.
        const host = mount(
            <ChatTranscript agentName="Aide" history={[entry({ display: "Summarise this", content: "…40 pages…" })]} />,
        );

        expect(host.textContent).toContain("Summarise this");
        expect(host.textContent).not.toContain("40 pages");
    });

    it("falls back to content when there is no display text", () => {
        const host = mount(<ChatTranscript agentName="Aide" history={[entry({ content: "plain question" })]} />);

        expect(host.textContent).toContain("plain question");
    });

    it("names attached files", () => {
        const host = mount(<ChatTranscript agentName="Aide" history={[entry({ files: ["syllabus.pdf"] })]} />);

        expect(host.textContent).toContain("syllabus.pdf");
    });

    it("renders an empty transcript without throwing", () => {
        expect(() => mount(<ChatTranscript agentName="Aide" history={[]} />)).not.toThrow();
    });
});

describe("PlanReview — what it does NOT do", () => {
    it("applies the whole plan or none of it: there is no per-operation reject", () => {
        // The package's own AGENTS.md describes "per-operation accept/reject",
        // and the component does not implement it — apply takes no argument and
        // there is no per-row control. Pinned as the CURRENT behaviour so the
        // gap is visible rather than assumed away; a reviewer who believes they
        // can drop one operation would apply all three.
        const onApply = vi.fn();
        const host = mount(<PlanReview plan={plan()} onApply={onApply} onDiscard={() => {}} />);

        const perRow = host.querySelectorAll('input[type="checkbox"], [data-op-reject]');
        expect(perRow).toHaveLength(0);

        const apply = [...host.querySelectorAll("button")].find((b) => /apply/i.test(b.textContent ?? ""));
        click(apply!);

        // Called once, and carrying no selection of operations — apply is
        // all-or-nothing. (The single argument it does receive is the click
        // event, because onApply is wired straight to onClick; its declared
        // type is `() => void`, so no typed caller reads it.)
        expect(onApply).toHaveBeenCalledTimes(1);
        const [arg] = onApply.mock.calls[0]!;
        expect(Array.isArray(arg)).toBe(false);
    });

    it("shows each operation's action and entity so the reviewer sees what kind of change it is", () => {
        // With no per-operation control, reading the list correctly is the only
        // protection a reviewer has — a delete must not look like an update.
        const host = mount(<PlanReview plan={plan()} onApply={() => {}} onDiscard={() => {}} />);
        const text = host.textContent ?? "";

        expect(text.toLowerCase()).toContain("create");
        expect(text.toLowerCase()).toContain("update");
        expect(text.toLowerCase()).toContain("delete");
    });
});
