import { checkQueriesCache } from "@/src/helpers/cache";

import type { BotContext } from "@/src/types/bot";

/**
 * Gets current text for inline query button
 *
 * @description If query string is not present, shows placeholder header,
 * else current query string
 *
 * @param queryString String for filtering voice queries
 * @returns Button text
 */
export async function getCurrentButtonText(
    ctx: BotContext,
    queryString: string,
) {
    const queries = await checkQueriesCache(queryString);

    if (!queries || queries.length === 0) return ctx.t("inline.noData");
    if (queryString.length === 0) return ctx.t("inline.searchPlaceholder");

    return ctx.t("inline.searchHeader", {
        query: queryString,
    });
}
