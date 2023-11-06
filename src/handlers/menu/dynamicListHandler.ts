import { MenuRange } from "@/deps.ts";
import { BotContext } from "@/src/types/bot.ts";
import { maxMenuElementsPerPage } from "@/src/constants/inline.ts";
import { favoriteItemHandler } from "@/src/handlers/menu/favoriteItemHandler.ts";
import { locale } from "@/src/constants/locale.ts";

const { favEmoji } = locale.frontend.favorites;

export function dynamicListHandler(
    ctx: BotContext,
    range: MenuRange<BotContext>,
) {
    const { currentOffset, currentFavorites } = ctx.session;
    if (!currentFavorites) return;

    const newOffset = currentOffset + maxMenuElementsPerPage;
    const indexLimit = newOffset > currentFavorites.length
        ? currentFavorites.length
        : newOffset;

    for (let i = currentOffset; i < indexLimit; i++) {
        const favoriteItem = currentFavorites[i];
        const { isFavored, title } = favoriteItem;
        const isFavoredText = isFavored ? `${favEmoji} ` : "";

        range
            .text(
                `${isFavoredText}${title}`,
                async (ctx) => await favoriteItemHandler(ctx, favoriteItem),
            )
            .row();
    }
}
