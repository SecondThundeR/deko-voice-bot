import {
    addUserFavorite,
    deleteUserFavorite,
} from "@deko-voice-bot/database/queries/users-favorites.js";
import type { MenuContext } from "#root/bot/context.js";
import type { FavoriteItem } from "#root/bot/types/favorite-item.js";

export async function favoriteItemHandler(
    ctx: MenuContext,
    favorite: FavoriteItem,
) {
    const userId = ctx.from?.id;
    if (!userId) {
        return ctx.answerCallbackQuery({
            text: ctx.t("favorites-update-failed"),
        });
    }

    const newFavoriteStatus = !favorite.isFavored;

    if (newFavoriteStatus) {
        await addUserFavorite({ userId, voiceId: favorite.id });
    } else {
        await deleteUserFavorite({ userId, voiceId: favorite.id });
    }

    await ctx.menu.update({
        immediate: true,
    });
    return ctx.answerCallbackQuery({
        text: ctx.t("favorites-update-started"),
    });
}
