import { newVoice } from "@/src/conversations/subconversations/newVoice";

import type { BotContext, ConversationContext } from "@/src/types/bot";

export async function newVoices(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    await conversation.external((ctx) => {
        ctx.session.addedVoices = [];
    });

    do {
        await newVoice(conversation, ctx);
    } while (true);
}
