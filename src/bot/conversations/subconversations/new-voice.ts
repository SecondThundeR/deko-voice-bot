import { unlink } from "node:fs/promises";
import type { Conversation } from "@grammyjs/conversations";
import { InputFile } from "grammy";
import { addRegularVoice } from "@/drizzle/queries/insert";
import type { Context, ConversationContext } from "../../context";
import { downloadTelegramFileToPath } from "../../helpers/api";
import {
    convertMP3ToOGGOpus,
    createVoiceTempFilePaths,
} from "../../helpers/general";
import { getAudioFilePathSubconversation } from "./get-audio-file-path";
import { getVoiceIDTextSubconversation } from "./get-voice-id-text";
import { getVoiceTitleTextSubconversation } from "./get-voice-title-text";

export async function newVoice(
    conversation: Conversation<Context, ConversationContext>,
    ctx: ConversationContext,
) {
    const audioFilePath = await getAudioFilePathSubconversation(
        conversation,
        ctx,
    );
    if (!audioFilePath) {
        return await ctx.reply(ctx.t("newvoices.audioPathEmpty"));
    }

    await ctx.replyWithChatAction("typing");

    const voiceId = await getVoiceIDTextSubconversation(conversation, ctx);
    const voiceTitle = await getVoiceTitleTextSubconversation(
        conversation,
        ctx,
    );

    await ctx.replyWithChatAction("upload_voice");

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
            return await ctx.reply(ctx.t("newvoices.audioFetchFailed"));
        }

        const { status, error } = await conversation.external(() =>
            convertMP3ToOGGOpus(input, output),
        );
        if (!status) {
            return await ctx.reply(
                ctx.t("newvoices.convertFailed", { errorMsg: error }),
            );
        }

        const {
            voice: { file_id, file_unique_id },
        } = await ctx.replyWithVoice(new InputFile(output), {
            caption: ctx.t("newvoices.success", {
                title: voiceTitle,
            }),
        });

        const insertStatus = await conversation.external(() =>
            addRegularVoice({
                voiceId,
                voiceTitle,
                fileId: file_id,
                fileUniqueId: file_unique_id,
            }),
        );
        if (!insertStatus) {
            return await ctx.reply(
                ctx.t("newvoices.failed", { title: voiceTitle }),
            );
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
        ctx.session.addedVoices?.push(voiceTitle);
    });
}
