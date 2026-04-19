import { Composer } from "grammy";
import { incrementVoiceUsesAmountQuery } from "@/drizzle/prepared/voices";
import { updateUserData } from "@/drizzle/queries/insert";
import { getUserFavorites } from "@/drizzle/queries/select";
import type { Context } from "../context";
import { getArrayWithOffset } from "../helpers/array";
import { logHandle } from "../helpers/logging";
import { extractUserDetails } from "../helpers/user";
import { getVoiceQueries } from "../helpers/voices";

const composer = new Composer<Context>();

composer.on(
    "chosen_inline_result",
    logHandle("chosen-inline-result"),
    async (ctx) => {
        const { from, result_id: voiceId } = ctx.chosenInlineResult;
        const userDetails = extractUserDetails(from);

        await incrementVoiceUsesAmountQuery.execute({ voiceId });
        await updateUserData(userDetails);
    },
);

composer.on("inline_query", logHandle("inline-query"), async (ctx) => {
    const userID = ctx.from.id;
    const currentOffset = Number(ctx.update.inline_query.offset) || 0;
    const data = ctx.update.inline_query.query;

    const favoritesIds = await getUserFavorites(userID);
    const currentQueriesArray = await getVoiceQueries(data, favoritesIds);
    const { array: paginatedQueries, nextOffset } = getArrayWithOffset(
        currentQueriesArray,
        currentOffset,
        // Showing 5 items per page to save bandwidth if search query is less than 3 chars
        data.length > 0 && data.length < 3 ? 5 : undefined,
    );

    await ctx.answerInlineQuery(paginatedQueries, {
        next_offset: String(nextOffset),
        button: {
            text: ctx.t("donate.queryText"),
            start_parameter: "donate",
        },
        cache_time: 10,
        is_personal: true,
    });
});

export { composer as inlineQueryFeature };
