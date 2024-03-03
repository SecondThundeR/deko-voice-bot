import { Composer } from "@/deps.ts";

import { getByUniqueID } from "@/src/database/general/voices/getByUniqueID.ts";

import { convertVoiceDataToQueriesArray } from "@/src/helpers/voices.ts";

import { BotContext } from "@/src/types/bot.ts";
import { voiceMenu } from "@/src/menu/voice.ts";

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
