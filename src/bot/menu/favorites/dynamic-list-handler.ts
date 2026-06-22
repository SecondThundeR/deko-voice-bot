import type { MenuRange } from "@grammyjs/menu";
import type { Context, MenuContext } from "#root/bot/context.js";
import { getFavoritesMenuPage } from "#root/bot/helpers/menu.js";
import { genericListHandler } from "../generic/generic-list-handler.ts";
import { favoriteItemHandler } from "./favorite-item-handler.ts";

export async function dynamicListHandler(
    ctx: Context,
    range: MenuRange<Context>,
) {
    const userID = ctx.from?.id;
    if (!userID) {
        return;
    }

    const currentFavorites = await getFavoritesMenuPage(ctx, userID);

    genericListHandler(range, {
        menuElements: currentFavorites,
        currentOffset: 0,
        elementsPerPage: currentFavorites.length,
        forEachCallback: (range, favoriteItem) => {
            const { isFavored, title } = favoriteItem;
            const isFavoredText = isFavored ? `⭐️ ` : "";

            range
                .text(`${isFavoredText}${title}`, (ctx: MenuContext) =>
                    favoriteItemHandler(ctx, favoriteItem),
                )
                .row();
        },
    });
}
