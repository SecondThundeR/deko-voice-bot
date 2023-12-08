import { Menu } from "@/deps.ts";

import { closeMenuHandler } from "@/src/handlers/menu/closeMenuHandler.ts";
import { dynamicListHandler } from "@/src/handlers/menu/dynamicListHandler.ts";
import { fingerprintHandler } from "@/src/handlers/menu/fingerprintHandler.ts";
import { nextPageHandler } from "@/src/handlers/menu/nextPageHandler.ts";
import { outdatedHandler } from "@/src/handlers/menu/outdatedHandler.ts";
import { prevPageHandler } from "@/src/handlers/menu/prevPageHandler.ts";
import { BotContext } from "@/src/types/bot.ts";
import { locale } from "@/src/constants/locale.ts";

const { prev, close, next } = locale.frontend.favorites;

export const favoritesMenu = new Menu<BotContext>("fav-menu", {
    autoAnswer: false,
    onMenuOutdated: outdatedHandler,
    fingerprint: fingerprintHandler,
})
    .dynamic(dynamicListHandler).row()
    .text(prev, prevPageHandler)
    .text(close, closeMenuHandler)
    .text(next, nextPageHandler);
