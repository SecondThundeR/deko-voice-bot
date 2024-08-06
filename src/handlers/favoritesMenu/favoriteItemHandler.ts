import { updateFavoritesData } from "@/src/database/general/usersData/updateFavoritesData";

import { updateFavoriteVoiceStatus } from "@/src/helpers/cache";

import type { MenuBotContext } from "@/src/types/bot";
import type { FavoriteItem } from "@/src/types/favoriteItem";

export async function favoriteItemHandler(
    ctx: MenuBotContext,
    favorite: FavoriteItem,
) {
    const userID = ctx.from?.id;
    if (!userID) {
        await ctx.answerCallbackQuery({
            text: ctx.t("favorites.inlineAnswerFail"),
        });
        return;
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

    const updatedFavorites =
        currentFavorites?.map((item) =>
            item.id !== favorite.id ? item : updatedFavorite,
        ) ?? null;
    ctx.session.currentFavorites = updatedFavorites;

    await ctx.menu.update({
        immediate: true,
    });
    await ctx.answerCallbackQuery({
        text: ctx.t("favorites.inlineAnswerSuccess"),
    });
}
