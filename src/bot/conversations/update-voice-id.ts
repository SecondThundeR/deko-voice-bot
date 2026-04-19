import type { Conversation } from "@grammyjs/conversations";
import { createConversation } from "@grammyjs/conversations";
import { updateVoiceId } from "@/drizzle/queries/update";
import type { Context, ConversationContext } from "../context";
import { getVoiceIDTextSubconversation } from "./subconversations/get-voice-id-text";

export const UPDATE_VOICE_ID_CONVERSATION = "voice-id-update";

export function updateVoiceIDConversation() {
    return createConversation(
        async (
            conversation: Conversation<Context, ConversationContext>,
            ctx: ConversationContext,
        ) => {
            const voiceData = await conversation.external(
                (ctx) => ctx.session.currentVoice,
            );
            if (!voiceData) return;

            const newVoiceID = await getVoiceIDTextSubconversation(
                conversation,
                ctx,
                {
                    hint: ctx.t("voiceid.hint"),
                    notUnique: ctx.t("voiceid.notUnique"),
                    long: ctx.t("voiceid.long"),
                },
            );

            await ctx.replyWithChatAction("typing");

            const status = await conversation.external(() =>
                updateVoiceId(voiceData.id, newVoiceID),
            );
            if (!status) {
                await conversation.external((ctx) => {
                    ctx.session.currentVoice = null;
                });
                await ctx.reply(ctx.t("voiceid.failed"));
                return;
            }

            await ctx.reply(ctx.t("voiceid.success", { voiceID: newVoiceID }), {
                parse_mode: "HTML",
            });

            await conversation.external((ctx) => {
                ctx.session.currentVoice = null;
            });
        },
        UPDATE_VOICE_ID_CONVERSATION,
    );
}
