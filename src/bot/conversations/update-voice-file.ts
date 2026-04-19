import { unlink } from "node:fs/promises";
import type { Conversation } from "@grammyjs/conversations";
import { createConversation } from "@grammyjs/conversations";
import { InputFile } from "grammy";
import { updateVoiceFile } from "@/drizzle/queries/update";
import { INPUT_EXTENSION, OUTPUT_EXTENSION } from "../constants/extensions";
import type { Context, ConversationContext } from "../context";
import { fetchMediaFileData } from "../helpers/api";
import { convertMP3ToOGGOpus } from "../helpers/general";
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
            const input = title + INPUT_EXTENSION;
            const output = title + OUTPUT_EXTENSION;
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

            const fileBlob = await fetchMediaFileData({
                filePath: audioFilePath,
                token: ctx.api.token,
                returnType: "blob",
            });
            if (!fileBlob) {
                await conversation.external((ctx) => {
                    ctx.session.currentVoice = null;
                });
                await ctx.reply(ctx.t("newvoices.audioFetchFailed"));
                return;
            }

            const arrayBuffer = await fileBlob.arrayBuffer();
            await conversation.external(() =>
                Bun.write(input, new Uint8Array(arrayBuffer)),
            );

            const { status, error } = await conversation.external(() =>
                convertMP3ToOGGOpus(input, output),
            );
            if (!status) {
                await conversation.external((ctx) => {
                    ctx.session.currentVoice = null;
                });
                await conversation.external(() => unlink(input));
                await ctx.reply(
                    ctx.t("newvoices.convertFailed", { errorMsg: error }),
                );
            }

            const {
                voice: { file_id, file_unique_id },
            } = await ctx.replyWithVoice(new InputFile(output), {
                caption: ctx.t("newvoices.updated", { title: title }),
            });

            await conversation.external(() =>
                Promise.all([
                    updateVoiceFile(id, {
                        fileId: file_id,
                        fileUniqueId: file_unique_id,
                    }),
                    unlink(input),
                    unlink(output),
                ]),
            );

            await conversation.external((ctx) => {
                ctx.session.currentVoice = null;
            });
        },
        UPDATE_VOICE_FILE_CONVERSATION,
    );
}
