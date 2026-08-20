import { Composer } from "grammy";
import { apiClient } from "#root/api/client.js";
import type { Context } from "#root/bot/context.js";
import { NEW_VOICES_CONVERSATION } from "#root/bot/conversations/new-voices.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { logHandle } from "#root/bot/helpers/logging.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("newvoices", logHandle("command-new-voices"), async (ctx) => {
    const { ffmpegAvailable } = await apiClient.getHealth();
    if (!ffmpegAvailable) {
        return ctx.reply(ctx.t("new-voices-ffmpeg-unavailable"));
    }

    return ctx.conversation.enter(NEW_VOICES_CONVERSATION);
});

export { composer as newVoicesFeature };
