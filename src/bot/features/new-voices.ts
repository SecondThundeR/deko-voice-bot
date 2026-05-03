import { Composer } from "grammy";
import type { Context } from "@/bot/context";
import { NEW_VOICES_CONVERSATION } from "@/bot/conversations/new-voices";
import { isAdmin } from "@/bot/filter/is-admin";
import { getFFMPEGStatus } from "@/bot/helpers/general";
import { logHandle } from "@/bot/helpers/logging";

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
