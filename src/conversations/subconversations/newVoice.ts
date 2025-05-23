import { InputFile } from "grammy";
import { unlink } from "node:fs/promises";

import { addRegularVoice } from "@/drizzle/queries/insert";

import { INPUT_EXTENSION, OUTPUT_EXTENSION } from "@/src/constants/extensions";

import { getAudioFilePath } from "@/src/conversations/subconversations/getAudioFilePath";
import { getVoiceIDText } from "@/src/conversations/subconversations/getVoiceIDText";
import { getVoiceTitleText } from "@/src/conversations/subconversations/getVoiceTitleText";

import { fetchMediaFileData } from "@/src/helpers/api";
import { convertMP3ToOGGOpus } from "@/src/helpers/general";

import type { BotContext, ConversationContext } from "@/src/types/bot";

export async function newVoice(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    const audioFilePath = await getAudioFilePath(conversation, ctx);
    if (!audioFilePath) {
        return await ctx.reply(ctx.t("newvoices.audioPathEmpty"));
    }

    await ctx.replyWithChatAction("typing");

    const fileBlob = await fetchMediaFileData({
        filePath: audioFilePath,
        token: ctx.api.token,
        returnType: "blob",
    });
    if (!fileBlob) {
        return await ctx.reply(ctx.t("newvoices.audioFetchFailed"));
    }

    const voiceId = await getVoiceIDText(conversation, ctx);
    const voiceTitle = await getVoiceTitleText(conversation, ctx);

    await ctx.replyWithChatAction("upload_voice");

    const input = voiceTitle + INPUT_EXTENSION;
    const output = voiceTitle + OUTPUT_EXTENSION;
    const arrayBuffer = await fileBlob.arrayBuffer();

    await conversation.external(() =>
        Bun.write(input, new Uint8Array(arrayBuffer)),
    );

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

    await conversation.external(() =>
        addRegularVoice({
            voiceId,
            voiceTitle,
            fileId: file_id,
            fileUniqueId: file_unique_id,
        }),
    );
    await conversation.external(() => unlink(input));
    await conversation.external(() => unlink(output));

    await conversation.external((ctx) => {
        ctx.session.addedVoices?.push(voiceTitle);
    });
}
