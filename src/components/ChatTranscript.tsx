import { Badge, ContentRenderer, Text } from '@particle-academy/react-fancy';
import { useEffect, useRef } from 'react';
import type { ChatEntry } from '../types';

/**
 * Prose styling for rendered agent output.
 *
 * Written as arbitrary variants rather than a stylesheet so the package ships
 * no CSS of its own — a host that already scans this package with Tailwind gets
 * the styling for free, with nothing to import and nothing to override.
 */
const PROSE = [
    '[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
    '[&_strong]:font-semibold',
    '[&_em]:italic',
    '[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5',
    '[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5',
    '[&_li]:my-0.5',
    '[&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm',
    '[&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold',
    '[&_h1]:mt-2 [&_h2]:mt-2 [&_h3]:mt-2 [&_h1:first-child]:mt-0 [&_h2:first-child]:mt-0 [&_h3:first-child]:mt-0',
    '[&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]',
    '[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-black/5 [&_pre]:p-2',
    '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
    '[&_a]:underline [&_a]:underline-offset-2',
    '[&_blockquote]:border-l-2 [&_blockquote]:border-secondary-300 [&_blockquote]:pl-3 [&_blockquote]:italic',
    '[&_table]:my-2 [&_table]:w-full [&_table]:text-left',
    '[&_th]:border-b [&_th]:border-secondary-300 [&_th]:pr-3 [&_th]:font-medium',
    '[&_td]:border-b [&_td]:border-secondary-200 [&_td]:pr-3 [&_td]:align-top',
    '[&_hr]:my-2 [&_hr]:border-secondary-300',
].join(' ');

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
    const body = entry.display || entry.content || '';

    return (
        <div className={`flex gap-3 ${mine ? 'flex-row-reverse' : ''}`}>
            <Who label={mine ? 'You' : agentName} />
            <div className={`max-w-[46rem] ${mine ? 'text-right' : ''}`}>
                <div
                    className={`inline-block rounded-lg px-3 py-2 text-left break-words text-sm ${
                        mine
                            ? 'bg-brand text-white whitespace-pre-wrap'
                            : 'bg-secondary-100 text-secondary-900'
                    }`}
                >
                    {mine ? (
                        // The teacher's own words, verbatim. Rendering these as
                        // markdown would silently reformat what they typed.
                        body
                    ) : (
                        // Model output is markdown, and it is not trusted input —
                        // it can carry whatever an uploaded file talked it into
                        // writing. ContentRenderer sanitizes by default; never
                        // pass `unsafe` here.
                        <ContentRenderer value={body} format="markdown" className={PROSE} />
                    )}
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
