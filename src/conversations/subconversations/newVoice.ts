import { InputFile } from "grammy";
import { unlink } from "fs/promises";

import { INPUT_EXTENSION, OUTPUT_EXTENSION } from "@/src/constants/extensions";

import { getAudioFilePath } from "@/src/conversations/subconversations/getAudioFilePath";
import { getVoiceIDText } from "@/src/conversations/subconversations/getVoiceIDText";
import { getVoiceTitleText } from "@/src/conversations/subconversations/getVoiceTitleText";

import { addNewVoice } from "@/src/database/general/voices/addNewVoice";

import { fetchMediaFileBlob } from "@/src/helpers/api";
import { convertMP3ToOGGOpus } from "@/src/helpers/general";

import type { BotContext, ConversationContext } from "@/src/types/bot";

export async function newVoice(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    const audioFilePath = await getAudioFilePath(conversation, ctx);
    if (!audioFilePath) {
        await ctx.reply(ctx.t("newvoices.audioPathEmpty"));
        return;
    }

    await ctx.replyWithChatAction("typing");

    const fileBlob = await fetchMediaFileBlob(audioFilePath);
    if (!fileBlob) {
        await ctx.reply(ctx.t("newvoices.audioFetchFailed"));
        return;
    }

    const voiceID = await getVoiceIDText(conversation, ctx);
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
        await ctx.reply(ctx.t("newvoices.convertFailed", { errorMsg: error }));
        return;
    }

    const {
        voice: { file_id, file_unique_id },
    } = await ctx.replyWithVoice(new InputFile(output), {
        caption: ctx.t("newvoices.success", {
            title: voiceTitle,
        }),
    });

    await conversation.external(() =>
        addNewVoice(voiceID, voiceTitle, file_id, file_unique_id),
    );
    await conversation.external(() => unlink(input));
    await conversation.external(() => unlink(output));

    if (conversation.session.addedVoices) {
        conversation.session.addedVoices.push(voiceTitle);
    }
}
