import { InputFile } from "grammy";
import { unlink } from "node:fs/promises";

import { replaceVoiceURL as replaceVoice } from "@/drizzle/queries/update";

import { INPUT_EXTENSION, OUTPUT_EXTENSION } from "@/src/constants/extensions";

import { getAudioFilePath } from "@/src/conversations/subconversations/getAudioFilePath";

import { fetchMediaFileData } from "@/src/helpers/api";
import { convertMP3ToOGGOpus } from "@/src/helpers/general";

import type { BotContext, ConversationContext } from "@/src/types/bot";

export async function replaceVoiceURL(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    const voiceData = await conversation.external(
        (ctx) => ctx.session.currentVoice,
    );
    if (!voiceData) return;

    const { id, title } = voiceData;
    const input = title + INPUT_EXTENSION;
    const output = title + OUTPUT_EXTENSION;
    const audioFilePath = await getAudioFilePath(conversation, ctx);
    if (!audioFilePath) {
        await conversation.external(() => {
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
        await conversation.external(() => {
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
        await conversation.external(() => {
            ctx.session.currentVoice = null;
        });
        await conversation.external(() => unlink(input));
        await ctx.reply(ctx.t("newvoices.convertFailed", { errorMsg: error }));
    }

    await ctx.replyWithChatAction("upload_voice");

    const {
        voice: { file_id, file_unique_id },
    } = await ctx.replyWithVoice(new InputFile(output), {
        caption: ctx.t("newvoices.updated", { title: title }),
    });

    await conversation.external(() =>
        Promise.all([
            replaceVoice(id, { fileId: file_id, fileUniqueId: file_unique_id }),
            unlink(input),
            unlink(output),
        ]),
    );

    await conversation.external((ctx) => {
        ctx.session.currentVoice = null;
    });
}
