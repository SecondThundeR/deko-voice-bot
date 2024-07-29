import TTLCache from "@isaacs/ttlcache";

export const lastUsedAtCache = new TTLCache<number, number | undefined>({
    ttl: Infinity,
});
