import { getVoiceByUniqueIdQuery } from "drizzle/prepared/voices";
import { Composer } from "grammy";
import type { Context } from "@/bot/context";
import { isAdmin } from "@/bot/filter/is-admin";
import { convertVoiceDataToQueriesArray } from "@/bot/helpers/inline-query";
import { logHandle } from "@/bot/helpers/logging";
import { voiceMenu } from "@/bot/menu/voice";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.on(":voice", logHandle("voice-item"), async (ctx) => {
    const fileUniqueId = ctx.message.voice.file_unique_id;

    const voiceData = await getVoiceByUniqueIdQuery.execute({ fileUniqueId });
    if (voiceData.length === 0) {
        return ctx.reply(ctx.t("voices.unknown"));
    }

    ctx.session.currentVoice = convertVoiceDataToQueriesArray(voiceData)[0];

    return ctx.reply(ctx.t("voices.menuItemHeader"), {
        reply_markup: voiceMenu,
    });
});

export { composer as voiceItemFeature };
