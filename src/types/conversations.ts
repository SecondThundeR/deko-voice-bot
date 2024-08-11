import type { BotContext, ConversationContext } from "./bot";

export type ConversationsData = [
    string,
    (conversation: ConversationContext, ctx: BotContext) => Promise<void>,
];
