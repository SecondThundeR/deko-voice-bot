import { updateVoiceId } from "@deko-voice-bot/database/queries/voices.js";
import type { Conversation } from "@grammyjs/conversations";
import { createConversation } from "@grammyjs/conversations";
import type { Context, ConversationContext } from "#root/bot/context.js";
import { escapeHTML } from "#root/bot/helpers/html.js";
import { getVoiceIDTextSubconversation } from "./subconversations/get-voice-id-text.ts";

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
            if (!voiceData) {
                return;
            }

            const newVoiceID = await getVoiceIDTextSubconversation(
                conversation,
                ctx,
                {
                    hint: ctx.t("voice-id-hint"),
                    notUnique: ctx.t("voice-id-not-unique"),
                    long: ctx.t("voice-id-too-long"),
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
                return ctx.reply(ctx.t("voice-id-update-failed"));
            }

            await ctx.reply(
                ctx.t("voice-id-updated", {
                    voiceTitle: escapeHTML(voiceData.title),
                    oldVoiceId: escapeHTML(voiceData.id),
                    voiceId: escapeHTML(newVoiceID),
                }),
                {
                    parse_mode: "HTML",
                },
            );

            return conversation.external((ctx) => {
                ctx.session.currentVoice = null;
            });
        },
        UPDATE_VOICE_ID_CONVERSATION,
    );
}
