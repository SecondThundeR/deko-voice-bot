import { getVoiceTitleText } from "@/src/conversations/subconversations/getVoiceTitleText.ts";

import { updateTitle } from "@/src/database/general/voices/updateTitle.ts";

import type { BotContext, ConversationContext } from "@/src/types/bot.ts";

export async function updateVoiceTitle(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    const voiceData = ctx.session.currentVoice;
    if (!voiceData) return;

    const newVoiceTitle = await getVoiceTitleText(
        conversation,
        ctx,
        ctx.t("voicetitle.hint"),
    );
    if (!newVoiceTitle) return void await ctx.reply(ctx.t("voicetitle.empty"));

    const status = await conversation.external(() =>
        updateTitle(voiceData.id, newVoiceTitle)
    );
    if (!status) return await ctx.reply(ctx.t("voicetitle.failed"));

    await ctx.reply(
        ctx.t("voicetitle.success", { voiceTitle: newVoiceTitle }),
        {
            parse_mode: "HTML",
        },
    );
    ctx.session.currentVoice = null;
}