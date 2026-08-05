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

/**
 * The approval surface — the only place a proposal becomes rows.
 *
 * Every operation is inspectable before anything is written, raw attributes
 * included. A reviewer who cannot see what they are approving is not really
 * approving it, and "Apply" on an opaque list is just a slower yes.
 */
export function PlanReview({ plan, onApply, onDiscard, busy, draftNote, color = 'red' }: PlanReviewProps) {
    const [expanded, setExpanded] = useState<number | null>(null);

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
                        className="!border !border-secondary-300 !bg-white !text-secondary-700 !text-sm !px-3 !py-1.5 !rounded-md"
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
                    const open = expanded === i;
                    const attributes = Object.entries(op.attributes ?? {});

                    return (
                        <li key={i} className="px-4 py-3">
                            <button
                                type="button"
                                onClick={() => setExpanded(open ? null : i)}
                                className="flex w-full items-start gap-3 text-left"
                                aria-expanded={open}
                            >
                                <Badge color={ACTION_COLOR[op.action] ?? 'gray'} variant="soft" size="sm">
                                    {op.action}
                                </Badge>
                                <span className="flex-1">
                                    <Text className="!text-sm !font-medium">{op.description}</Text>
                                    {op.ref && (
                                        <Text className="!text-xs !text-secondary-500 !mt-0.5">
                                            referenced later as ${op.ref}
                                        </Text>
                                    )}
                                </span>
                                <span className="text-xs text-secondary-500 shrink-0">
                                    {open ? 'Hide' : `${attributes.length} field${attributes.length === 1 ? '' : 's'}`}
                                </span>
                            </button>

                            {open && (
                                <dl className="mt-3 grid gap-2 rounded-md bg-white/70 p-3 text-sm">
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
