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

    await ctx.replyWithChatAction("typing");

    const mp3Blob = await fetchMediaFileBlob(audioFilePath);
    if (!mp3Blob) {
        return void await ctx.reply(ctx.t("newvoice.audioFetchFailed"));
    }

    const fileArrayBuffer = await mp3Blob.arrayBuffer();
    await conversation.external(() =>
        Deno.writeFile(INPUT_FILENAME, new Uint8Array(fileArrayBuffer))
    );

    const voiceID = await getVoiceIDText(conversation, ctx);
    if (!voiceID) return void await ctx.reply(ctx.t("newvoice.idEmpty"));

    const voiceTitle = await getVoiceTitleText(conversation, ctx);
    if (!voiceTitle) {
        return void ctx.reply(ctx.t("newvoice.titleEmpty"));
    }

    await ctx.replyWithChatAction("typing");

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

    const { voice: { file_id, file_unique_id } } = await ctx.replyWithVoice(
        new InputFile(OUTPUT_FILENAME),
        {
            caption: ctx.t("newvoice.success", {
                title: voiceTitle,
            }),
        },
    );

    const finishPromises = Promise.all([
        addNewVoice(voiceID, voiceTitle, file_id, file_unique_id),
        Deno.remove(INPUT_FILENAME),
        Deno.remove(OUTPUT_FILENAME),
    ]);
    await conversation.external(() => finishPromises);
}
