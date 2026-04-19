import { Composer } from "grammy";
import type { Context } from "../context";
import { NEW_VOICES_CONVERSATION } from "../conversations/new-voices";
import { isAdmin } from "../filter/is-admin";
import { getFFMPEGStatus } from "../helpers/general";
import { logHandle } from "../helpers/logging";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("newvoices", logHandle("command-new-voices"), async (ctx) => {
    if (!getFFMPEGStatus()) return await ctx.reply(ctx.t("newvoices.noFFMPEG"));

    await ctx.conversation.enter(NEW_VOICES_CONVERSATION);
});

export { composer as newVoicesFeature };
