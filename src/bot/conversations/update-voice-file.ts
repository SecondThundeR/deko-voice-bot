import type { Conversation } from "@grammyjs/conversations";
import { createConversation } from "@grammyjs/conversations";
import { updateVoiceFile } from "drizzle/queries/update";
import type { Context, ConversationContext } from "@/bot/context";
import { sendConvertedVoice } from "@/bot/helpers/conversations";
import { getAudioFilePathSubconversation } from "./subconversations/get-audio-file-path";

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
                return ctx.reply(ctx.t("newvoices.audioPathEmpty"));
            }

            await ctx.replyWithChatAction("typing");

            const voiceResult = await sendConvertedVoice({
                caption: ctx.t("newvoices.updated", { title }),
                conversation,
                ctx,
                filePath: audioFilePath,
            });

            if (!voiceResult.status) {
                await conversation.external((ctx) => {
                    ctx.session.currentVoice = null;
                });

                if (voiceResult.type === "download") {
                    return ctx.reply(ctx.t("newvoices.audioFetchFailed"));
                }

                return ctx.reply(
                    ctx.t("newvoices.convertFailed", {
                        errorMsg: voiceResult.error,
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
                return ctx.reply(ctx.t("newvoices.failed", { title }));
            }

            return conversation.external((ctx) => {
                ctx.session.currentVoice = null;
            });
        },
        UPDATE_VOICE_FILE_CONVERSATION,
    );
}
