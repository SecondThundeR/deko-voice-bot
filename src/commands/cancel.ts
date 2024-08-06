import { Composer } from "grammy";

import { invalidateVoiceCaches } from "@/src/helpers/cache";
import { isEmpty } from "@/src/helpers/general";

import type { BotContext } from "@/src/types/bot";

export const cancelCommand = new Composer<BotContext>();

cancelCommand.command("cancel", async (ctx) => {
    const activeConversations = await ctx.conversation.active();

    if (isEmpty(activeConversations)) return;

    const conversationMode =
        activeConversations["new-voices"] ||
        activeConversations["new-remote-voices"]
            ? "add"
            : "update";

    await ctx.conversation.exit();

    if (conversationMode === "update") {
        await ctx.reply(ctx.t("conversation.updateCancel"));
        return;
    }

    const { addedVoices } = ctx.session;
    if (!addedVoices || addedVoices.length === 0) {
        await ctx.reply(ctx.t("conversation.addCancel"));
    } else {
        const voices = addedVoices.join("\n");

        invalidateVoiceCaches();
        await ctx.reply(
            ctx.t("conversation.addResults", {
                voices,
            }),
        );
    }

    ctx.session.addedVoices = null;
});
