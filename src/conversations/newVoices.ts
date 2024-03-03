import { newVoice } from "@/src/conversations/subconversations/newVoice.ts";

import type { BotContext, ConversationContext } from "@/src/types/bot.ts";

export async function newVoices(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    conversation.session.addedVoices = [];

    do {
        await newVoice(conversation, ctx);
    } while (true);
}
