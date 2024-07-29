import { newRemoteVoice } from "@/src/conversations/subconversations/newRemoteVoice";

import type { BotContext, ConversationContext } from "@/src/types/bot";

export async function newRemoteVoices(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    conversation.session.addedVoices = [];

    do {
        await newRemoteVoice(conversation, ctx);
    } while (true);
}
