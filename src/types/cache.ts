import type TTLCache from "@isaacs/ttlcache";
import type { SetOptions } from "@isaacs/ttlcache";

export interface CacheStub<K, V>
    extends Pick<TTLCache<K, V>, "clear" | "get" | "has" | "delete"> {
    set: (key: K, value: V, options?: SetOptions) => CacheStub<K, V>;
}
