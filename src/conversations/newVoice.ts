import { InputFile } from "@/deps.ts";

import { INPUT_FILENAME, OUTPUT_FILENAME } from "@/src/constants/convert.ts";

import { getAudioFilePath } from "@/src/conversations/subconversations/getAudioFilePath.ts";
import { getVoiceIDText } from "@/src/conversations/subconversations/getVoiceIDText.ts";
import { getVoiceTitleText } from "@/src/conversations/subconversations/getVoiceTitleText.ts";

import { addNewVoice } from "@/src/database/general/voices/addNewVoice.ts";

import { fetchMediaFileBlob } from "@/src/helpers/api.ts";
import { convertMP3ToOGGOpus } from "@/src/helpers/general.ts";

import type { BotContext, ConversationContext } from "@/src/types/bot.ts";

export async function newVoice(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    const audioFilePath = await getAudioFilePath(conversation, ctx);
    if (!audioFilePath) {
        return void await ctx.reply(ctx.t("newvoice.audioPathEmpty"));
    }

    const mp3Blob = await fetchMediaFileBlob(audioFilePath);
    if (!mp3Blob) {
        return void await ctx.reply(ctx.t("newvoice.audioFetchFailed"));
    }

    const fileArrayBuffer = await mp3Blob.arrayBuffer();
    await conversation.external(() =>
        Deno.writeFile(INPUT_FILENAME, new Uint8Array(fileArrayBuffer))
    );

    await ctx.reply(ctx.t("newvoice.idHint"), { parse_mode: "HTML" });

    const fileID = await getVoiceIDText(conversation, ctx);
    if (!fileID) return void await ctx.reply(ctx.t("newvoice.idEmpty"));

    const titleText = await getVoiceTitleText(conversation, ctx);
    if (!titleText) {
        return void ctx.reply(ctx.t("newvoice.titleEmpty"));
    }

    const { status, error } = await conversation.external(() =>
        convertMP3ToOGGOpus(
            INPUT_FILENAME,
            OUTPUT_FILENAME,
        )
    );

    if (!status) {
        await ctx.reply(ctx.t("newvoice.convertFailed", { errorMsg: error }));
        await conversation.external(() => Deno.remove(INPUT_FILENAME));
    }

    const message = await ctx.replyWithVoice(new InputFile(OUTPUT_FILENAME), {
        caption: ctx.t("newvoice.success", {
            title: titleText,
        }),
    });
    const voiceFileID = message.voice.file_id;

    const finishPromises = Promise.all([
        addNewVoice(fileID, titleText, voiceFileID),
        Deno.remove(INPUT_FILENAME),
        Deno.remove(OUTPUT_FILENAME),
    ]);
    await conversation.external(() => finishPromises);
}
