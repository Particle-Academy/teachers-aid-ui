/**
 * The shapes this UX renders. They mirror what particle-academy/teachers-aid
 * serialises, but nothing here imports it — the package is a view over plain
 * JSON, so a host on any backend can feed it.
 */

export type ChangeAction = 'create' | 'update' | 'delete';

/** One proposed change. Inert until a human applies the plan it belongs to. */
export interface ChangeOperation {
    action: ChangeAction;
    entity: string;
    /** Human-readable one-liner for the review list. */
    description: string;
    attributes?: Record<string, unknown>;
    /** Present on updates and deletes. */
    id?: number;
    /**
     * Name this operation's new record is referred to by later in the same
     * plan, e.g. a lesson pointing at `$c1` before the course has an id.
     */
    ref?: string;
}

export interface ChangePlan {
    operations: ChangeOperation[];
    /** Counts keyed by "action entity", e.g. `{"create lesson": 3}`. */
    summary?: Record<string, number>;
    count: number;
}

export interface ChatEntry {
    role: 'user' | 'assistant';
    /**
     * What to show. Distinct from what the model was sent, which has extracted
     * file text folded into it — rendering that would paste a whole handbook
     * back at the teacher.
     */
    display?: string;
    content?: string;
    /** Names of files attached to this turn. */
    files?: string[];
}
