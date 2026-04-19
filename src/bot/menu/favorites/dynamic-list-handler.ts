import type { MenuRange } from "@grammyjs/menu";
import { MAX_MENU_ELEMENTS_PER_PAGE } from "../../constants/inline";
import type { Context, MenuContext } from "../../context";
import { genericListHandler } from "../generic/generic-list-handler";
import { favoriteItemHandler } from "./favorite-item-handler";

export function dynamicListHandler(ctx: Context, range: MenuRange<Context>) {
    const { currentFavoritesOffset, currentFavorites } = ctx.session;

    genericListHandler(range, {
        menuElements: currentFavorites,
        currentOffset: currentFavoritesOffset,
        elementsPerPage: MAX_MENU_ELEMENTS_PER_PAGE,
        forEachCallback: (range, favoriteItem) => {
            const { isFavored, title } = favoriteItem;
            const isFavoredText = isFavored ? `⭐️ ` : "";

            range
                .text(
                    `${isFavoredText}${title}`,
                    async (ctx: MenuContext) =>
                        await favoriteItemHandler(ctx, favoriteItem),
                )
                .row();
        },
    });
}
