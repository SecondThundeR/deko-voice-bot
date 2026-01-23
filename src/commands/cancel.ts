import { Composer } from "grammy";

import { isEmpty } from "@/src/helpers/general";

import type { BotContext } from "@/src/types/bot";

export const cancelCommand = new Composer<BotContext>();

cancelCommand.command("cancel", async (ctx) => {
    const activeConversations = ctx.conversation.active();
    if (isEmpty(activeConversations)) return;

    const conversationMode =
        activeConversations["new-voices"] > 0 ? "add" : "update";

    await ctx.conversation.exit("new-voices");

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
