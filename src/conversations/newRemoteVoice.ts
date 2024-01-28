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
    if (!audioRemoteURL) {
        return void await ctx.reply(ctx.t("newremotevoice.URLEmpty"));
    }

    const voiceID = await getVoiceIDText(conversation, ctx);
    if (!voiceID) return void await ctx.reply(ctx.t("newvoice.idEmpty"));

    const voiceTitle = await getVoiceTitleText(conversation, ctx);
    if (!voiceTitle) {
        return void ctx.reply(ctx.t("newvoice.titleEmpty"));
    }

    try {
        await ctx.replyWithVoice(audioRemoteURL, {
            caption: ctx.t("newremotevoice.success", {
                title: voiceTitle,
            }),
            parse_mode: "HTML",
        });
        await conversation.external(() =>
            addNewRemoteVoice(voiceID, voiceTitle, audioRemoteURL)
        );
    } catch (error: unknown) {
        console.error(error);
        await ctx.reply(ctx.t("newremotevoice.failed"));
    }
}
