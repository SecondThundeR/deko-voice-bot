import { Composer } from "@/deps.ts";

import { maxQueryElementsPerPage } from "@/src/constants/inline.ts";
import {
    updateUsersStats,
    updateVoiceStats,
} from "@/src/database/deko/stats/updateStats.ts";
import { offsetArray } from "@/src/helpers/array.ts";
import { getCurrentButtonText } from "@/src/helpers/inlineQuery.ts";
import { getCurrentVoiceQueriesData } from "@/src/helpers/voices.ts";

const inlineQueryHandler = new Composer();

inlineQueryHandler.on("chosen_inline_result", async (ctx) => {
    const { from, result_id: voiceID } = ctx.update.chosen_inline_result;
    await Promise.all([updateVoiceStats(voiceID), updateUsersStats(from)]);
});

inlineQueryHandler.on("inline_query", async (ctx) => {
    const currentOffset = Number(ctx.update.inline_query.offset) || 0;
    const data = ctx.update.inline_query.query;
    const currentQueriesArray = await getCurrentVoiceQueriesData(data);
    const { array: paginatedQueries, nextOffset } = offsetArray(
        currentQueriesArray,
        currentOffset,
        maxQueryElementsPerPage,
    );

    await ctx.answerInlineQuery(paginatedQueries, {
        next_offset: nextOffset,
        button: {
            text: getCurrentButtonText(data),
            start_parameter: "_",
        },
        cache_time: 0,
    });
});

export { inlineQueryHandler };
