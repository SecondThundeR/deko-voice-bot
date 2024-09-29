import { replaceVoiceFile as replaceVoice } from "@/drizzle/queries/update";

import { getAudioRemoteURL } from "@/src/conversations/subconversations/getAudioRemoteURL";

import type { BotContext, ConversationContext } from "@/src/types/bot";
import { convertVoiceUrl } from "../helpers/general";

export async function replaceVoiceFile(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    const voiceData = ctx.session.currentVoice;
    if (!voiceData) return;

    const { id, title } = voiceData;
    const audioRemoteURL = await getAudioRemoteURL(conversation, ctx);
    const convertedRemoteURL = convertVoiceUrl(audioRemoteURL);

    await ctx.replyWithChatAction("upload_voice");

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
            replaceVoice(id, {
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