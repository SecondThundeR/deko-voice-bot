import { Menu } from "@/deps.ts";

import { closeMenuHandler } from "@/src/handlers/voicesMenu/closeMenuHandler.ts";
import { dynamicListHandler } from "@/src/handlers/voicesMenu/dynamicListHandler.ts";
import { fingerprintHandler } from "@/src/handlers/voicesMenu/fingerprintHandler.ts";
import { nextPageHandler } from "@/src/handlers/voicesMenu/nextPageHandler.ts";
import { outdatedHandler } from "@/src/handlers/voicesMenu/outdatedHandler.ts";
import { prevPageHandler } from "@/src/handlers/voicesMenu/prevPageHandler.ts";

import type { BotContext } from "@/src/types/bot.ts";

// @ts-expect-error
export const voicesMenu = new Menu<BotContext>("voices-menu", {
    autoAnswer: false,
    onMenuOutdated: outdatedHandler,
    fingerprint: fingerprintHandler,
})
    .dynamic(dynamicListHandler).row()
    .text((ctx) => ctx.t("menu.prev"), prevPageHandler)
    .text((ctx) => ctx.t("menu.close"), closeMenuHandler)
    .text((ctx) => ctx.t("menu.next"), nextPageHandler);
