import { getAudioRemoteURL } from "@/src/conversations/subconversations/getAudioRemoteURL.ts";
import { getVoiceIDText } from "@/src/conversations/subconversations/getVoiceIDText.ts";
import { getVoiceTitleText } from "@/src/conversations/subconversations/getVoiceTitleText.ts";

import { addNewRemoteVoice } from "@/src/database/general/voices/addNewRemoteVoice.ts";

import type { BotContext, ConversationContext } from "@/src/types/bot.ts";

export async function newRemoteVoice(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    const audioRemoteURL = await getAudioRemoteURL(conversation, ctx);
    const voiceID = await getVoiceIDText(conversation, ctx);
    const voiceTitle = await getVoiceTitleText(conversation, ctx);

    await ctx.replyWithChatAction("upload_voice");

    try {
        const { voice: { file_unique_id } } = await ctx.replyWithVoice(
            audioRemoteURL,
            {
                caption: ctx.t("newremotevoices.success", {
                    title: voiceTitle,
                }),
                parse_mode: "HTML",
            },
        );

        await conversation.external(() =>
            addNewRemoteVoice(
                voiceID,
                voiceTitle,
                audioRemoteURL,
                file_unique_id,
            )
        );

        if (conversation.session.addedVoices) {
            conversation.session.addedVoices.push(voiceTitle);
        }
    } catch (error: unknown) {
        conversation.error(error);

        await ctx.reply(ctx.t("newremotevoices.failed"));
    }
}
