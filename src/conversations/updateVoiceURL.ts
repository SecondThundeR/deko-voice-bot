import { updateVoiceURL as replaceVoiceURL } from "@/drizzle/queries/update";

import { getAudioRemoteURL } from "@/src/conversations/subconversations/getAudioRemoteURL";

import { convertVoiceUrl } from "@/src/helpers/general";

import type { BotContext, ConversationContext } from "@/src/types/bot";

export async function updateVoiceURL(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    const voiceData = ctx.session.currentVoice;
    if (!voiceData) return;

    const { id, title } = voiceData;
    const audioRemoteURL = await getAudioRemoteURL(conversation, ctx);
    const convertedRemoteURL = convertVoiceUrl(audioRemoteURL);

    try {
        const {
            voice: { file_unique_id },
        } = await ctx.replyWithVoice(convertedRemoteURL, {
            caption: ctx.t("newremotevoices.updated", {
                title: title,
            }),
            parse_mode: "HTML",
        });

        await conversation.external(() =>
            replaceVoiceURL(id, {
                url: convertedRemoteURL,
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
