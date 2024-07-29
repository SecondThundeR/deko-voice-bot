import type { BotContext, ConversationContext } from "@/src/types/bot";

export async function getAudioFilePath(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    await ctx.reply(ctx.t("newvoices.audioHint"));

    const audioMessage = await conversation.waitFor(":audio");
    const audioFile = await audioMessage.getFile();

    return audioFile.file_path;
}
