import { Composer } from "grammy";
import type { Context } from "../context";
import { NEW_VOICES_CONVERSATION } from "../conversations/new-voices";
import { UPDATE_VOICE_FILE_CONVERSATION } from "../conversations/update-voice-file";
import { UPDATE_VOICE_ID_CONVERSATION } from "../conversations/update-voice-id";
import { UPDATE_VOICE_TITLE_CONVERSATION } from "../conversations/update-voice-title";
import { isEmpty } from "../helpers/general";
import { logHandle } from "../helpers/logging";

const UPDATE_CONVERSATIONS = [
    UPDATE_VOICE_FILE_CONVERSATION,
    UPDATE_VOICE_ID_CONVERSATION,
    UPDATE_VOICE_TITLE_CONVERSATION,
];

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("cancel", logHandle("command-cancel"), async (ctx) => {
    const activeConversations = ctx.conversation.active();
    if (isEmpty(activeConversations)) return;

    const isAddingVoices = activeConversations[NEW_VOICES_CONVERSATION] > 0;
    const isUpdatingVoice = UPDATE_CONVERSATIONS.some(
        (conversation) => activeConversations[conversation] > 0,
    );
    const { addedVoices } = ctx.session;

    await ctx.conversation.exitAll();
    ctx.session.currentVoice = null;

    if (isUpdatingVoice) {
        return await ctx.reply(ctx.t("conversation.updateCancel"));
    }

    if (isAddingVoices) {
        ctx.session.addedVoices = null;

        if (!addedVoices || addedVoices.length === 0) {
            await ctx.reply(ctx.t("conversation.addCancel"));
            return;
        }

        await ctx.reply(
            ctx.t("conversation.addResults", {
                voices: addedVoices.join("\n"),
            }),
        );
        return;
    }

    return await ctx.reply(ctx.t("conversation.cancel"));
});

export { composer as cancelFeature };
