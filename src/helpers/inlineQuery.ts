import { getVoicesCount } from "@/drizzle/queries/select";
import type { SelectVoice } from "@/drizzle/schema";

import type { BotContext } from "@/src/types/bot";
import type { InlineResultVoice } from "@/src/types/inline";

import { convertVoiceUrl } from "./general";

export async function getCurrentButtonText(
    ctx: BotContext,
    queryString: string,
) {
    const queriesCount = await getVoicesCount(queryString);

    if (queriesCount === 0) return ctx.t("inline.noData");
    if (queryString.length === 0) return ctx.t("inline.searchPlaceholder");

    return ctx.t("inline.searchHeader", {
        query: queryString,
    });
}

export function convertVoiceDataToQueriesArray(voicesData: SelectVoice[]) {
    return voicesData
        .map(
            ({
                voiceId: id,
                voiceTitle: title,
                url,
                fileId: voice_file_id,
            }) => {
                if (!url) {
                    return {
                        type: "voice",
                        id,
                        title,
                        voice_file_id,
                    };
                }

                try {
                    return {
                        type: "voice",
                        id,
                        title,
                        voice_url: convertVoiceUrl(url),
                    };
                } catch (error: unknown) {
                    console.error(
                        `Failed to process "${title}" (${id})\n${error}`,
                    );

                    return null;
                }
            },
        )
        .filter((item) => item !== null) as InlineResultVoice[];
}
