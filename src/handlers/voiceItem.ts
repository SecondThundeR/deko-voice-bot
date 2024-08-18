import { Composer } from "grammy";

import { getVoiceByUniqueIdQuery } from "@/drizzle/prepared/voices";

import { convertVoiceDataToQueriesArray } from "@/src/helpers/inlineQuery";

import { voiceMenu } from "@/src/menu/voice";

import type { BotContext } from "@/src/types/bot";

export const voiceItemHandler = new Composer<BotContext>();

voiceItemHandler.on(":voice", async (ctx) => {
    const fileUniqueId = ctx.message?.voice.file_unique_id;
    if (!fileUniqueId) return;

    const voiceData = await getVoiceByUniqueIdQuery.execute({ fileUniqueId });
    if (voiceData.length === 0) return;

    const queryData = convertVoiceDataToQueriesArray(voiceData)[0];
    ctx.session.currentVoice = queryData;

    await ctx.reply(ctx.t("voices.menuItemHeader"), {
        reply_markup: voiceMenu,
    });
});
