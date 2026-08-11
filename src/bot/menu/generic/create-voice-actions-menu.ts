import { Menu } from "@grammyjs/menu";

import type { Context, MenuContext } from "#root/bot/context.js";
import { UPDATE_VOICE_FILE_CONVERSATION } from "#root/bot/conversations/update-voice-file.js";
import { UPDATE_VOICE_ID_CONVERSATION } from "#root/bot/conversations/update-voice-id.js";
import { UPDATE_VOICE_TITLE_CONVERSATION } from "#root/bot/conversations/update-voice-title.js";
import { getVoiceSubmenuIdentificator } from "#root/bot/helpers/menu.js";
import { genericCloseHandler } from "./generic-close-handler.ts";
import { genericOutdatedHandler } from "./generic-outdated-handler.ts";

type VoiceActionsMenuOptions = {
    deleteVoice: (ctx: MenuContext) => Promise<unknown>;
    finalAction: {
        label: (ctx: Context) => string;
        handler: (ctx: MenuContext) => Promise<unknown> | unknown;
    };
    id: string;
};

function getInfoButtonText(ctx: Context) {
    const voice = ctx.session.currentVoice;
    return voice ? `${voice.title} (${voice.id})` : ctx.t("voices-unknown");
}

function enterConversation(conversationId: string) {
    return async (ctx: MenuContext) => {
        await genericCloseHandler(ctx);
        return ctx.conversation.enter(conversationId);
    };
}

export function createVoiceActionsMenu({
    deleteVoice,
    finalAction,
    id,
}: VoiceActionsMenuOptions) {
    return new Menu<Context>(id, {
        autoAnswer: false,
        fingerprint: getVoiceSubmenuIdentificator,
        onMenuOutdated: (ctx) =>
            genericOutdatedHandler(ctx, {
                menuElement: ctx.session.currentVoice,
            }),
    })
        .text(getInfoButtonText, (ctx) => ctx.callbackQuery.answer())
        .row()
        .text(
            (ctx) => ctx.t("voices-update-id-button"),
            enterConversation(UPDATE_VOICE_ID_CONVERSATION),
        )
        .text(
            (ctx) => ctx.t("voices-update-title-button"),
            enterConversation(UPDATE_VOICE_TITLE_CONVERSATION),
        )
        .text((ctx) => ctx.t("voices-delete-button"), deleteVoice)
        .row()
        .text(
            (ctx) => ctx.t("voices-update-file-button"),
            enterConversation(UPDATE_VOICE_FILE_CONVERSATION),
        )
        .row()
        .text(finalAction.label, finalAction.handler);
}
