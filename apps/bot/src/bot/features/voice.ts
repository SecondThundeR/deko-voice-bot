import { getVoicesCount } from "@deko-voice-bot/database/queries/voices.js";
import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { createSelectVoiceKeyboard } from "#root/bot/keyboards/select-voice.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("voice", logHandle("command-voice"), async (ctx) => {
    const voicesCount = await getVoicesCount();
    if (voicesCount === 0) {
        return ctx.reply(ctx.t("voices-no-data"));
    }

    return ctx.reply(ctx.t("voices-item-menu-hint"), {
        reply_markup: createSelectVoiceKeyboard(ctx),
    });
});

export { composer as voiceFeature };
