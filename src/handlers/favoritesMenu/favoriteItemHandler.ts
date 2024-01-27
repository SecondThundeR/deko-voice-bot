import { updateFavoritesData } from "@/src/database/general/usersData/updateFavoritesData.ts";

import { updateFavoriteVoiceStatus } from "@/src/helpers/cache.ts";

import type { MenuBotContext } from "@/src/types/bot.ts";
import type { FavoriteItem } from "@/src/types/favoriteItem.ts";

export async function favoriteItemHandler(
    ctx: MenuBotContext,
    favorite: FavoriteItem,
) {
    const userID = ctx.from?.id;
    if (!userID) {
        return void await ctx.answerCallbackQuery({
            text: ctx.t("favorites.inlineAnswerFail"),
        });
    }

    const { currentFavorites } = ctx.session;
    const newFavoriteStatus = !favorite.isFavored;
    const updatedFavorite = { ...favorite, isFavored: newFavoriteStatus };

    const newFavorites = await updateFavoriteVoiceStatus({
        userID,
        voiceID: favorite.id,
        newStatus: newFavoriteStatus,
    });
    await updateFavoritesData(userID, newFavorites);

    const updatedFavorites = currentFavorites
        ?.map((item) => item.id !== favorite.id ? item : updatedFavorite) ??
        null;
    ctx.session.currentFavorites = updatedFavorites;

    await ctx.menu.update({
        immediate: true,
    });
    await ctx.answerCallbackQuery({
        text: ctx.t("favorites.inlineAnswerSuccess"),
    });
}
