import type { Context, MenuContext } from "#root/bot/context.js";
import { createVoiceActionsMenu } from "./generic/create-voice-actions-menu.ts";
import { genericCloseHandler } from "./generic/generic-close-handler.ts";
import { deleteVoiceHandler } from "./voice/delete-voice-handler.ts";

export const voiceMenu = createVoiceActionsMenu({
    id: "voice-menu",
    deleteVoice: deleteVoiceHandler,
    finalAction: {
        label: (ctx: Context) => ctx.t("menu-close-button"),
        handler: (ctx: MenuContext) =>
            genericCloseHandler(ctx, (ctx) => {
                ctx.session.currentVoice = null;
            }),
    },
});
