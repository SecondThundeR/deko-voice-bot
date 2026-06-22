import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { NEW_VOICES_CONVERSATION } from "#root/bot/conversations/new-voices.js";
import { UPDATE_VOICE_FILE_CONVERSATION } from "#root/bot/conversations/update-voice-file.js";
import { UPDATE_VOICE_ID_CONVERSATION } from "#root/bot/conversations/update-voice-id.js";
import { UPDATE_VOICE_TITLE_CONVERSATION } from "#root/bot/conversations/update-voice-title.js";
import { isEmpty } from "#root/bot/helpers/general.js";
import { logHandle } from "#root/bot/helpers/logging.js";

const UPDATE_CONVERSATIONS = [
    UPDATE_VOICE_FILE_CONVERSATION,
    UPDATE_VOICE_ID_CONVERSATION,
    UPDATE_VOICE_TITLE_CONVERSATION,
];

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("cancel", logHandle("command-cancel"), async (ctx) => {
    const activeConversations = ctx.conversation.active();
    if (isEmpty(activeConversations)) {
        return;
    }

    const isAddingVoices = activeConversations[NEW_VOICES_CONVERSATION] > 0;
    const isUpdatingVoice = UPDATE_CONVERSATIONS.some(
        (conversation) => activeConversations[conversation] > 0,
    );
    const { addedVoices } = ctx.session;

    await ctx.conversation.exitAll();
    ctx.session.currentVoice = null;

    if (isUpdatingVoice) {
        return ctx.reply(ctx.t("conversation.updateCancel"));
    }

    if (isAddingVoices) {
        ctx.session.addedVoices = null;

        if (!addedVoices || addedVoices.length === 0) {
            return ctx.reply(ctx.t("conversation.addCancel"));
        }

        return ctx.reply(
            ctx.t("conversation.addResults", {
                voices: addedVoices.join("\n"),
            }),
        );
    }

    return ctx.reply(ctx.t("conversation.cancel"));
});

export { composer as cancelFeature };
