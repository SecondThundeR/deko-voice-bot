import { Composer } from "grammy";

import { getByUniqueID } from "@/src/database/general/voices/getByUniqueID";

import { convertVoiceDataToQueriesArray } from "@/src/helpers/voices";

import { voiceMenu } from "@/src/menu/voice";

import type { BotContext } from "@/src/types/bot";

export const voiceItemHandler = new Composer<BotContext>();

voiceItemHandler.on(":voice", async (ctx) => {
    const uniqueId = ctx.message?.voice.file_unique_id;
    if (!uniqueId) return;

    const voiceData = await getByUniqueID(uniqueId);
    if (!voiceData) return;

    const queryData = convertVoiceDataToQueriesArray([voiceData])[0];
    ctx.session.currentVoice = queryData;

    await ctx.reply(ctx.t("voices.menuItemHeader"), {
        reply_markup: voiceMenu,
    });
});
