import { Composer } from "grammy";

import { invalidateVoiceCaches } from "@/src/helpers/cache";
import { isEmpty } from "@/src/helpers/general";

import type { BotContext } from "@/src/types/bot";

export const cancelCommand = new Composer<BotContext>();

cancelCommand.command("cancel", async (ctx) => {
    const activeConversations = await ctx.conversation.active();
    if (isEmpty(activeConversations)) return;

    const voicesActiveConversations =
        activeConversations["new-voices"] ||
        activeConversations["new-remote-voices"];
    const conversationMode = voicesActiveConversations ? "add" : "update";

    await ctx.conversation.exit();

    if (conversationMode === "update") {
        await ctx.reply(ctx.t("conversation.updateCancel"));
        return;
    }

    const { addedVoices } = ctx.session;
    if (!addedVoices || addedVoices.length === 0) {
        await ctx.reply(ctx.t("conversation.addCancel"));
    } else {
        invalidateVoiceCaches();
        await ctx.reply(
            ctx.t("conversation.addResults", {
                voices: addedVoices.join("\n"),
            }),
        );
    }

    ctx.session.addedVoices = null;
});
