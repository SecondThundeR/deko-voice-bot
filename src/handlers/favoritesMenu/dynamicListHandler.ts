import type { MenuRange } from "@/deps.ts";

import { maxMenuElementsPerPage } from "@/src/constants/inline.ts";
import { FAVORITE_EMOJI } from "@/src/constants/locale.ts";

import { favoriteItemHandler } from "@/src/handlers/favoritesMenu/favoriteItemHandler.ts";
import { genericListHandler } from "@/src/handlers/menu/genericListHandler.ts";

import type { BotContext, MenuBotContext } from "@/src/types/bot.ts";

export function dynamicListHandler(
    ctx: BotContext,
    // @ts-expect-error I wish this types won't conflict ever again
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
