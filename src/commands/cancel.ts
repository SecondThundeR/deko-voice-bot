import { Composer } from "@/deps.ts";

import { invalidateVoiceCaches } from "@/src/helpers/cache.ts";

import type { BotContext } from "@/src/types/bot.ts";
import { isEmpty } from "@/src/helpers/general.ts";

export const cancelCommand = new Composer<BotContext>();

cancelCommand.command("cancel", async (ctx) => {
    const activeConversations = await ctx.conversation.active();

    if (isEmpty(activeConversations)) return;

    const conversationMode = (activeConversations["new-voices"] ||
            activeConversations["new-remote-voices"])
        ? "add"
        : "update";

    await ctx.conversation.exit();

    if (conversationMode === "update") {
        return void await ctx.reply(ctx.t("conversation.updateCancel"));
    }

    const { addedVoices } = ctx.session;
    if (!addedVoices || addedVoices.length === 0) {
        await ctx.reply(ctx.t("conversation.addCancel"));
    } else {
        const voices = addedVoices.join("\n");

        invalidateVoiceCaches();
        await ctx.reply(ctx.t("conversation.addResults", {
            voices,
        }));
    }

    ctx.session.addedVoices = null;
});
