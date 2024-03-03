import { InputFile } from "@/deps.ts";

import {
    INPUT_EXTENSION,
    OUTPUT_EXTENSION,
} from "@/src/constants/extensions.ts";

import { getAudioFilePath } from "@/src/conversations/subconversations/getAudioFilePath.ts";
import { getVoiceIDText } from "@/src/conversations/subconversations/getVoiceIDText.ts";
import { getVoiceTitleText } from "@/src/conversations/subconversations/getVoiceTitleText.ts";

import { addNewVoice } from "@/src/database/general/voices/addNewVoice.ts";

import { fetchMediaFileBlob } from "@/src/helpers/api.ts";
import { convertMP3ToOGGOpus } from "@/src/helpers/general.ts";

import type { BotContext, ConversationContext } from "@/src/types/bot.ts";

export async function newVoices(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    conversation.session.addedVoices = [];

    while (true) {
        const audioFilePath = await getAudioFilePath(conversation, ctx);
        if (!audioFilePath) {
            await ctx.reply(ctx.t("newvoices.audioPathEmpty"));
            continue;
        }

        await ctx.replyWithChatAction("typing");

        const mp3Blob = await fetchMediaFileBlob(audioFilePath);
        if (!mp3Blob) {
            await ctx.reply(ctx.t("newvoices.audioFetchFailed"));
            continue;
        }

        const voiceID = await getVoiceIDText(conversation, ctx);
        if (!voiceID) {
            await ctx.reply(ctx.t("newvoices.idEmpty"));
            continue;
        }

        const voiceTitle = await getVoiceTitleText(conversation, ctx);
        if (!voiceTitle) {
            await ctx.reply(ctx.t("newvoices.titleEmpty"));
            continue;
        }

        await ctx.replyWithChatAction("upload_voice");

        const { input, output } = await conversation.external(() => ({
            input: voiceTitle + INPUT_EXTENSION,
            output: voiceTitle + OUTPUT_EXTENSION,
        }));

        const fileArrayBuffer = await mp3Blob.arrayBuffer();
        await conversation.external(() =>
            Deno.writeFile(input, new Uint8Array(fileArrayBuffer))
        );

        const { status, error } = await conversation.external(() =>
            convertMP3ToOGGOpus(input, output)
        );

        if (!status) {
            await ctx.reply(
                ctx.t("newvoices.convertFailed", { errorMsg: error }),
            );
            continue;
        }

        const { voice: { file_id, file_unique_id } } = await ctx.replyWithVoice(
            new InputFile(output),
            {
                caption: ctx.t("newvoices.success", {
                    title: voiceTitle,
                }),
            },
        );

        await conversation.external(() =>
            Promise.all([
                addNewVoice(voiceID, voiceTitle, file_id, file_unique_id),
                Deno.remove(input),
                Deno.remove(output),
            ])
        );

        conversation.session.addedVoices.push(voiceTitle);
    }
}
