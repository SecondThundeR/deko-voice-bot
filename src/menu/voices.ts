import { Menu } from "@/deps.ts";

import { closeMenuHandler } from "@/src/handlers/voicesMenu/closeMenuHandler.ts";
import { dynamicListHandler } from "@/src/handlers/voicesMenu/dynamicListHandler.ts";
import { fingerprintHandler } from "@/src/handlers/voicesMenu/fingerprintHandler.ts";
import { nextPageHandler } from "@/src/handlers/voicesMenu/nextPageHandler.ts";
import { outdatedHandler } from "@/src/handlers/voicesMenu/outdatedHandler.ts";
import { prevPageHandler } from "@/src/handlers/voicesMenu/prevPageHandler.ts";

import { backMenuHandler } from "@/src/handlers/voicesSubmenu/backMenuHandler.ts";
import { deleteVoiceHandler } from "@/src/handlers/voicesSubmenu/deleteVoiceHandler.ts";
import { fingerprintHandler as fingerprintSubmenuHandler } from "@/src/handlers/voicesSubmenu/fingerprintHandler.ts";
import { infoButtonHandler } from "@/src/handlers/voicesSubmenu/infoButtonHandler.ts";
import { outdatedHandler as outdatedSubmenuHandler } from "@/src/handlers/voicesSubmenu/outdatedHandler.ts";
import { updateIDHandler } from "@/src/handlers/voicesSubmenu/updateIDHandler.ts";
import { updateTitleHandler } from "@/src/handlers/voicesSubmenu/updateTitleHandler.ts";
import { updateVoiceDataHandler } from "@/src/handlers/voicesSubmenu/updateVoiceDataHandler.ts";
import { updateVoiceLabelHandler } from "@/src/handlers/voicesSubmenu/voiceDataLabelHandler.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const voicesMenu = new Menu<BotContext>("voices-menu", {
    autoAnswer: false,
    onMenuOutdated: outdatedHandler,
    fingerprint: fingerprintHandler,
})
    .dynamic(dynamicListHandler).row()
    .text((ctx) => ctx.t("menu.prev"), prevPageHandler)
    .text((ctx) => ctx.t("menu.close"), closeMenuHandler)
    .text((ctx) => ctx.t("menu.next"), nextPageHandler);

const voicesSubmenu = new Menu<BotContext>("voice-submenu", {
    autoAnswer: false,
    onMenuOutdated: outdatedSubmenuHandler,
    fingerprint: fingerprintSubmenuHandler,
})
    .text(infoButtonHandler, (ctx) => ctx.answerCallbackQuery()).row()
    .text((ctx) => ctx.t("voices.updateID"), updateIDHandler)
    .text((ctx) => ctx.t("voices.updateTitle"), updateTitleHandler)
    .text((ctx) => ctx.t("voices.delete"), deleteVoiceHandler).row()
    .text(updateVoiceLabelHandler, updateVoiceDataHandler).row()
    .text((ctx) => ctx.t("menu.back"), backMenuHandler);

voicesMenu.register(voicesSubmenu);
