import { Menu } from "@/deps.ts";

import { closeMenuHandler } from "@/src/handlers/voiceMenu/closeMenuHandler.ts";
import { deleteVoiceHandler } from "@/src/handlers/voiceMenu/deleteVoiceHandler.ts";

import { fingerprintHandler } from "@/src/handlers/voicesSubmenu/fingerprintHandler.ts";
import { infoButtonHandler } from "@/src/handlers/voicesSubmenu/infoButtonHandler.ts";
import { outdatedHandler } from "@/src/handlers/voicesSubmenu/outdatedHandler.ts";
import { updateIDHandler } from "@/src/handlers/voicesSubmenu/updateIDHandler.ts";
import { updateTitleHandler } from "@/src/handlers/voicesSubmenu/updateTitleHandler.ts";
import { updateVoiceDataHandler } from "@/src/handlers/voicesSubmenu/updateVoiceDataHandler.ts";
import { updateVoiceLabelHandler } from "@/src/handlers/voicesSubmenu/voiceDataLabelHandler.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const voiceMenu = new Menu<BotContext>("voice-menu", {
    autoAnswer: false,
    onMenuOutdated: outdatedHandler,
    fingerprint: fingerprintHandler,
})
    .text(infoButtonHandler, (ctx) => ctx.answerCallbackQuery()).row()
    .text((ctx) => ctx.t("voices.updateID"), updateIDHandler)
    .text((ctx) => ctx.t("voices.updateTitle"), updateTitleHandler)
    .text((ctx) => ctx.t("voices.delete"), deleteVoiceHandler).row()
    .text(updateVoiceLabelHandler, updateVoiceDataHandler).row()
    .text((ctx) => ctx.t("menu.close"), closeMenuHandler);
