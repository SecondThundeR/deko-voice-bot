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

    const fileID = await getVoiceIDText(conversation, ctx);
    if (!fileID) return void await ctx.reply(ctx.t("newvoice.idEmpty"));

    const titleText = await getVoiceTitleText(conversation, ctx);
    if (!titleText) {
        return void ctx.reply(ctx.t("newvoice.titleEmpty"));
    }

    try {
        await ctx.replyWithVoice(audioRemoteURL, {
            caption: ctx.t("newremotevoice.success", {
                title: titleText,
            }),
            parse_mode: "HTML",
        });
        await conversation.external(() =>
            addNewRemoteVoice(fileID, titleText, audioRemoteURL)
        );
    } catch (error: unknown) {
        console.error(error);
        await ctx.reply(ctx.t("newremotevoice.failed"));
    }
}
