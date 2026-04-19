import { Composer } from "grammy";
import { getVoiceByUniqueIdQuery } from "@/drizzle/prepared/voices";
import type { Context } from "../context";
import { isAdmin } from "../filter/is-admin";
import { convertVoiceDataToQueriesArray } from "../helpers/inline-query";
import { logHandle } from "../helpers/logging";
import { voiceMenu } from "../menu/voice";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.on(":voice", logHandle("voice-item"), async (ctx) => {
    const fileUniqueId = ctx.message.voice.file_unique_id;

    const voiceData = await getVoiceByUniqueIdQuery.execute({ fileUniqueId });
    if (voiceData.length === 0) return;

    ctx.session.currentVoice = convertVoiceDataToQueriesArray(voiceData)[0];

    await ctx.reply(ctx.t("voices.menuItemHeader"), {
        reply_markup: voiceMenu,
    });
});

export { composer as voiceItemFeature };
