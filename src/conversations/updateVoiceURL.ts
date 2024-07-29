import { getAudioRemoteURL } from "@/src/conversations/subconversations/getAudioRemoteURL";

import { updateRemoteVoiceURL } from "@/src/database/general/voices/updateRemoteVoiceURL";

import type { BotContext, ConversationContext } from "@/src/types/bot";

export async function updateVoiceURL(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    const voiceData = ctx.session.currentVoice;
    if (!voiceData) return;

    const { id, title } = voiceData;
    const newRemoteVoiceURL = await getAudioRemoteURL(conversation, ctx);

    await ctx.replyWithChatAction("typing");

    try {
        const {
            voice: { file_unique_id },
        } = await ctx.replyWithVoice(newRemoteVoiceURL, {
            caption: ctx.t("newremotevoices.updated", {
                title: title,
            }),
            parse_mode: "HTML",
        });

        await conversation.external(() =>
            updateRemoteVoiceURL(id, newRemoteVoiceURL, file_unique_id),
        );
    } catch (error: unknown) {
        console.error(error);

        await ctx.reply(ctx.t("newremotevoices.failed"));
    } finally {
        ctx.session.currentVoice = null;
    }
}
