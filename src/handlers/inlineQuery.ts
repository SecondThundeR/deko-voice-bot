import { Composer } from "@/deps.ts";

import { featureFlags } from "@/src/constants/database.ts";
import { maxQueryElementsPerPage } from "@/src/constants/inline.ts";
import { locale } from "@/src/constants/locale.ts";
import {
    updateUsersStats,
    updateVoiceStats,
} from "@/src/database/deko/stats/updateStats.ts";
import { offsetArray } from "@/src/helpers/array.ts";
import { getCurrentButtonText } from "@/src/helpers/inlineQuery.ts";
import { getCurrentVoiceQueriesData } from "@/src/helpers/voices.ts";
import { featureFlagsCache } from "@/src/cache/featureFlags.ts";

const { button } = locale.frontend.maintenance;

const inlineQueryHandler = new Composer();

inlineQueryHandler.on("chosen_inline_result", async (ctx) => {
    const { from, result_id: voiceID } = ctx.update.chosen_inline_result;
    await Promise.all([updateVoiceStats(voiceID), updateUsersStats(from)]);
});

inlineQueryHandler.on("inline_query", async (ctx) => {
    if (featureFlagsCache.get(featureFlags.maintenance)) {
        await ctx.answerInlineQuery([], {
            button: {
                text: button,
                start_parameter: featureFlags.maintenance,
            },
            cache_time: 0,
        });
    }

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
