import { TTLCache } from "@/deps.ts";

export const lastUsedAtCache = new TTLCache<number, number | undefined>({
    ttl: Infinity,
});
