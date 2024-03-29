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
    const input = title + INPUT_EXTENSION;
    const output = title + OUTPUT_EXTENSION;
    const audioFilePath = await getAudioFilePath(conversation, ctx);
    if (!audioFilePath) {
        ctx.session.currentVoice = null;
        await ctx.reply(ctx.t("newvoices.audioPathEmpty"));
        return;
    }

    await ctx.replyWithChatAction("typing");

    const fileBlob = await fetchMediaFileBlob(audioFilePath);
    if (!fileBlob) {
        ctx.session.currentVoice = null;
        await ctx.reply(ctx.t("newvoices.audioFetchFailed"));
        return;
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    await conversation.external(() =>
        Deno.writeFile(input, new Uint8Array(arrayBuffer))
    );

    const { status, error } = await conversation.external(() =>
        convertMP3ToOGGOpus(
            input,
            output,
        )
    );
    if (!status) {
        ctx.session.currentVoice = null;
        await conversation.external(() => Deno.remove(input));
        await ctx.reply(ctx.t("newvoices.convertFailed", { errorMsg: error }));
    }

    const { voice: { file_id, file_unique_id } } = await ctx.replyWithVoice(
        new InputFile(output),
        {
            caption: ctx.t("newvoices.updated", {
                title: title,
            }),
        },
    );

    await conversation.external(() =>
        Promise.all([
            updateVoiceFileID(id, file_id, file_unique_id),
            Deno.remove(input),
            Deno.remove(output),
        ])
    );

    ctx.session.currentVoice = null;
}
