import { Composer } from "grammy";

import { incrementVoiceUsesAmountQuery } from "@/drizzle/prepared/voices";
import { updateUserData } from "@/drizzle/queries/insert";
import { getUserFavorites } from "@/drizzle/queries/select";

import { MAX_QUERY_ELEMENTS_PER_PAGE } from "@/src/constants/inline";

import { offsetArray } from "@/src/helpers/array";
import { getCurrentButtonText } from "@/src/helpers/inlineQuery";
import { getVoiceQueries } from "@/src/helpers/voices";
import { extractUserDetails } from "@/src/helpers/user";

import type { BotContext } from "@/src/types/bot";
import type { InlineQueriesArray } from "@/src/types/inline";

export const inlineQueryHandler = new Composer<BotContext>();

inlineQueryHandler.on("chosen_inline_result", async (ctx) => {
    const { from, result_id: voiceId } = ctx.chosenInlineResult;
    const userDetails = extractUserDetails(from);

    await incrementVoiceUsesAmountQuery.execute({ voiceId });
    if (userDetails) {
        await updateUserData(userDetails);
    }
});

inlineQueryHandler.on("inline_query", async (ctx) => {
    const userID = ctx.from.id;
    const currentOffset = Number(ctx.update.inline_query.offset) || 0;
    const data = ctx.update.inline_query.query;

    const favoritesIds = await getUserFavorites(userID);
    const currentQueriesArray = (await getVoiceQueries(
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
            text: await getCurrentButtonText(ctx, data),
            start_parameter: "_",
        },
        cache_time: 0,
    });
});
