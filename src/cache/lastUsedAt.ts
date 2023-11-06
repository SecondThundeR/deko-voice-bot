import TTLCache from "npm:@isaacs/ttlcache@1.4.1";

export const lastUsedAtCache = new TTLCache<number, number | undefined>({
    ttl: Infinity,
});
