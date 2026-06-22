import { Menu } from "@grammyjs/menu";

import type { Context } from "#root/bot/context.js";
import { closeMenuHandler } from "./favorites/close-menu-handler.ts";
import { dynamicListHandler } from "./favorites/dynamic-list-handler.ts";
import { fingerprintHandler } from "./favorites/fingerprint-handler.ts";
import { nextPageHandler } from "./favorites/next-page-handler.ts";
import { outdatedHandler } from "./favorites/outdated-handler.ts";
import { prevPageHandler } from "./favorites/prev-page-handler.ts";

export const favoritesMenu = new Menu<Context>("fav-menu", {
    autoAnswer: false,
    onMenuOutdated: outdatedHandler,
    fingerprint: fingerprintHandler,
})
    .dynamic(dynamicListHandler)
    .row()
    .text((ctx) => ctx.t("menu.prev"), prevPageHandler)
    .text((ctx) => ctx.t("menu.close"), closeMenuHandler)
    .text((ctx) => ctx.t("menu.next"), nextPageHandler);
