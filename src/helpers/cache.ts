import { rootQueryCache } from "@/src/handlers/inlineQuery.ts";

/**
 * Invalidates root cache by clearing it
 */
export function invalidateRootCache() {
    rootQueryCache.clear();
}
