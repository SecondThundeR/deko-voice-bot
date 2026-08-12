import { updateVoiceTitle } from "@deko-voice-bot/database/queries/voices.js";
import { type Conversation, createConversation } from "@grammyjs/conversations";
import type { Context, ConversationContext } from "#root/bot/context.js";
import { escapeHTML } from "#root/bot/helpers/html.js";
import { getVoiceTitleTextSubconversation } from "./subconversations/get-voice-title-text.ts";

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
            if (!voiceData) {
                return;
            }

            const newVoiceTitle = await getVoiceTitleTextSubconversation(
                conversation,
                ctx,
                ctx.t("voice-title-hint"),
            );

            await ctx.replyWithChatAction("typing");

            const status = await conversation.external(() =>
                updateVoiceTitle(voiceData.id, newVoiceTitle),
            );
            if (!status) {
                await conversation.external((ctx) => {
                    ctx.session.currentVoice = null;
                });
                return ctx.reply(ctx.t("voice-title-update-failed"));
            }

            await ctx.reply(
                ctx.t("voice-title-updated", {
                    oldVoiceTitle: escapeHTML(voiceData.title),
                    voiceTitle: escapeHTML(newVoiceTitle),
                }),
                {
                    parse_mode: "HTML",
                },
            );

            return conversation.external((ctx) => {
                ctx.session.currentVoice = null;
            });
        },
        UPDATE_VOICE_TITLE_CONVERSATION,
    );
}
