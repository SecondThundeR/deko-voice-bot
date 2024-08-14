import { addRemoteVoice } from "@/drizzle/queries/insert";

import { getAudioRemoteURL } from "@/src/conversations/subconversations/getAudioRemoteURL";
import { getVoiceIDText } from "@/src/conversations/subconversations/getVoiceIDText";
import { getVoiceTitleText } from "@/src/conversations/subconversations/getVoiceTitleText";

import type { BotContext, ConversationContext } from "@/src/types/bot";

export async function newRemoteVoice(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    const audioRemoteURL = await getAudioRemoteURL(conversation, ctx);
    const voiceId = await getVoiceIDText(conversation, ctx);
    const voiceTitle = await getVoiceTitleText(conversation, ctx);

    await ctx.replyWithChatAction("upload_voice");

    try {
        const {
            voice: { file_unique_id },
        } = await ctx.replyWithVoice(audioRemoteURL, {
            caption: ctx.t("newremotevoices.success", {
                title: voiceTitle,
            }),
            parse_mode: "HTML",
        });

        await conversation.external(() =>
            addRemoteVoice({
                voiceId,
                voiceTitle,
                fileUniqueId: file_unique_id,
                url: audioRemoteURL,
            }),
        );

        if (conversation.session.addedVoices) {
            conversation.session.addedVoices.push(voiceTitle);
        }
    } catch (error: unknown) {
        conversation.error(error);

        await ctx.reply(ctx.t("newremotevoices.failed"));
    }
}
