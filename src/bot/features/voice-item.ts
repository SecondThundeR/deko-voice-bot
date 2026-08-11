import { Composer } from "grammy";
import { getVoicesByUniqueId } from "#drizzle/queries/voices.js";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { convertVoiceDataToQueriesArray } from "#root/bot/helpers/inline-query.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { voiceMenu } from "#root/bot/menu/voice.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.on(":voice", logHandle("voice-item"), async (ctx) => {
    const fileUniqueId = ctx.message.voice.file_unique_id;

    const voiceData = await getVoicesByUniqueId(fileUniqueId);
    if (voiceData.length === 0) {
        return ctx.reply(ctx.t("voices-unknown"));
    }

    if (voiceData.length > 1) {
        ctx.logger.warn({
            msg: "Multiple voices have the same Telegram file_unique_id",
            fileUniqueId,
            matches: voiceData.length,
            voiceIds: voiceData.map(({ voiceId }) => voiceId),
        });
    }

    ctx.session.currentVoice = convertVoiceDataToQueriesArray(voiceData)[0];

    return ctx.reply(ctx.t("voices-item-menu-header"), {
        reply_markup: voiceMenu,
    });
});

export { composer as voiceItemFeature };
