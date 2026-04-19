import type { Conversation } from "@grammyjs/conversations";
import type { Context, ConversationContext } from "../../context";

export async function getAudioFilePathSubconversation(
    conversation: Conversation<Context, ConversationContext>,
    ctx: ConversationContext,
) {
    await ctx.reply(ctx.t("newvoices.audioHint"));

    const audioMessage = await conversation.waitFor(":audio");
    const audioFile = await audioMessage.getFile();

    return audioFile.file_path;
}
