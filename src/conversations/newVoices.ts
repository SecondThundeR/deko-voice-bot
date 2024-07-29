import { newVoice } from "@/src/conversations/subconversations/newVoice";

import type { BotContext, ConversationContext } from "@/src/types/bot";

export async function newVoices(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    conversation.session.addedVoices = [];

    do {
        await newVoice(conversation, ctx);
    } while (true);
}
