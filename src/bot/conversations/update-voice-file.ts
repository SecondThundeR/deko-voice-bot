import { unlink } from "node:fs/promises";
import type { Conversation } from "@grammyjs/conversations";
import { createConversation } from "@grammyjs/conversations";
import { InputFile } from "grammy";
import { updateVoiceFile } from "@/drizzle/queries/update";
import type { Context, ConversationContext } from "../context";
import { downloadTelegramFileToPath } from "../helpers/api";
import {
    convertMP3ToOGGOpus,
    createVoiceTempFilePaths,
} from "../helpers/general";
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

            const { input, output } = createVoiceTempFilePaths();

            try {
                const downloadStatus = await conversation.external(() =>
                    downloadTelegramFileToPath({
                        filePath: audioFilePath,
                        outputPath: input,
                        token: ctx.api.token,
                    }),
                );
                if (!downloadStatus) {
                    await conversation.external((ctx) => {
                        ctx.session.currentVoice = null;
                    });
                    await ctx.reply(ctx.t("newvoices.audioFetchFailed"));
                    return;
                }

                const { status, error } = await conversation.external(() =>
                    convertMP3ToOGGOpus(input, output),
                );
                if (!status) {
                    await conversation.external((ctx) => {
                        ctx.session.currentVoice = null;
                    });
                    await ctx.reply(
                        ctx.t("newvoices.convertFailed", { errorMsg: error }),
                    );
                    return;
                }

                const {
                    voice: { file_id, file_unique_id },
                } = await ctx.replyWithVoice(new InputFile(output), {
                    caption: ctx.t("newvoices.updated", { title: title }),
                });

                const updateStatus = await conversation.external(() =>
                    updateVoiceFile(id, {
                        fileId: file_id,
                        fileUniqueId: file_unique_id,
                    }),
                );
                if (!updateStatus) {
                    await ctx.reply(ctx.t("newvoices.failed", { title }));
                    return;
                }
            } finally {
                await conversation.external(() =>
                    Promise.all([
                        unlink(input).catch(() => undefined),
                        unlink(output).catch(() => undefined),
                    ]),
                );
            }

            await conversation.external((ctx) => {
                ctx.session.currentVoice = null;
            });
        },
        UPDATE_VOICE_FILE_CONVERSATION,
    );
}
