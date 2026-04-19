import { Menu } from "@grammyjs/menu";

import type { Context } from "../context";
import { closeMenuHandler } from "./favorites/close-menu-handler";
import { dynamicListHandler } from "./favorites/dynamic-list-handler";
import { fingerprintHandler } from "./favorites/fingerprint-handler";
import { nextPageHandler } from "./favorites/next-page-handler";
import { outdatedHandler } from "./favorites/outdated-handler";
import { prevPageHandler } from "./favorites/prev-page-handler";

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
