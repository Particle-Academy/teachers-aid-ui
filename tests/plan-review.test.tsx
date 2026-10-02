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

describe("PlanReview — a reviewer can see the attribute that matters", () => {
    /*
     * These exist because a consumer asked a question the component could not
     * answer well: does the review show a test's `passing_score`, or only its
     * title and description?
     *
     * It showed every attribute -- behind a click, one operation at a time, with
     * Apply available from the start. So an admin could approve
     * "Radio Discipline Check -- a quiz on callsigns" without seeing
     * `passing_score: 0`, the single field deciding whether that certification
     * exam means anything.
     *
     * It matters because the proposal comes from a model and Teachers Aid extracts
     * uploaded course material into the turn. `passing_score` is a legitimate,
     * model-controlled field, so nothing is bypassed when an injected instruction
     * proposes zero -- the tool is working as designed and THE REVIEW IS THE
     * CONTROL. A control behind a click nobody is prompted to make is not one.
     */
    const examPlan = (): ChangePlan => ({
        operations: [
            {
                action: "create",
                entity: "test",
                description: "Radio Discipline Check — a quiz on callsigns",
                attributes: {
                    title: "Radio Discipline Check",
                    passing_score: 0,
                    is_final: true,
                    max_attempts: 99,
                },
            },
        ],
        count: 1,
    });

    it("shows passing_score WITHOUT the reviewer expanding anything", () => {
        // The load-bearing one. If this ever fails, an admin can approve a final
        // exam with a zero pass mark having never been shown it.
        const host = mount(<PlanReview plan={examPlan()} onApply={() => {}} onDiscard={() => {}} />);

        expect(host.textContent).toContain("passing_score");
        expect(host.textContent).toContain("0");
    });

    it("shows the other consequential scalars inline too", () => {
        const host = mount(<PlanReview plan={examPlan()} onApply={() => {}} onDiscard={() => {}} />);

        expect(host.textContent).toContain("is_final");
        expect(host.textContent).toContain("max_attempts");
        expect(host.textContent).toContain("99");
    });

    it("renders fields for EVERY operation at once, not one at a time", () => {
        // The accordion let only one row be open. Reviewing a twelve-operation
        // plan was twelve clicks with no way to compare two rows, which is its own
        // quiet pressure to stop looking and click Apply.
        const host = mount(
            <PlanReview
                plan={{
                    operations: [
                        { action: "create", entity: "test", description: "First", attributes: { passing_score: 10 } },
                        { action: "create", entity: "test", description: "Second", attributes: { passing_score: 20 } },
                    ],
                    count: 2,
                }}
                onApply={() => {}}
                onDiscard={() => {}}
            />,
        );

        expect(host.textContent).toContain("10");
        expect(host.textContent).toContain("20");
    });

    it("keeps long values and objects behind the toggle, and says how many", () => {
        // Inline is for what can be read at a glance. A 600-character description
        // inline would bury the pass mark it was meant to reveal.
        const long = "x".repeat(600);
        const host = mount(
            <PlanReview
                plan={{
                    operations: [
                        {
                            action: "create",
                            entity: "test",
                            description: "Long one",
                            attributes: { passing_score: 70, body: long, meta: { a: 1 } },
                        },
                    ],
                    count: 1,
                }}
                onApply={() => {}}
                onDiscard={() => {}}
            />,
        );

        expect(host.textContent).toContain("passing_score");
        expect(host.textContent).not.toContain(long);
        expect(host.textContent).toContain("2 more fields");

        click(host.querySelector("button[aria-expanded]"));

        expect(host.textContent).toContain(long);
    });

    it("two open rows stay open", () => {
        const host = mount(
            <PlanReview
                plan={{
                    operations: [
                        { action: "create", entity: "test", description: "A", attributes: { body: "y".repeat(100) } },
                        { action: "create", entity: "test", description: "B", attributes: { body: "z".repeat(100) } },
                    ],
                    count: 2,
                }}
                onApply={() => {}}
                onDiscard={() => {}}
            />,
        );

        const toggles = host.querySelectorAll("button[aria-expanded]");
        click(toggles[0]);
        click(toggles[1]);

        expect(host.textContent).toContain("y".repeat(100));
        expect(host.textContent).toContain("z".repeat(100));
    });
});
