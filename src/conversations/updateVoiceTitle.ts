import { updateVoiceTitle as updateTitle } from "@/drizzle/queries/update";

import { getVoiceTitleText } from "@/src/conversations/subconversations/getVoiceTitleText";

import type { BotContext, ConversationContext } from "@/src/types/bot";

export async function updateVoiceTitle(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    const voiceData = await conversation.external(
        (ctx) => ctx.session.currentVoice,
    );
    if (!voiceData) return;

    const newVoiceTitle = await getVoiceTitleText(
        conversation,
        ctx,
        ctx.t("voicetitle.hint"),
    );

    await ctx.replyWithChatAction("typing");

    const status = await conversation.external(() =>
        updateTitle(voiceData.id, newVoiceTitle),
    );
    if (!status) {
        await conversation.external((ctx) => {
            ctx.session.currentVoice = null;
        });
        await ctx.reply(ctx.t("voicetitle.failed"));
        return;
    }

    await ctx.reply(
        ctx.t("voicetitle.success", { voiceTitle: newVoiceTitle }),
        { parse_mode: "HTML" },
    );

    await conversation.external((ctx) => {
        ctx.session.currentVoice = null;
    });
}
