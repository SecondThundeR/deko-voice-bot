import { getVoicesCount } from "#drizzle/queries/voices.js";
import { MAX_MENU_ELEMENTS_PER_PAGE } from "#root/bot/constants/inline.js";
import type { Context } from "#root/bot/context.js";
import { getFavoritesMenuIdentificator } from "#root/bot/helpers/menu.js";
import { dynamicListHandler } from "./favorites/dynamic-list-handler.ts";
import { createPaginatedMenu } from "./generic/create-paginated-menu.ts";

export const favoritesMenu = createPaginatedMenu({
    id: "fav-menu",
    elementsPerPage: MAX_MENU_ELEMENTS_PER_PAGE,
    fingerprint: getFavoritesMenuIdentificator,
    getCurrentOffset: (ctx) => ctx.session.currentFavoritesOffset,
    getTotalElements: getVoicesCount,
    hasElements: async () => (await getVoicesCount()) > 0,
    render: dynamicListHandler,
    reset: (ctx: Context) => {
        ctx.session.currentFavoritesOffset = 0;
    },
    setCurrentOffset: (ctx, offset) => {
        ctx.session.currentFavoritesOffset = offset;
    },
});
