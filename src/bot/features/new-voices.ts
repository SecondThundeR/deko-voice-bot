import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { NEW_VOICES_CONVERSATION } from "#root/bot/conversations/new-voices.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { getFFMPEGStatus } from "#root/bot/helpers/general.js";
import { logHandle } from "#root/bot/helpers/logging.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("newvoices", logHandle("command-new-voices"), async (ctx) => {
    const ffmpegStatus = await getFFMPEGStatus();
    if (!ffmpegStatus) {
        return ctx.reply(ctx.t("newvoices.noFFMPEG"));
    }

    return ctx.conversation.enter(NEW_VOICES_CONVERSATION);
});

export { composer as newVoicesFeature };
