import { InputFile } from "@/deps.ts";

import {
    INPUT_EXTENSION,
    OUTPUT_EXTENSION,
} from "@/src/constants/extensions.ts";

import { getAudioFilePath } from "@/src/conversations/subconversations/getAudioFilePath.ts";

import { updateVoiceFileID } from "@/src/database/general/voices/updateVoiceFileID.ts";

import { fetchMediaFileBlob } from "@/src/helpers/api.ts";
import { convertMP3ToOGGOpus } from "@/src/helpers/general.ts";

import type { BotContext, ConversationContext } from "@/src/types/bot.ts";

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
        return void await ctx.reply(ctx.t("newvoices.audioPathEmpty"));
    }

    await ctx.replyWithChatAction("typing");

    const mp3Blob = await fetchMediaFileBlob(audioFilePath);
    if (!mp3Blob) {
        ctx.session.currentVoice = null;
        return void await ctx.reply(ctx.t("newvoices.audioFetchFailed"));
    }

    const { input, output } = await conversation.external(() => ({
        input: title + INPUT_EXTENSION,
        output: title + OUTPUT_EXTENSION,
    }));

    const fileArrayBuffer = await mp3Blob.arrayBuffer();
    await conversation.external(() =>
        Deno.writeFile(input, new Uint8Array(fileArrayBuffer))
    );

    const { status, error } = await conversation.external(() =>
        convertMP3ToOGGOpus(
            input,
            output,
        )
    );

    if (!status) {
        ctx.session.currentVoice = null;
        await ctx.reply(ctx.t("newvoices.convertFailed", { errorMsg: error }));
        await conversation.external(() => Deno.remove(input));
    }

    const { voice: { file_id, file_unique_id } } = await ctx.replyWithVoice(
        new InputFile(output),
        {
            caption: ctx.t("newvoices.updated", {
                title: title,
            }),
        },
    );

    const finishPromises = Promise.all([
        updateVoiceFileID(id, file_id, file_unique_id),
        Deno.remove(input),
        Deno.remove(output),
    ]);
    await conversation.external(() => finishPromises);
    ctx.session.currentVoice = null;
}
