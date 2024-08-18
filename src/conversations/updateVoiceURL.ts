import { updateVoiceURL as replaceVoiceURL } from "@/drizzle/queries/update";

import { getAudioRemoteURL } from "@/src/conversations/subconversations/getAudioRemoteURL";

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
            replaceVoiceURL(id, {
                url: newRemoteVoiceURL,
                fileUniqueId: file_unique_id,
            }),
        );
    } catch (error: unknown) {
        console.error(error);

        await ctx.reply(ctx.t("newremotevoices.failed"));
    } finally {
        ctx.session.currentVoice = null;
    }
}
