import { Menu } from "@grammyjs/menu";

import type { Context } from "@/bot/context";
import { closeMenuHandler } from "./voice/close-menu-handler";
import { deleteVoiceHandler } from "./voice/delete-voice-handler";
import { fingerprintHandler } from "./voices-submenu/fingerprint-handler";
import { infoButtonHandler } from "./voices-submenu/info-button-handler";
import { outdatedHandler } from "./voices-submenu/outdated-handler";
import { updateIDHandler } from "./voices-submenu/update-id-handler";
import { updateTitleHandler } from "./voices-submenu/update-title-handler";
import { updateVoiceDataHandler } from "./voices-submenu/update-voice-data-handler";

export const voiceMenu = new Menu<Context>("voice-menu", {
    autoAnswer: false,
    onMenuOutdated: outdatedHandler,
    fingerprint: fingerprintHandler,
})
    .text(infoButtonHandler, (ctx) => ctx.callbackQuery.answer())
    .row()
    .text((ctx) => ctx.t("voices.updateID"), updateIDHandler)
    .text((ctx) => ctx.t("voices.updateTitle"), updateTitleHandler)
    .text((ctx) => ctx.t("voices.delete"), deleteVoiceHandler)
    .row()
    .text((ctx) => ctx.t("voices.updateFile"), updateVoiceDataHandler)
    .row()
    .text((ctx) => ctx.t("menu.close"), closeMenuHandler);
