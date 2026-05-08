import { trackUserUsage, trackVoiceUsage } from "drizzle/queries/usage-stats";
import { Composer } from "grammy";
import { MAX_QUERY_ELEMENTS_PER_PAGE } from "@/bot/constants/inline";
import type { Context } from "@/bot/context";
import { logHandle } from "@/bot/helpers/logging";
import { extractUserDetails } from "@/bot/helpers/user";
import { getVoiceQueriesPage } from "@/bot/helpers/voices";

const composer = new Composer<Context>();
const MAX_INLINE_QUERY_OFFSET = 1000;

composer.on(
    "chosen_inline_result",
    logHandle("chosen-inline-result"),
    async (ctx) => {
        const { from, result_id: voiceId } = ctx.chosenInlineResult;
        const userDetails = extractUserDetails(from);

        trackVoiceUsage(voiceId, ctx.logger);
        trackUserUsage(userDetails, ctx.logger);
    },
);

composer.on("inline_query", logHandle("inline-query"), async (ctx) => {
    const userID = ctx.from.id;
    const requestedOffset = Number(ctx.update.inline_query.offset) || 0;
    const currentOffset =
        Number.isInteger(requestedOffset) && requestedOffset > 0
            ? Math.min(requestedOffset, MAX_INLINE_QUERY_OFFSET)
            : 0;
    const data = ctx.update.inline_query.query;
    const pageSize =
        // Showing 5 items per page to save bandwidth if search query is less than 3 chars
        data.length > 0 && data.length < 3 ? 5 : MAX_QUERY_ELEMENTS_PER_PAGE;

    const currentQueriesPage = await getVoiceQueriesPage({
        favoritesUserId: userID,
        limit: pageSize + 1,
        offset: currentOffset,
        queryString: data,
    });
    const paginatedQueries = currentQueriesPage.slice(0, pageSize);
    const nextOffset =
        currentQueriesPage.length > pageSize
            ? currentOffset + pageSize
            : undefined;

    return ctx.answerInlineQuery(paginatedQueries, {
        next_offset: nextOffset ? String(nextOffset) : undefined,
        button: {
            text: ctx.t("donate.queryText"),
            start_parameter: "donate",
        },
        cache_time: 10,
        is_personal: true,
    });
});

export { composer as inlineQueryFeature };
