import { Composer } from "grammy";

import { MAX_QUERY_ELEMENTS_PER_PAGE } from "@/src/constants/inline";

import { updateStats } from "@/src/database/general/usersData/updateStats";

import { offsetArray } from "@/src/helpers/array";
import { getFavoriteVoiceStatusArray } from "@/src/helpers/cache";
import { getCurrentButtonText } from "@/src/helpers/inlineQuery";
import { getCurrentVoiceQueriesData } from "@/src/helpers/voices";

import type { BotContext } from "@/src/types/bot";
import type { InlineQueriesArray } from "@/src/types/inline";

export const inlineQueryHandler = new Composer<BotContext>();

inlineQueryHandler.on("chosen_inline_result", async (ctx) => {
    const { from, result_id: voiceID } = ctx.chosenInlineResult;
    await updateStats(voiceID, from);
});

inlineQueryHandler.on("inline_query", async (ctx) => {
    const userID = ctx.from.id;
    const currentOffset = Number(ctx.update.inline_query.offset) || 0;
    const data = ctx.update.inline_query.query;
    const favoritesIds = await getFavoriteVoiceStatusArray(userID);
    const currentQueriesArray = (await getCurrentVoiceQueriesData(
        data,
        favoritesIds,
    )) as InlineQueriesArray;
    const { array: paginatedQueries, nextOffset } = offsetArray({
        array: currentQueriesArray,
        currentOffset,
        offsetSize: MAX_QUERY_ELEMENTS_PER_PAGE,
    });

    await ctx.answerInlineQuery(paginatedQueries, {
        next_offset: nextOffset,
        button: {
            text: getCurrentButtonText(ctx, data),
            start_parameter: "_",
        },
        cache_time: 0,
    });
});
