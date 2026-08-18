export type RateLimitPolicy = { limit: number; windowMs: number };
export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export interface RateLimiter {
    consume(key: string, policy: RateLimitPolicy): Promise<RateLimitResult>;
}

type Entry = { count: number; resetAt: number };
export class InMemoryRateLimiter implements RateLimiter {
    private readonly entries = new Map<string, Entry>();
    async consume(
        key: string,
        policy: RateLimitPolicy,
    ): Promise<RateLimitResult> {
        const now = Date.now();
        const entry = this.entries.get(key);
        if (!entry || entry.resetAt <= now) {
            this.entries.set(key, { count: 1, resetAt: now + policy.windowMs });
            return { allowed: true, retryAfterSeconds: 0 };
        }
        entry.count += 1;
        return {
            allowed: entry.count <= policy.limit,
            retryAfterSeconds: Math.max(
                1,
                Math.ceil((entry.resetAt - now) / 1000),
            ),
        };
    }
}

export class RedisRateLimiter implements RateLimiter {
    private readonly redis: {
        eval(
            script: string,
            keyCount: number,
            ...args: Array<string | number>
        ): Promise<unknown>;
    };
    constructor(redis: {
        eval(
            script: string,
            keyCount: number,
            ...args: Array<string | number>
        ): Promise<unknown>;
    }) {
        this.redis = redis;
    }
    async consume(
        key: string,
        policy: RateLimitPolicy,
    ): Promise<RateLimitResult> {
        // One Redis script makes increment, expiry creation, and retry TTL atomic across instances.
        const result = (await this.redis.eval(
            "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end; return {n,redis.call('PTTL',KEYS[1])}",
            1,
            key,
            policy.windowMs,
        )) as [number, number];
        return {
            allowed: result[0] <= policy.limit,
            retryAfterSeconds: Math.max(1, Math.ceil(result[1] / 1000)),
        };
    }
}
