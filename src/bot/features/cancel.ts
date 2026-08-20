import { Composer } from "grammy";
import { importSessions } from "#root/backup/restore-coordinator.js";
import type { Context } from "#root/bot/context.js";
import { NEW_VOICES_CONVERSATION } from "#root/bot/conversations/new-voices.js";
import { UPDATE_VOICE_FILE_CONVERSATION } from "#root/bot/conversations/update-voice-file.js";
import { UPDATE_VOICE_ID_CONVERSATION } from "#root/bot/conversations/update-voice-id.js";
import { UPDATE_VOICE_TITLE_CONVERSATION } from "#root/bot/conversations/update-voice-title.js";
import { logHandle } from "#root/bot/helpers/logging.js";

const UPDATE_CONVERSATIONS = [
    UPDATE_VOICE_FILE_CONVERSATION,
    UPDATE_VOICE_ID_CONVERSATION,
    UPDATE_VOICE_TITLE_CONVERSATION,
];

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("cancel", logHandle("command-cancel"), async (ctx) => {
    if (await importSessions.cancel(ctx.from.id, ctx.chat.id)) {
        return ctx.reply(ctx.t("import-cancelled"));
    }

    const activeConversations = ctx.conversation.active();
    if (Object.keys(activeConversations).length === 0) {
        return;
    }

    const isAddingVoices = activeConversations[NEW_VOICES_CONVERSATION] > 0;
    const isUpdatingVoice = UPDATE_CONVERSATIONS.some(
        (conversation) => activeConversations[conversation] > 0,
    );
    await ctx.conversation.exitAll();
    ctx.session.currentVoice = null;

    if (isUpdatingVoice) {
        return ctx.reply(ctx.t("conversation-update-cancelled"));
    }

    if (isAddingVoices) {
        return ctx.reply(ctx.t("conversation-add-cancelled"));
    }

    return ctx.reply(ctx.t("conversation-cancelled"));
});

export { composer as cancelFeature };
