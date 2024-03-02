import { updateRemoteVoiceURL } from "@/src/database/general/voices/updateRemoteVoiceURL.ts";

import type { BotContext, ConversationContext } from "@/src/types/bot.ts";
import { getAudioRemoteURL } from "@/src/conversations/subconversations/getAudioRemoteURL.ts";

export async function updateVoiceURL(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    const voiceData = ctx.session.currentVoice;
    if (!voiceData) return;

    const { id, title, voice_url } = voiceData;
    await ctx.reply(ctx.t("newremotevoice.currentFileURL", {
        fileUrl: voice_url!,
    }));

    const newRemoteVoiceURL = await getAudioRemoteURL(conversation, ctx);
    if (!newRemoteVoiceURL) {
        ctx.session.currentVoice = null;
        return void await ctx.reply(ctx.t("newremotevoice.URLEmpty"));
    }

    await ctx.replyWithChatAction("typing");

    try {
        const { voice: { file_unique_id } } = await ctx.replyWithVoice(
            newRemoteVoiceURL,
            {
                caption: ctx.t("newremotevoice.updated", {
                    title: title,
                }),
                parse_mode: "HTML",
            },
        );
        await conversation.external(() =>
            updateRemoteVoiceURL(id, newRemoteVoiceURL, file_unique_id)
        );
    } catch (error: unknown) {
        console.error(error);
        await ctx.reply(ctx.t("newremotevoice.failed"));
    } finally {
        ctx.session.currentVoice = null;
    }
}
