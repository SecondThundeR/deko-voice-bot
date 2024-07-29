import { Menu } from "@grammyjs/menu";

import { closeMenuHandler } from "@/src/handlers/voicesMenu/closeMenuHandler";
import { dynamicListHandler } from "@/src/handlers/voicesMenu/dynamicListHandler";
import { fingerprintHandler } from "@/src/handlers/voicesMenu/fingerprintHandler";
import { nextPageHandler } from "@/src/handlers/voicesMenu/nextPageHandler";
import { outdatedHandler } from "@/src/handlers/voicesMenu/outdatedHandler";
import { prevPageHandler } from "@/src/handlers/voicesMenu/prevPageHandler";

import { backMenuHandler } from "@/src/handlers/voicesSubmenu/backMenuHandler";
import { deleteVoiceHandler } from "@/src/handlers/voicesSubmenu/deleteVoiceHandler";
import { fingerprintHandler as fingerprintSubmenuHandler } from "@/src/handlers/voicesSubmenu/fingerprintHandler";
import { infoButtonHandler } from "@/src/handlers/voicesSubmenu/infoButtonHandler";
import { outdatedHandler as outdatedSubmenuHandler } from "@/src/handlers/voicesSubmenu/outdatedHandler";
import { updateIDHandler } from "@/src/handlers/voicesSubmenu/updateIDHandler";
import { updateTitleHandler } from "@/src/handlers/voicesSubmenu/updateTitleHandler";
import { updateVoiceDataHandler } from "@/src/handlers/voicesSubmenu/updateVoiceDataHandler";
import { updateVoiceLabelHandler } from "@/src/handlers/voicesSubmenu/voiceDataLabelHandler";

import type { BotContext } from "@/src/types/bot";

export const voicesMenu = new Menu<BotContext>("voices-menu", {
    autoAnswer: false,
    onMenuOutdated: outdatedHandler,
    fingerprint: fingerprintHandler,
})
    .dynamic(dynamicListHandler)
    .row()
    .text((ctx) => ctx.t("menu.prev"), prevPageHandler)
    .text((ctx) => ctx.t("menu.close"), closeMenuHandler)
    .text((ctx) => ctx.t("menu.next"), nextPageHandler);

const voicesSubmenu = new Menu<BotContext>("voice-submenu", {
    autoAnswer: false,
    onMenuOutdated: outdatedSubmenuHandler,
    fingerprint: fingerprintSubmenuHandler,
})
    .text(infoButtonHandler, (ctx) => ctx.answerCallbackQuery())
    .row()
    .text((ctx) => ctx.t("voices.updateID"), updateIDHandler)
    .text((ctx) => ctx.t("voices.updateTitle"), updateTitleHandler)
    .text((ctx) => ctx.t("voices.delete"), deleteVoiceHandler)
    .row()
    .text(updateVoiceLabelHandler, updateVoiceDataHandler)
    .row()
    .text((ctx) => ctx.t("menu.back"), backMenuHandler);

voicesMenu.register(voicesSubmenu);
