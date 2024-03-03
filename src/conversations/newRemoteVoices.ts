import { getAudioRemoteURL } from "@/src/conversations/subconversations/getAudioRemoteURL.ts";
``;
import { getVoiceIDText } from "@/src/conversations/subconversations/getVoiceIDText.ts";
import { getVoiceTitleText } from "@/src/conversations/subconversations/getVoiceTitleText.ts";

import { addNewRemoteVoice } from "@/src/database/general/voices/addNewRemoteVoice.ts";

import type { BotContext, ConversationContext } from "@/src/types/bot.ts";

export async function newRemoteVoices(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    conversation.session.addedVoices = [];

    while (true) {
        const audioRemoteURL = await getAudioRemoteURL(conversation, ctx);
        if (!audioRemoteURL) {
            await ctx.reply(ctx.t("newremotevoices.URLEmpty"));
            continue;
        }

        const voiceID = await getVoiceIDText(conversation, ctx);
        if (!voiceID) {
            await ctx.reply(ctx.t("newvoices.idEmpty"));
            continue;
        }

        const voiceTitle = await getVoiceTitleText(conversation, ctx);
        if (!voiceTitle) {
            await ctx.reply(ctx.t("newvoices.titleEmpty"));
            continue;
        }

        await ctx.replyWithChatAction("upload_voice");

        try {
            const { voice: { file_unique_id } } = await ctx.replyWithVoice(
                audioRemoteURL,
                // https://drive.google.com/uc?export=download&id=1VFqTsWlzT-QJkH9aPFgvSSirM7316TsG
                {
                    caption: ctx.t("newremotevoices.success", {
                        title: voiceTitle,
                    }),
                    parse_mode: "HTML",
                },
            );
            await conversation.external(() =>
                addNewRemoteVoice(
                    voiceID,
                    voiceTitle,
                    audioRemoteURL,
                    file_unique_id,
                )
            );
            conversation.session.addedVoices.push(voiceTitle);
            continue;
        } catch (error: unknown) {
            console.error(error);
            await ctx.reply(ctx.t("newremotevoices.failed"));
        }
    }
}
