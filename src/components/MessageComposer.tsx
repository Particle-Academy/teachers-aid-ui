import { Badge, Button, Text, type Color } from '@particle-academy/react-fancy';
import { useRef, useState } from 'react';

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.gif,.webp,.docx,.xlsx,.csv,.txt,.pptx';

export interface MessageComposerProps {
    onSend: (message: string, files: File[], reset: () => void) => void;
    agentName: string;
    /** Blocks input — in flight, or no model configured. */
    disabled?: boolean;
    /** Spins the send button. Distinct from `disabled` on purpose. */
    busy?: boolean;
    accept?: string;
    maxFiles?: number;
    hint?: React.ReactNode;
    /** react-fancy Button colour for the send action. */
    color?: Color;
}

/**
 * Message box with file drop.
 *
 * Named to avoid colliding with react-fancy's own `Composer`, and hand-rolled
 * rather than using its `PromptInput` because that component maps dropped
 * files to `{id, name, bytes}` and discards the File — so the chip renders but
 * the upload can never happen. Reported upstream; switch to it once the
 * attachment carries the file.
 *
 * Attachments are held here until send, so a mistaken drop can be removed
 * before it costs a model call.
 */
export function MessageComposer({
    onSend,
    agentName,
    disabled,
    busy,
    accept = ACCEPT,
    maxFiles = 10,
    hint,
    color = 'red',
}: MessageComposerProps) {
    const [message, setMessage] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function addFiles(list: FileList | null) {
        const incoming = Array.from(list ?? []);
        if (incoming.length === 0) return;

        setFiles((current) => {
            // De-dupe by name+size so dropping the same file twice does not
            // send it twice and pay for it twice.
            const seen = new Set(current.map((f) => `${f.name}:${f.size}`));
            return [...current, ...incoming.filter((f) => !seen.has(`${f.name}:${f.size}`))].slice(
                0,
                maxFiles,
            );
        });
    }

    function submit(e: React.FormEvent | React.KeyboardEvent) {
        e.preventDefault();
        if (disabled || message.trim() === '') return;

        onSend(message.trim(), files, () => {
            setMessage('');
            setFiles([]);
            if (inputRef.current) inputRef.current.value = '';
        });
    }

    function onKeyDown(e: React.KeyboardEvent) {
        // Enter sends, Shift+Enter breaks the line — the convention everywhere
        // else, and course descriptions are multi-line often enough to matter.
        if (e.key === 'Enter' && !e.shiftKey) submit(e);
    }

    return (
        <form
            onSubmit={submit}
            onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
            }}
            className={`border-t px-4 py-3 transition ${
                dragging ? 'border-brand bg-primary-50' : 'border-secondary-200 bg-white'
            }`}
        >
            {files.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                    {files.map((file, i) => (
                        <span key={`${file.name}:${i}`} className="inline-flex items-center gap-1">
                            <Badge color="blue" variant="soft" size="sm">
                                {file.name} · {Math.max(1, Math.round(file.size / 1024))} KB
                            </Badge>
                            <button
                                type="button"
                                onClick={() => setFiles((c) => c.filter((_, j) => j !== i))}
                                className="text-xs text-secondary-500 hover:text-primary-600"
                                aria-label={`Remove ${file.name}`}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-2">
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="shrink-0 rounded-md border border-secondary-300 px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                    title="Attach course material"
                >
                    Attach
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={accept}
                    className="hidden"
                    onChange={(e) => addFiles(e.target.files)}
                />

                <textarea
                    rows={2}
                    value={message}
                    disabled={disabled}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={`Ask ${agentName} to draft or update course material…`}
                    className="flex-1 resize-none rounded-md border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15 disabled:bg-secondary-50"
                />

                <Button
                    type="submit"
                    // Colour comes from the PROP, not a forced `!bg-brand`
                    // class. That token is defined by some hosts and not
                    // others, so forcing it renders an unstyled grey slab
                    // wherever it is absent — with no error to trace.
                    color={color}
                    // Only `busy`, never `disabled` — the box is also disabled
                    // when no model is configured, and a permanent spinner reads
                    // as "working" when nothing is happening at all.
                    loading={busy}
                    disabled={disabled || message.trim() === ''}
                    className="!font-semibold"
                >
                    Send
                </Button>
            </div>

            <Text className="!text-[11px] !text-secondary-500 !mt-1.5">
                {hint ?? (
                    <>
                        PDF and images are read directly; Word, Excel, PowerPoint and CSV are converted
                        to text first. Drop files anywhere on this box.
                    </>
                )}
            </Text>
        </form>
    );
}
