import { Menu } from "@grammyjs/menu";
import type { Context } from "@/bot/context";
import { closeMenuHandler } from "./voices/close-menu-handler";
import { dynamicListHandler } from "./voices/dynamic-list-handler";
import { fingerprintHandler } from "./voices/fingerprint-handler";
import { nextPageHandler } from "./voices/next-page-handler";
import { outdatedHandler } from "./voices/outdated-handler";
import { prevPageHandler } from "./voices/prev-page-handler";
import { backMenuHandler } from "./voices-submenu/back-menu-handler";
import { deleteVoiceHandler } from "./voices-submenu/delete-voice-handler";
import { fingerprintHandler as fingerprintSubmenuHandler } from "./voices-submenu/fingerprint-handler";
import { infoButtonHandler } from "./voices-submenu/info-button-handler";
import { outdatedHandler as outdatedSubmenuHandler } from "./voices-submenu/outdated-handler";
import { updateIDHandler } from "./voices-submenu/update-id-handler";
import { updateTitleHandler } from "./voices-submenu/update-title-handler";
import { updateVoiceDataHandler } from "./voices-submenu/update-voice-data-handler";

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
