import { getVoiceIDText } from "@/src/conversations/subconversations/getVoiceIDText.ts";

import { updateID } from "@/src/database/general/voices/updateID.ts";

import type { BotContext, ConversationContext } from "@/src/types/bot.ts";

export async function updateVoiceID(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    const voiceData = ctx.session.currentVoice;
    if (!voiceData) return;

    const newVoiceID = await getVoiceIDText(conversation, ctx, {
        hint: ctx.t("voiceid.hint"),
        notUnique: ctx.t("voiceid.notUnique"),
        long: ctx.t("voiceid.long"),
    });
    if (!newVoiceID) {
        ctx.session.currentVoice = null;
        return void await ctx.reply(ctx.t("voiceid.idEmpty"));
    }

    await ctx.replyWithChatAction("typing");

    const status = await conversation.external(() =>
        updateID(voiceData.id, newVoiceID)
    );
    if (!status) {
        ctx.session.currentVoice = null;
        return void await ctx.reply(ctx.t("voiceid.failed"));
    }

    await ctx.reply(ctx.t("voiceid.success", { voiceID: newVoiceID }), {
        parse_mode: "HTML",
    });
    ctx.session.currentVoice = null;
}
