import { InputFile } from "@/deps.ts";

import {
    INPUT_EXTENSION,
    OUTPUT_EXTENSION,
} from "@/src/constants/extensions.ts";

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
        Deno.writeFile(input, new Uint8Array(arrayBuffer))
    );

    const { status, error } = await conversation.external(() =>
        convertMP3ToOGGOpus(input, output)
    );
    if (!status) {
        await ctx.reply(
            ctx.t("newvoices.convertFailed", { errorMsg: error }),
        );
        return;
    }

    const { voice: { file_id, file_unique_id } } = await ctx.replyWithVoice(
        new InputFile(output),
        {
            caption: ctx.t("newvoices.success", {
                title: voiceTitle,
            }),
        },
    );

    await conversation.external(() =>
        addNewVoice(voiceID, voiceTitle, file_id, file_unique_id)
    );
    await conversation.external(() => Deno.remove(input));
    await conversation.external(() => Deno.remove(output));

    if (conversation.session.addedVoices) {
        conversation.session.addedVoices.push(voiceTitle);
    }
}
