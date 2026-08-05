import { Text, type Color } from '@particle-academy/react-fancy';
import { ChatTranscript } from './ChatTranscript';
import { MessageComposer } from './MessageComposer';
import { PlanReview } from './PlanReview';
import type { ChangePlan, ChatEntry } from '../types';

export interface TeachersAidChatProps {
    agentName: string;
    history: ChatEntry[];
    plan?: ChangePlan | null;
    onSend: (message: string, files: File[], reset: () => void) => void;
    onApply: () => void;
    onDiscard: () => void;
    onReset?: () => void;
    /** A turn or a plan action is in flight. */
    busy?: boolean;
    /**
     * Optimistic turn to append while the model works, so the transcript does
     * not sit empty during a slow call.
     */
    pending?: ChatEntry | null;
    /** False disables input. Pair it with a banner saying why. */
    configured?: boolean;
    /** Rendered above the plan — flash messages, key warnings, anything. */
    banner?: React.ReactNode;
    description?: React.ReactNode;
    className?: string;
    /** react-fancy colour for the primary actions (send, apply). */
    color?: Color;
}

/**
 * The whole Teachers Aid surface: plan review, transcript, composer.
 *
 * Fully controlled and transport-agnostic — it takes data and callbacks and
 * imports no router or HTTP client. The host owns how a message is sent, which
 * is what lets the same component sit on Inertia, a fetch call or a websocket.
 */
export function TeachersAidChat({
    agentName,
    history,
    plan,
    onSend,
    onApply,
    onDiscard,
    onReset,
    busy,
    pending,
    configured = true,
    banner,
    description,
    className,
    color = 'red',
}: TeachersAidChatProps) {
    const transcript = pending ? [...history, pending] : history;

    return (
        <div className={`grid gap-4 ${className ?? ''}`}>
            {description && <Text className="!text-sm !text-secondary-600">{description}</Text>}

            {banner}

            <PlanReview plan={plan} busy={busy} onApply={onApply} onDiscard={onDiscard} color={color} />

            <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-lg border border-secondary-200 bg-white">
                <div className="flex items-center justify-between border-b border-secondary-200 px-4 py-2">
                    <Text className="!text-xs !font-semibold !uppercase !tracking-wide !text-secondary-500">
                        Conversation
                    </Text>
                    {onReset && history.length > 0 && (
                        <button
                            type="button"
                            onClick={onReset}
                            disabled={busy}
                            className="text-xs text-secondary-500 hover:text-primary-600 disabled:opacity-50"
                        >
                            Clear conversation
                        </button>
                    )}
                </div>

                <ChatTranscript
                    history={transcript}
                    agentName={agentName}
                    thinking={!!busy && !!pending}
                />

                <MessageComposer
                    onSend={onSend}
                    agentName={agentName}
                    disabled={busy || !configured}
                    busy={busy}
                    color={color}
                />
            </div>
        </div>
    );
}
