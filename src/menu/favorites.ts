import { Menu } from "@/deps.ts";

import { closeMenuHandler } from "@/src/handlers/menu/closeMenuHandler.ts";
import { dynamicListHandler } from "@/src/handlers/menu/dynamicListHandler.ts";
import { fingerprintHandler } from "@/src/handlers/menu/fingerprintHandler.ts";
import { nextPageHandler } from "@/src/handlers/menu/nextPageHandler.ts";
import { outdatedHandler } from "@/src/handlers/menu/outdatedHandler.ts";
import { prevPageHandler } from "@/src/handlers/menu/prevPageHandler.ts";

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
