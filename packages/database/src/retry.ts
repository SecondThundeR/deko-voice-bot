import { setTimeout as delay } from "node:timers/promises";

const RETRY_DELAYS_MS = [0, 100, 300] as const;
const TRANSIENT_SQLSTATES = new Set([
    "40001",
    "40P01",
    "55P03",
    "57014",
    "08000",
    "08003",
    "08006",
]);

function isTransientDatabaseError(error: unknown) {
    return (
        !!error &&
        typeof error === "object" &&
        "code" in error &&
        typeof error.code === "string" &&
        TRANSIENT_SQLSTATES.has(error.code)
    );
}

export async function retryDatabaseOperation<T>(
    operation: () => Promise<T>,
    onError?: (error: unknown, attempt: number, isLastAttempt: boolean) => void,
) {
    for (const [attempt, retryDelayMs] of RETRY_DELAYS_MS.entries()) {
        if (retryDelayMs > 0) await delay(retryDelayMs);
        try {
            return await operation();
        } catch (error) {
            const isLastAttempt = attempt === RETRY_DELAYS_MS.length - 1;
            onError?.(error, attempt, isLastAttempt);
            if (isLastAttempt || !isTransientDatabaseError(error)) throw error;
        }
    }

    throw new Error("Database retry loop exhausted unexpectedly");
}
