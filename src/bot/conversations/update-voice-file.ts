import type { Conversation } from "@grammyjs/conversations";
import { createConversation } from "@grammyjs/conversations";
import { updateVoiceFile } from "@/drizzle/queries/update";
import type { Context, ConversationContext } from "../context";
import { sendConvertedVoice } from "../helpers/conversations";
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
            if (!voiceData) return;

            const { id, title } = voiceData;
            const audioFilePath = await getAudioFilePathSubconversation(
                conversation,
                ctx,
            );
            if (!audioFilePath) {
                await conversation.external((ctx) => {
                    ctx.session.currentVoice = null;
                });
                await ctx.reply(ctx.t("newvoices.audioPathEmpty"));
                return;
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
                    await ctx.reply(ctx.t("newvoices.audioFetchFailed"));
                    return;
                }

                await ctx.reply(
                    ctx.t("newvoices.convertFailed", {
                        errorMsg: voiceResult.error,
                    }),
                );
                return;
            }

            const updateStatus = await conversation.external(() =>
                updateVoiceFile(id, {
                    fileId: voiceResult.fileId,
                    fileUniqueId: voiceResult.fileUniqueId,
                }),
            );
            if (!updateStatus) {
                await ctx.reply(ctx.t("newvoices.failed", { title }));
                return;
            }

            await conversation.external((ctx) => {
                ctx.session.currentVoice = null;
            });
        },
        UPDATE_VOICE_FILE_CONVERSATION,
    );
}
