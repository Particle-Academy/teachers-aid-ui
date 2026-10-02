import { Badge, Button, Heading, Text, type Color } from '@particle-academy/react-fancy';
import { useState } from 'react';
import type { ChangeAction, ChangePlan } from '../types';

const ACTION_COLOR: Record<ChangeAction, Color> = {
    create: 'green',
    update: 'blue',
    delete: 'red',
};

export interface PlanReviewProps {
    plan?: ChangePlan | null;
    onApply: () => void;
    onDiscard: () => void;
    busy?: boolean;
    /** Shown in the footer. Set to null to drop the note entirely. */
    draftNote?: React.ReactNode;
    /** react-fancy Button colour for the apply action. */
    color?: Color;
}

/** Scalar values short enough to read inline, which is where they belong. */
function inlineFields(attributes: Record<string, unknown>): [string, string][] {
    return Object.entries(attributes)
        .filter(([, v]) => v !== null && typeof v !== 'object')
        .map(([k, v]) => [k, String(v)] as [string, string])
        .filter(([, v]) => v.length <= 60);
}

/**
 * The approval surface — the only place a proposal becomes rows.
 *
 * Every operation is inspectable before anything is written, raw attributes
 * included. A reviewer who cannot see what they are approving is not really
 * approving it, and "Apply" on an opaque list is just a slower yes.
 *
 * ---------------------------------------------------------------------------
 * That paragraph was true of the intent and false of the behaviour
 * ---------------------------------------------------------------------------
 *
 * Attributes WERE all rendered — behind a click, one operation at a time, with
 * the Apply button available from the start. So a reviewer saw
 * "Radio Discipline Check — a quiz on callsigns · 5 fields" and could approve it
 * without ever seeing `passing_score: 0`, which is the single attribute deciding
 * whether that certification exam means anything.
 *
 * It mattered because these proposals come from a model, and Teachers Aid extracts
 * uploaded course material into the turn. `passing_score` is a legitimate,
 * model-controlled field: nothing is bypassed when an injected instruction proposes
 * zero. The tool is working as designed and **the review IS the control.** A
 * control that requires a click nobody is prompted to make is not one.
 *
 * So scalar attributes now render inline on every row, always. Expansion is for
 * long text and nested objects only, and several rows can be open at once —
 * reviewing a twelve-operation plan through a one-at-a-time accordion is twelve
 * clicks and no way to compare two rows, which is its own pressure to skip.
 *
 * Raised by a consumer who went looking for a mass-assignment hole in the PHP
 * side, did not find one, and asked the better question: what can an admin
 * actually see at the moment they commit?
 */
export function PlanReview({ plan, onApply, onDiscard, busy, draftNote, color = 'red' }: PlanReviewProps) {
    const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set());

    if (!plan || !plan.operations?.length) return null;

    const summary = Object.entries(plan.summary ?? {})
        .map(([key, count]) => `${count} × ${key.replace('_', ' ')}`)
        .join(' · ');

    return (
        <section className="rounded-lg border border-amber-300 bg-amber-50/60 overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-100/60 px-4 py-3">
                <div>
                    <Heading as="h2" size="sm" weight="semibold" className="!text-sm">
                        Proposed changes — nothing has been saved yet
                    </Heading>
                    {summary && <Text className="!text-xs !text-secondary-600 !mt-0.5">{summary}</Text>}
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={onDiscard}
                        disabled={busy}
                        className="!border !border-secondary-300 !bg-white dark:!bg-zinc-900 !text-secondary-700 !text-sm !px-3 !py-1.5 !rounded-md"
                    >
                        Discard
                    </Button>
                    <Button
                        onClick={onApply}
                        // See MessageComposer: colour is a prop, never a forced
                        // `!bg-brand` class the host may not define.
                        color={color}
                        loading={busy}
                        disabled={busy}
                        className="!font-semibold !text-sm"
                    >
                        Apply {plan.count} change{plan.count === 1 ? '' : 's'}
                    </Button>
                </div>
            </header>

            <ol className="divide-y divide-amber-200">
                {plan.operations.map((op, i) => {
                    const open = expanded.has(i);
                    const attributes = Object.entries(op.attributes ?? {});
                    const inline = inlineFields(op.attributes ?? {});
                    const rest = attributes.length - inline.length;

                    return (
                        <li key={i} className="px-4 py-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setExpanded((prev) => {
                                        const next = new Set(prev);
                                        if (!next.delete(i)) next.add(i);
                                        return next;
                                    })
                                }
                                className="flex w-full items-start gap-3 text-left"
                                aria-expanded={open}
                            >
                                <Badge color={ACTION_COLOR[op.action] ?? 'gray'} variant="soft" size="sm">
                                    {op.action}
                                </Badge>
                                <span className="flex-1">
                                    <Text className="!text-sm !font-medium">{op.description}</Text>

                                    {/*
                                     * Inline, always, and NOT behind the toggle. This is the
                                     * difference between a review and a slower yes -- see the
                                     * component docblock for the `passing_score: 0` case.
                                     */}
                                    {inline.length > 0 && (
                                        <span
                                            className="mt-1 flex flex-wrap gap-x-3 gap-y-1"
                                            data-plan-op-fields={i}
                                        >
                                            {inline.map(([key, value]) => (
                                                <span key={key} className="text-xs text-secondary-600">
                                                    <span className="font-medium uppercase tracking-wide text-secondary-500">
                                                        {key}
                                                    </span>{' '}
                                                    <span className="text-secondary-800">{value}</span>
                                                </span>
                                            ))}
                                        </span>
                                    )}

                                    {op.ref && (
                                        <Text className="!text-xs !text-secondary-500 !mt-0.5">
                                            referenced later as ${op.ref}
                                        </Text>
                                    )}
                                </span>
                                <span className="text-xs text-secondary-500 shrink-0">
                                    {open
                                        ? 'Hide'
                                        : rest > 0
                                          ? `${rest} more field${rest === 1 ? '' : 's'}`
                                          : 'Details'}
                                </span>
                            </button>

                            {open && (
                                <dl className="mt-3 grid gap-2 rounded-md bg-white/70 dark:bg-zinc-900/70 p-3 text-sm">
                                    {attributes.map(([key, value]) => (
                                        <div key={key} className="grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-3">
                                            <dt className="text-xs font-medium uppercase tracking-wide text-secondary-500">
                                                {key}
                                            </dt>
                                            <dd className="whitespace-pre-wrap break-words text-secondary-800">
                                                {value !== null && typeof value === 'object'
                                                    ? JSON.stringify(value, null, 2)
                                                    : String(value)}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            )}
                        </li>
                    );
                })}
            </ol>

            {draftNote !== null && (
                <footer className="border-t border-amber-200 px-4 py-2">
                    <Text className="!text-xs !text-secondary-600">
                        {draftNote ?? (
                            <>
                                Applied changes are saved as <strong>drafts</strong>. Publishing stays a
                                separate, deliberate step.
                            </>
                        )}
                    </Text>
                </footer>
            )}
        </section>
    );
}
