import type { MenuRange } from "@grammyjs/menu";

import { maxMenuElementsPerPage } from "@/src/constants/inline";
import { FAVORITE_EMOJI } from "@/src/constants/locale";

import { favoriteItemHandler } from "@/src/handlers/favoritesMenu/favoriteItemHandler";
import { genericListHandler } from "@/src/handlers/menu/genericListHandler";

import type { BotContext, MenuBotContext } from "@/src/types/bot";

export function dynamicListHandler(
    ctx: BotContext,
    range: MenuRange<BotContext>,
) {
    const { currentFavoritesOffset, currentFavorites } = ctx.session;

    genericListHandler(ctx, range, {
        menuElements: currentFavorites,
        currentOffset: currentFavoritesOffset,
        elementsPerPage: maxMenuElementsPerPage,
        forEachCallback: (range, favoriteItem) => {
            const { isFavored, title } = favoriteItem;
            const isFavoredText = isFavored ? `${FAVORITE_EMOJI} ` : "";

            range
                .text(
                    `${isFavoredText}${title}`,
                    async (ctx: MenuBotContext) =>
                        await favoriteItemHandler(ctx, favoriteItem),
                )
                .row();
        },
    });
}
