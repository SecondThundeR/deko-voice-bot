const TRANSIENT_ERROR_CODES = new Set([
    // PostgreSQL transaction and connection errors
    "40001",
    "40P01",
    "55P03",
    "57014",
    "08000",
    "08003",
    "08006",
    // Node.js and fetch connection errors
    "ECONNREFUSED",
    "ECONNRESET",
    "EAI_AGAIN",
    "ENETDOWN",
    "ENETUNREACH",
    "EPIPE",
    "ETIMEDOUT",
]);

const BASE_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 5 * 60_000;
const MAX_ERROR_CHAIN_DEPTH = 8;

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object";
}

function getErrorChain(error: unknown) {
    const chain: Record<string, unknown>[] = [];
    const seen = new Set<unknown>();
    let current: unknown = error;

    while (
        isRecord(current) &&
        !seen.has(current) &&
        chain.length < MAX_ERROR_CHAIN_DEPTH
    ) {
        seen.add(current);
        chain.push(current);
        current = isRecord(current.error) ? current.error : current.cause;
    }

    return chain;
}

export function isTransientWebhookError(error: unknown) {
    return getErrorChain(error).some((item) => {
        if (item.name === "HttpError") {
            return true;
        }

        const errorCode = item.error_code;
        if (
            typeof errorCode === "number" &&
            (errorCode === 429 || errorCode >= 500)
        ) {
            return true;
        }

        const code = item.code;
        return (
            typeof code === "string" &&
            (TRANSIENT_ERROR_CODES.has(code) || code.startsWith("UND_ERR_"))
        );
    });
}

export function getWebhookRetryDelayMs(error: unknown, attempt: number) {
    const exponentialDelay = Math.min(
        MAX_RETRY_DELAY_MS,
        BASE_RETRY_DELAY_MS * 2 ** Math.max(0, attempt - 1),
    );
    const retryAfterMs = getErrorChain(error).reduce((delay, item) => {
        const parameters = item.parameters;
        if (!isRecord(parameters)) return delay;

        const retryAfter = parameters.retry_after;
        return typeof retryAfter === "number" && Number.isFinite(retryAfter)
            ? Math.max(delay, retryAfter * 1_000)
            : delay;
    }, 0);

    return Math.min(
        MAX_RETRY_DELAY_MS,
        Math.max(exponentialDelay, retryAfterMs),
    );
}
