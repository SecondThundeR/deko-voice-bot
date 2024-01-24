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
    await ctx.reply(
        'Отправьте новую реплику в формате ".mp3" или напишите /cancel для отмены',
    );

    const audioMessage = await conversation.waitFor(":audio");
    const audioFile = await audioMessage.getFile();
    const filePath = audioFile.file_path;
    if (!filePath) {
        return void await ctx.reply(
            "Похоже, мне не удалось получить путь к этому файлу на серверах Telegram. Попробуйте ещё раз",
        );
    }

    const mp3Blob = await conversation.external(() =>
        fetchMediaFileBlob(filePath)
    );
    if (!mp3Blob) {
        return void await ctx.reply(
            "Похоже, мне не удалось скачать данные файла, который Вы кинули",
        );
    }

    const fileArrayBuffer = await mp3Blob.arrayBuffer();
    await conversation.external(() =>
        Deno.writeFile(INPUT_FILENAME, new Uint8Array(fileArrayBuffer))
    );

    await ctx.reply(
        "Отлично! Напишите ID для реплики (обычно это выглядит как <code>some_voice_id</code>) или /cancel, чтобы отменить добавление",
        {
            parse_mode: "HTML",
        },
    );

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

        await ctx.reply(
            "ID реплики не должен быть больше 64 символов. Напишите другой, чтобы мы могли продолжить дальше",
        );
    } while (!ctx.message?.text);
    if (!fileID) return;

    await ctx.reply("Как называется реплика?");
    const titleText = await conversation.form.text();

    if (!titleText) {
        return void ctx.reply("Текст реплики пустой, что-то пошло не так");
    }

    const { status, error } = await conversation.external(() =>
        convertMP3ToOGGOpus(
            INPUT_FILENAME,
            OUTPUT_FILENAME,
        )
    );

    if (!status) {
        await ctx.reply(
            "Что-то пошло не так во время конвертации реплики. Вот что команда выдала:" +
                error,
        );
        await conversation.external(() => Deno.remove(INPUT_FILENAME));
    }

    const message = await ctx.replyWithVoice(new InputFile(OUTPUT_FILENAME), {
        caption: `Новая реплика \"${titleText}\" была добавлена!`,
    });
    const voiceFileID = message.voice.file_id;

    const finishPromises = Promise.all([
        addNewVoice(fileID, titleText, voiceFileID),
        Deno.remove(INPUT_FILENAME),
        Deno.remove(OUTPUT_FILENAME),
    ]);
    await conversation.external(() => finishPromises);
}
