import { newVoice } from "@/src/conversations/subconversations/newVoice";

import type { BotContext, ConversationContext } from "@/src/types/bot";

export async function newVoices(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    await conversation.external((ctx) => {
        ctx.session.addedVoices = [];
    });

    // Intentionally infinite; This is done to be able to add voices without
    // typing /newvoice after each addition. This is cancellable via /cancel command
    // noinspection InfiniteLoopJS
    do {
        await newVoice(conversation, ctx);
    } while (true);
}
