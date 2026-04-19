import { type Conversation, createConversation } from "@grammyjs/conversations";
import { updateVoiceTitle } from "@/drizzle/queries/update";
import type { Context, ConversationContext } from "../context";
import { getVoiceTitleTextSubconversation } from "./subconversations/get-voice-title-text";

export const UPDATE_VOICE_TITLE_CONVERSATION = "voice-title-update";

export function updateVoiceTitleConversation() {
    return createConversation(
        async (
            conversation: Conversation<Context, ConversationContext>,
            ctx: ConversationContext,
        ) => {
            const voiceData = await conversation.external(
                (ctx) => ctx.session.currentVoice,
            );
            if (!voiceData) return;

            const newVoiceTitle = await getVoiceTitleTextSubconversation(
                conversation,
                ctx,
                ctx.t("voicetitle.hint"),
            );

            await ctx.replyWithChatAction("typing");

            const status = await conversation.external(() =>
                updateVoiceTitle(voiceData.id, newVoiceTitle),
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
                {
                    parse_mode: "HTML",
                },
            );

            await conversation.external((ctx) => {
                ctx.session.currentVoice = null;
            });
        },
        UPDATE_VOICE_TITLE_CONVERSATION,
    );
}
