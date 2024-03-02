import { InputFile } from "@/deps.ts";

import { INPUT_FILENAME, OUTPUT_FILENAME } from "@/src/constants/convert.ts";

import { getAudioFilePath } from "@/src/conversations/subconversations/getAudioFilePath.ts";

import { fetchMediaFileBlob } from "@/src/helpers/api.ts";
import { convertMP3ToOGGOpus } from "@/src/helpers/general.ts";

import type { BotContext, ConversationContext } from "@/src/types/bot.ts";
import { updateVoiceFileID } from "@/src/database/general/voices/updateVoiceFileID.ts";

export async function updateVoiceFile(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    const voiceData = ctx.session.currentVoice;
    if (!voiceData) return;

    const { id, title } = voiceData;
    const audioFilePath = await getAudioFilePath(conversation, ctx);
    if (!audioFilePath) {
        ctx.session.currentVoice = null;
        return void await ctx.reply(ctx.t("newvoice.audioPathEmpty"));
    }

    await ctx.replyWithChatAction("typing");

    const mp3Blob = await fetchMediaFileBlob(audioFilePath);
    if (!mp3Blob) {
        ctx.session.currentVoice = null;
        return void await ctx.reply(ctx.t("newvoice.audioFetchFailed"));
    }

    const fileArrayBuffer = await mp3Blob.arrayBuffer();
    await conversation.external(() =>
        Deno.writeFile(INPUT_FILENAME, new Uint8Array(fileArrayBuffer))
    );

    const { status, error } = await conversation.external(() =>
        convertMP3ToOGGOpus(
            INPUT_FILENAME,
            OUTPUT_FILENAME,
        )
    );

    if (!status) {
        ctx.session.currentVoice = null;
        await ctx.reply(ctx.t("newvoice.convertFailed", { errorMsg: error }));
        await conversation.external(() => Deno.remove(INPUT_FILENAME));
    }

    const { voice: { file_id, file_unique_id } } = await ctx.replyWithVoice(
        new InputFile(OUTPUT_FILENAME),
        {
            caption: ctx.t("newvoice.updated", {
                title: title,
            }),
        },
    );

    const finishPromises = Promise.all([
        updateVoiceFileID(id, file_id, file_unique_id),
        Deno.remove(INPUT_FILENAME),
        Deno.remove(OUTPUT_FILENAME),
    ]);
    await conversation.external(() => finishPromises);
    ctx.session.currentVoice = null;
}
