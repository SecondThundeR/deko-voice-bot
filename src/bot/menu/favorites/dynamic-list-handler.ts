import type { MenuRange } from "@grammyjs/menu";
import type { Context, MenuContext } from "@/bot/context";
import { getFavoritesMenuPage } from "@/bot/helpers/menu";
import { genericListHandler } from "../generic/generic-list-handler";
import { favoriteItemHandler } from "./favorite-item-handler";

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
