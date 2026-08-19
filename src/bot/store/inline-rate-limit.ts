const CAPACITY = 30;
const REFILL_PER_SECOND = 3;
const BUCKET_TTL_MS = 20_000;
const CLEANUP_INTERVAL_MS = 60_000;

type TokenBucket = {
    expiresAt: number;
    tokens: number;
    updatedAt: number;
};

const buckets = new Map<number, TokenBucket>();

const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [userId, bucket] of buckets) {
        if (bucket.expiresAt <= now) {
            buckets.delete(userId);
        }
    }
}, CLEANUP_INTERVAL_MS);
cleanupInterval.unref();

export function consumeInlineQueryToken(userId: number) {
    const now = Date.now();
    const current = buckets.get(userId);
    const elapsedSeconds = current ? (now - current.updatedAt) / 1_000 : 0;
    const tokens = Math.min(
        CAPACITY,
        (current?.tokens ?? CAPACITY) + elapsedSeconds * REFILL_PER_SECOND,
    );
    const allowed = tokens >= 1;

    buckets.set(userId, {
        expiresAt: now + BUCKET_TTL_MS,
        tokens: allowed ? tokens - 1 : tokens,
        updatedAt: now,
    });

    return allowed;
}
