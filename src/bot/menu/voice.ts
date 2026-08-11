import { Menu } from "@grammyjs/menu";

import type { Context } from "#root/bot/context.js";
import { closeMenuHandler } from "./voice/close-menu-handler.ts";
import { deleteVoiceHandler } from "./voice/delete-voice-handler.ts";
import { fingerprintHandler } from "./voices-submenu/fingerprint-handler.ts";
import { infoButtonHandler } from "./voices-submenu/info-button-handler.ts";
import { outdatedHandler } from "./voices-submenu/outdated-handler.ts";
import { updateIDHandler } from "./voices-submenu/update-id-handler.ts";
import { updateTitleHandler } from "./voices-submenu/update-title-handler.ts";
import { updateVoiceDataHandler } from "./voices-submenu/update-voice-data-handler.ts";

export const voiceMenu = new Menu<Context>("voice-menu", {
    autoAnswer: false,
    onMenuOutdated: outdatedHandler,
    fingerprint: fingerprintHandler,
})
    .text(infoButtonHandler, (ctx) => ctx.callbackQuery.answer())
    .row()
    .text((ctx) => ctx.t("voices-update-id-button"), updateIDHandler)
    .text((ctx) => ctx.t("voices-update-title-button"), updateTitleHandler)
    .text((ctx) => ctx.t("voices-delete-button"), deleteVoiceHandler)
    .row()
    .text((ctx) => ctx.t("voices-update-file-button"), updateVoiceDataHandler)
    .row()
    .text((ctx) => ctx.t("menu-close-button"), closeMenuHandler);
