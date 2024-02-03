import { checkQueriesCache } from "@/src/helpers/cache.ts";

import type { BotContext } from "@/src/types/bot.ts";

/**
 * Gets current text for inline query button
 *
 * If query string is not present, shows placeholder header, else current query string
 *
 * @param queryString String for filtering voice queries
 * @returns Button text
 */
export function getCurrentButtonText(ctx: BotContext, queryString: string) {
    const queries = checkQueriesCache();

    if (!queries || queries.length === 0) return ctx.t("inline.noData");
    if (queryString.length === 0) return ctx.t("inline.searchPlaceholder");

    return ctx.t("inline.searchHeader", {
        query: queryString,
    });
}
