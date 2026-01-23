import { Menu } from "@grammyjs/menu";

import { closeMenuHandler } from "@/src/handlers/voiceMenu/closeMenuHandler";
import { deleteVoiceHandler } from "@/src/handlers/voiceMenu/deleteVoiceHandler";

import { fingerprintHandler } from "@/src/handlers/voicesSubmenu/fingerprintHandler";
import { infoButtonHandler } from "@/src/handlers/voicesSubmenu/infoButtonHandler";
import { outdatedHandler } from "@/src/handlers/voicesSubmenu/outdatedHandler";
import { updateIDHandler } from "@/src/handlers/voicesSubmenu/updateIDHandler";
import { updateTitleHandler } from "@/src/handlers/voicesSubmenu/updateTitleHandler";
import { updateVoiceDataHandler } from "@/src/handlers/voicesSubmenu/updateVoiceDataHandler";

import type { BotContext } from "@/src/types/bot";

export const voiceMenu = new Menu<BotContext>("voice-menu", {
    autoAnswer: false,
    onMenuOutdated: outdatedHandler,
    fingerprint: fingerprintHandler,
})
    .text(infoButtonHandler, (ctx) => ctx.answerCallbackQuery())
    .row()
    .text((ctx) => ctx.t("voices.updateID"), updateIDHandler)
    .text((ctx) => ctx.t("voices.updateTitle"), updateTitleHandler)
    .text((ctx) => ctx.t("voices.delete"), deleteVoiceHandler)
    .row()
    .text((ctx) => ctx.t("voices.updateFile"), updateVoiceDataHandler)
    .row()
    .text((ctx) => ctx.t("menu.close"), closeMenuHandler);
