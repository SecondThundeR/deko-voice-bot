import { Menu } from "@/deps.ts";

import { closeMenuHandler } from "@/src/handlers/favoritesMenu/closeMenuHandler.ts";
import { dynamicListHandler } from "@/src/handlers/favoritesMenu/dynamicListHandler.ts";
import { fingerprintHandler } from "@/src/handlers/favoritesMenu/fingerprintHandler.ts";
import { nextPageHandler } from "@/src/handlers/favoritesMenu/nextPageHandler.ts";
import { outdatedHandler } from "@/src/handlers/favoritesMenu/outdatedHandler.ts";
import { prevPageHandler } from "@/src/handlers/favoritesMenu/prevPageHandler.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const favoritesMenu = new Menu<BotContext>("fav-menu", {
    autoAnswer: false,
    onMenuOutdated: outdatedHandler,
    fingerprint: fingerprintHandler,
})
    .dynamic(dynamicListHandler).row()
    .text((ctx) => ctx.t("menu.prev"), prevPageHandler)
    .text((ctx) => ctx.t("menu.close"), closeMenuHandler)
    .text((ctx) => ctx.t("menu.next"), nextPageHandler);
