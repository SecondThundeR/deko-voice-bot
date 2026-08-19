import type { Conversation } from "@grammyjs/conversations";
import { createConversation } from "@grammyjs/conversations";
import { updateVoiceFile } from "#drizzle/queries/voices.js";
import type { Context, ConversationContext } from "#root/bot/context.js";
import { sendConvertedVoice } from "#root/bot/helpers/conversations.js";
import { escapeHTML } from "#root/bot/helpers/html.js";
import { getAudioFilePathSubconversation } from "./subconversations/get-audio-file-path.ts";

export const UPDATE_VOICE_FILE_CONVERSATION = "voice-file-update";

export function updateVoiceFileConversation() {
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

            const { id, title } = voiceData;
            const audioFilePath = await getAudioFilePathSubconversation(
                conversation,
                ctx,
            );
            if (!audioFilePath) {
                await conversation.external((ctx) => {
                    ctx.session.currentVoice = null;
                });
                return ctx.reply(ctx.t("new-voices-audio-path-empty"));
            }

            await ctx.replyWithChatAction("typing");

            const voiceResult = await sendConvertedVoice({
                caption: ctx.t("new-voices-updated", {
                    title: escapeHTML(title),
                }),
                conversation,
                ctx,
                filePath: audioFilePath,
            });

            if (!voiceResult.status) {
                await conversation.external((ctx) => {
                    ctx.session.currentVoice = null;
                });

                if (voiceResult.type === "download") {
                    return ctx.reply(ctx.t("new-voices-audio-fetch-failed"));
                }

                return ctx.reply(
                    ctx.t("new-voices-conversion-failed", {
                        errorMessage: escapeHTML(voiceResult.error),
                    }),
                );
            }

            const updateStatus = await conversation.external(() =>
                updateVoiceFile(id, {
                    fileId: voiceResult.fileId,
                    fileUniqueId: voiceResult.fileUniqueId,
                }),
            );
            if (!updateStatus) {
                return ctx.reply(
                    ctx.t("new-voices-add-failed", {
                        title: escapeHTML(title),
                    }),
                );
            }

            return conversation.external((ctx) => {
                ctx.session.currentVoice = null;
            });
        },
        UPDATE_VOICE_FILE_CONVERSATION,
    );
}
