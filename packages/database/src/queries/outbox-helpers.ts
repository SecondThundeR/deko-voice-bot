export const OUTBOX_NOOP_JOB_TYPE = "outbox.noop.v1";
export const OUTBOX_BACKOFF_INITIAL_MS = 1_000;
export const OUTBOX_BACKOFF_MAX_MS = 5 * 60_000;
export const OUTBOX_DEFAULT_MAX_ATTEMPTS = 5;
export const OUTBOX_DEFAULT_LEASE_MS = 60_000;

export type OutboxJobStatus = "pending" | "processing" | "completed" | "failed";

export type OutboxNoopJobInput = {
    jobType: typeof OUTBOX_NOOP_JOB_TYPE;
    payload: Record<string, never>;
};

function isEmptyJsonObject(value: unknown): value is Record<string, never> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return (
        (prototype === Object.prototype || prototype === null) &&
        Object.keys(value).length === 0 &&
        Object.getOwnPropertySymbols(value).length === 0
    );
}

/** Validates the only job contract currently understood by the outbox. */
export function validateOutboxJob(input: {
    jobType: unknown;
    payload: unknown;
}): OutboxNoopJobInput {
    if (input.jobType !== OUTBOX_NOOP_JOB_TYPE) {
        throw new TypeError(
            `Unsupported outbox job type: ${String(input.jobType)}`,
        );
    }
    if (!isEmptyJsonObject(input.payload)) {
        throw new TypeError("outbox.noop.v1 requires an empty object payload");
    }
    return { jobType: OUTBOX_NOOP_JOB_TYPE, payload: {} };
}

/** Returns the retry delay for an already-claimed attempt (attempts start at one). */
export function getOutboxBackoffMs(attempts: number) {
    if (!Number.isSafeInteger(attempts) || attempts < 1) {
        throw new RangeError("attempts must be a positive safe integer");
    }
    const exponent = Math.min(attempts - 1, 30);
    return Math.min(
        OUTBOX_BACKOFF_MAX_MS,
        OUTBOX_BACKOFF_INITIAL_MS * 2 ** exponent,
    );
}
