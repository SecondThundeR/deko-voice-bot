import { Composer } from "grammy";

import { incrementVoiceUsesAmountQuery } from "@/drizzle/prepared/voices";
import { updateUserData } from "@/drizzle/queries/insert";
import { getUserFavorites } from "@/drizzle/queries/select";

import { getArrayWithOffset } from "@/src/helpers/array";
import { getCurrentButtonText } from "@/src/helpers/inlineQuery";
import { getVoiceQueries } from "@/src/helpers/voices";
import { extractUserDetails } from "@/src/helpers/user";

import type { BotContext } from "@/src/types/bot";

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
    const currentQueriesArray = await getVoiceQueries(data, favoritesIds);
    const { array: paginatedQueries, nextOffset } = getArrayWithOffset(
        currentQueriesArray,
        currentOffset,
    );

    await ctx.answerInlineQuery(paginatedQueries, {
        next_offset: String(nextOffset),
        button: {
            text: await getCurrentButtonText(ctx, data),
            start_parameter: "_",
        },
        cache_time: 0,
    });
});
