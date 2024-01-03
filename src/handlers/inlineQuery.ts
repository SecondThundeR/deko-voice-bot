import { Composer } from "@/deps.ts";

import { featureFlags } from "@/src/constants/database.ts";
import { maxQueryElementsPerPage } from "@/src/constants/inline.ts";
import { locale } from "@/src/constants/locale.ts";
import { updateStats } from "@/src/database/deko/usersData/updateStats.ts";
import { getFeatureFlag } from "@/src/database/general/featureFlags/getFeatureFlag.ts";
import { offsetArray } from "@/src/helpers/array.ts";
import { getCurrentButtonText } from "@/src/helpers/inlineQuery.ts";
import { getCurrentVoiceQueriesData } from "@/src/helpers/voices.ts";
import { getFavoriteVoiceStatusArray } from "@/src/helpers/cache.ts";

const { button } = locale.frontend.maintenance;

const inlineQueryHandler = new Composer();

inlineQueryHandler.on("chosen_inline_result", async (ctx) => {
    const { from, result_id: voiceID } = ctx.update.chosen_inline_result;
    await updateStats(voiceID, from);
});

inlineQueryHandler.on("inline_query", async (ctx) => {
    const isInMaintenance = await getFeatureFlag(featureFlags.maintenance);
    if (isInMaintenance) {
        await ctx.answerInlineQuery([], {
            button: {
                text: button,
                start_parameter: featureFlags.maintenance,
            },
            cache_time: 0,
        });
    }

    const userID = ctx.from.id;
    const currentOffset = Number(ctx.update.inline_query.offset) || 0;
    const data = ctx.update.inline_query.query;
    const favoritesIds = await getFavoriteVoiceStatusArray(userID);
    const currentQueriesArray = await getCurrentVoiceQueriesData(
        data,
        favoritesIds,
    );
    const { array: paginatedQueries, nextOffset } = offsetArray({
        array: currentQueriesArray,
        currentOffset,
        offsetSize: maxQueryElementsPerPage,
    });

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
