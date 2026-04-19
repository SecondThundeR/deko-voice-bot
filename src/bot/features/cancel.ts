import { Composer } from "grammy";
import type { Context } from "../context";
import { NEW_VOICES_CONVERSATION } from "../conversations/new-voices";
import { isEmpty } from "../helpers/general";
import { logHandle } from "../helpers/logging";

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("cancel", logHandle("command-cancel"), async (ctx) => {
    const activeConversations = ctx.conversation.active();
    if (isEmpty(activeConversations)) return;

    const conversationMode =
        activeConversations[NEW_VOICES_CONVERSATION] > 0 ? "add" : "update";

    await ctx.conversation.exit(NEW_VOICES_CONVERSATION);

    if (conversationMode === "update") {
        return await ctx.reply(ctx.t("conversation.updateCancel"));
    }

    const { addedVoices } = ctx.session;
    if (!addedVoices || addedVoices.length === 0) {
        await ctx.reply(ctx.t("conversation.addCancel"));
    } else {
        await ctx.reply(
            ctx.t("conversation.addResults", {
                voices: addedVoices.join("\n"),
            }),
        );
    }

    ctx.session.addedVoices = null;
});

export { composer as cancelFeature };
