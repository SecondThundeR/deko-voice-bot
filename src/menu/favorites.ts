import { Menu } from "@grammyjs/menu";

import { closeMenuHandler } from "@/src/handlers/favoritesMenu/closeMenuHandler";
import { dynamicListHandler } from "@/src/handlers/favoritesMenu/dynamicListHandler";
import { fingerprintHandler } from "@/src/handlers/favoritesMenu/fingerprintHandler";
import { nextPageHandler } from "@/src/handlers/favoritesMenu/nextPageHandler";
import { outdatedHandler } from "@/src/handlers/favoritesMenu/outdatedHandler";
import { prevPageHandler } from "@/src/handlers/favoritesMenu/prevPageHandler";

import type { BotContext } from "@/src/types/bot";

export const favoritesMenu = new Menu<BotContext>("fav-menu", {
    autoAnswer: false,
    onMenuOutdated: outdatedHandler,
    fingerprint: fingerprintHandler,
})
    .dynamic(dynamicListHandler)
    .row()
    .text((ctx) => ctx.t("menu.prev"), prevPageHandler)
    .text((ctx) => ctx.t("menu.close"), closeMenuHandler)
    .text((ctx) => ctx.t("menu.next"), nextPageHandler);
