import type { Conversation } from "@grammyjs/conversations";
import { createConversation } from "@grammyjs/conversations";
import { addVoice } from "#drizzle/queries/voices.js";
import type { Context, ConversationContext } from "#root/bot/context.js";
import { sendConvertedVoice } from "#root/bot/helpers/conversations.js";
import { escapeHTML } from "#root/bot/helpers/html.js";
import { getAudioFilePathSubconversation } from "./subconversations/get-audio-file-path.ts";
import { getVoiceIDTextSubconversation } from "./subconversations/get-voice-id-text.ts";
import { getVoiceTitleTextSubconversation } from "./subconversations/get-voice-title-text.ts";

export const NEW_VOICES_CONVERSATION = "new-voices";

export function newVoicesConversation() {
    return createConversation(
        async (
            conversation: Conversation<Context, ConversationContext>,
            ctx: ConversationContext,
        ) => {
            await conversation.external((ctx) => {
                ctx.session.addedVoices = [];
            });

            // Intentionally infinite; This is done to be able to add voices without
            // typing /newvoice after each addition. This is cancellable via /cancel command
            while (true) {
                const audioFilePath = await getAudioFilePathSubconversation(
                    conversation,
                    ctx,
                );
                if (!audioFilePath) {
                    await ctx.reply(ctx.t("new-voices-audio-path-empty"));
                    continue;
                }

                await ctx.replyWithChatAction("typing");

                const voiceId = await getVoiceIDTextSubconversation(
                    conversation,
                    ctx,
                );
                const voiceTitle = await getVoiceTitleTextSubconversation(
                    conversation,
                    ctx,
                );

                await ctx.replyWithChatAction("upload_voice");

                const voiceResult = await sendConvertedVoice({
                    caption: ctx.t("new-voices-added", {
                        title: escapeHTML(voiceTitle),
                    }),
                    conversation,
                    ctx,
                    filePath: audioFilePath,
                });

                if (!voiceResult.status) {
                    if (voiceResult.type === "download") {
                        await ctx.reply(ctx.t("new-voices-audio-fetch-failed"));
                        continue;
                    }

                    await ctx.reply(
                        ctx.t("new-voices-conversion-failed", {
                            errorMessage: escapeHTML(voiceResult.error),
                        }),
                    );
                    continue;
                }

                const insertStatus = await conversation.external(() =>
                    addVoice({
                        voiceId,
                        voiceTitle,
                        fileId: voiceResult.fileId,
                        fileUniqueId: voiceResult.fileUniqueId,
                    }),
                );
                if (!insertStatus) {
                    await ctx.reply(
                        ctx.t("new-voices-add-failed", {
                            title: escapeHTML(voiceTitle),
                        }),
                    );
                    continue;
                }

                await conversation.external((ctx) => {
                    ctx.session.addedVoices?.push(voiceTitle);
                });
            }
        },
        NEW_VOICES_CONVERSATION,
    );
}
