import { type Conversation, createConversation } from "@grammyjs/conversations";
import { updateVoiceTitle } from "#drizzle/queries/voices.js";
import type { Context, ConversationContext } from "#root/bot/context.js";
import { escapeHTML } from "#root/bot/helpers/html.js";
import { voicesSubmenu } from "#root/bot/menu/voices.js";
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

            await conversation.external((ctx) => {
                ctx.session.currentVoice = {
                    ...voiceData,
                    title: newVoiceTitle,
                };
            });
            return ctx.reply(
                ctx.t("voice-title-updated", {
                    oldVoiceTitle: escapeHTML(voiceData.title),
                    voiceTitle: escapeHTML(newVoiceTitle),
                }),
                {
                    parse_mode: "HTML",
                    reply_markup: voicesSubmenu,
                },
            );
        },
        UPDATE_VOICE_TITLE_CONVERSATION,
    );
}
