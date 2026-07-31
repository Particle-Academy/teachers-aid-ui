import { Badge, Text } from '@particle-academy/react-fancy';
import { useEffect, useRef } from 'react';
import type { ChatEntry } from '../types';

export interface ChatTranscriptProps {
    history: ChatEntry[];
    agentName: string;
    /** Renders the working indicator while a turn is in flight. */
    thinking?: boolean;
    /** Replaces the default empty state. */
    emptyState?: React.ReactNode;
}

/**
 * The conversation.
 *
 * Renders `display` in preference to `content`: the latter is what the model
 * was sent, with extracted file text folded in, and showing it would paste a
 * whole handbook back at the teacher.
 */
export function ChatTranscript({ history, agentName, thinking, emptyState }: ChatTranscriptProps) {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [history.length, thinking]);

    if (history.length === 0 && !thinking) {
        return (
            <div className="flex flex-1 items-center justify-center px-6 py-12 text-center">
                {emptyState ?? (
                    <div className="max-w-md">
                        <Text className="!text-sm !text-secondary-600">
                            Describe the course you want, or attach the material to build it from —
                            a handbook, a slide deck, a question bank.
                        </Text>
                        <Text className="!text-xs !text-secondary-500 !mt-3">
                            {agentName} drafts changes for you to review. It cannot save anything itself.
                        </Text>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-4 grid gap-4 content-start">
            {history.map((entry, i) => (
                <Bubble key={i} entry={entry} agentName={agentName} />
            ))}

            {thinking && (
                <div className="flex gap-3">
                    <Who label={agentName} />
                    <div className="rounded-lg bg-secondary-100 px-3 py-2">
                        <span className="inline-flex gap-1" aria-label={`${agentName} is working`}>
                            <Dot delay="0ms" />
                            <Dot delay="150ms" />
                            <Dot delay="300ms" />
                        </span>
                    </div>
                </div>
            )}

            <div ref={endRef} />
        </div>
    );
}

function Bubble({ entry, agentName }: { entry: ChatEntry; agentName: string }) {
    const mine = entry.role === 'user';

    return (
        <div className={`flex gap-3 ${mine ? 'flex-row-reverse' : ''}`}>
            <Who label={mine ? 'You' : agentName} />
            <div className={`max-w-[46rem] ${mine ? 'text-right' : ''}`}>
                <div
                    className={`inline-block rounded-lg px-3 py-2 text-left whitespace-pre-wrap break-words text-sm ${
                        mine ? 'bg-brand text-white' : 'bg-secondary-100 text-secondary-900'
                    }`}
                >
                    {entry.display || entry.content}
                </div>
                {entry.files && entry.files.length > 0 && (
                    <div className={`mt-1.5 flex flex-wrap gap-1.5 ${mine ? 'justify-end' : ''}`}>
                        {entry.files.map((name) => (
                            <Badge key={name} color="gray" variant="soft" size="sm">
                                {name}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function Who({ label }: { label: string }) {
    return (
        <div className="shrink-0 pt-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-secondary-500">
                {label}
            </span>
        </div>
    );
}

function Dot({ delay }: { delay: string }) {
    return (
        <span
            className="h-1.5 w-1.5 rounded-full bg-secondary-400 animate-bounce"
            style={{ animationDelay: delay }}
        />
    );
}
