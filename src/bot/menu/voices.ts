import { Menu } from "@grammyjs/menu";
import type { Context } from "#root/bot/context.js";
import { closeMenuHandler } from "./voices/close-menu-handler.ts";
import { dynamicListHandler } from "./voices/dynamic-list-handler.ts";
import { fingerprintHandler } from "./voices/fingerprint-handler.ts";
import { nextPageHandler } from "./voices/next-page-handler.ts";
import { outdatedHandler } from "./voices/outdated-handler.ts";
import { prevPageHandler } from "./voices/prev-page-handler.ts";
import { backMenuHandler } from "./voices-submenu/back-menu-handler.ts";
import { deleteVoiceHandler } from "./voices-submenu/delete-voice-handler.ts";
import { fingerprintHandler as fingerprintSubmenuHandler } from "./voices-submenu/fingerprint-handler.ts";
import { infoButtonHandler } from "./voices-submenu/info-button-handler.ts";
import { outdatedHandler as outdatedSubmenuHandler } from "./voices-submenu/outdated-handler.ts";
import { updateIDHandler } from "./voices-submenu/update-id-handler.ts";
import { updateTitleHandler } from "./voices-submenu/update-title-handler.ts";
import { updateVoiceDataHandler } from "./voices-submenu/update-voice-data-handler.ts";

export const voicesMenu = new Menu<Context>("voices-menu", {
    autoAnswer: false,
    onMenuOutdated: outdatedHandler,
    fingerprint: fingerprintHandler,
})
    .dynamic(dynamicListHandler)
    .row()
    .text((ctx) => ctx.t("menu.prev"), prevPageHandler)
    .text((ctx) => ctx.t("menu.close"), closeMenuHandler)
    .text((ctx) => ctx.t("menu.next"), nextPageHandler);

const voicesSubmenu = new Menu<Context>("voice-submenu", {
    autoAnswer: false,
    onMenuOutdated: outdatedSubmenuHandler,
    fingerprint: fingerprintSubmenuHandler,
})
    .text(infoButtonHandler, (ctx) => ctx.callbackQuery.answer())
    .row()
    .text((ctx) => ctx.t("voices.updateID"), updateIDHandler)
    .text((ctx) => ctx.t("voices.updateTitle"), updateTitleHandler)
    .text((ctx) => ctx.t("voices.delete"), deleteVoiceHandler)
    .row()
    .text((ctx) => ctx.t("voices.updateFile"), updateVoiceDataHandler)
    .row()
    .text((ctx) => ctx.t("menu.back"), backMenuHandler);

voicesMenu.register(voicesSubmenu);
