import { Menu } from "@/deps.ts";

import { dynamicListHandler } from "@/src/handlers/menu/dynamicListHandler.ts";
import { nextPageHandler } from "@/src/handlers/menu/nextPageHandler.ts";
import { prevPageHandler } from "@/src/handlers/menu/prevPageHandler.ts";
import { BotContext } from "@/src/types/bot.ts";
import { closeMenuHandler } from "@/src/handlers/menu/closeHandler.ts";
import { locale } from "@/src/constants/locale.ts";

const { prev, close, next } = locale.frontend.favorites;

export const favoritesMenu = new Menu<BotContext>("fav-menu", {
    autoAnswer: false,
})
    .dynamic(dynamicListHandler).row()
    .text(prev, prevPageHandler)
    .text(close, closeMenuHandler)
    .text(next, nextPageHandler);
