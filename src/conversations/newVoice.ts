import { InputFile } from "@/deps.ts";

import { INPUT_FILENAME, OUTPUT_FILENAME } from "@/src/constants/convert.ts";

import { addNewVoice } from "@/src/database/general/voices/addNewVoice.ts";

import { fetchMediaFileBlob } from "@/src/helpers/api.ts";
import { convertMP3ToOGGOpus } from "@/src/helpers/general.ts";

import { BotContext, ConversationContext } from "@/src/types/bot.ts";

export async function newVoice(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    await ctx.reply(ctx.t("newvoice.audioHint"));

    const audioMessage = await conversation.waitFor(":audio");
    const audioFile = await audioMessage.getFile();
    const filePath = audioFile.file_path;
    if (!filePath) {
        return void await ctx.reply(ctx.t("newvoice.audioPathEmpty"));
    }

    const mp3Blob = await fetchMediaFileBlob(filePath);
    if (!mp3Blob) {
        return void await ctx.reply(ctx.t("newvoice.audioFetchFailed"));
    }

    const fileArrayBuffer = await mp3Blob.arrayBuffer();
    await conversation.external(() =>
        Deno.writeFile(INPUT_FILENAME, new Uint8Array(fileArrayBuffer))
    );

    await ctx.reply(ctx.t("newvoice.idHint"), { parse_mode: "HTML" });

    let fileID: string | undefined;
    do {
        ctx = await conversation.wait();
        const messageText = ctx.message?.text;

        if (!messageText) {
            continue;
        } else if (messageText.length <= 64) {
            fileID = messageText;
            break;
        }

        await ctx.reply(ctx.t("newvoice.idLong"));
    } while (!ctx.message?.text);
    if (!fileID) return;

    await ctx.reply(ctx.t("newvoice.titleHint"));
    const titleText = await conversation.form.text();

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
