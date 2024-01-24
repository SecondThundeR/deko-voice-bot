import { MenuRange } from "@/deps.ts";

import { maxMenuElementsPerPage } from "@/src/constants/inline.ts";
import { FAVORITE_EMOJI } from "@/src/constants/locale.ts";

import { favoriteItemHandler } from "@/src/handlers/menu/favoriteItemHandler.ts";

import type { BotContext, MenuBotContext } from "@/src/types/bot.ts";

export function dynamicListHandler(
    ctx: BotContext,
    // @ts-expect-error I wish this types won't conflict ever again
    range: MenuRange<BotContext>,
) {
    const { currentOffset, currentFavorites } = ctx.session;
    if (!currentFavorites) return;

    const newOffset = currentOffset + maxMenuElementsPerPage;
    const indexLimit = newOffset > currentFavorites.length
        ? currentFavorites.length
        : newOffset;

    currentFavorites.slice(currentOffset, indexLimit).forEach(
        (favoriteItem) => {
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
    );
}
