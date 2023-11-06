import { FavoriteItem, MenuBotContext } from "@/src/types/bot.ts";
import { updateFavoriteVoiceStatus } from "@/src/helpers/cache.ts";
import { locale } from "@/src/constants/locale.ts";
import { updateFavoritesData } from "@/src/database/deko/stats/updateFavoritesData.ts";

const { inlineAnswerFail, inlineAnswerSuccess } = locale.frontend.favorites;

export async function favoriteItemHandler(
    ctx: MenuBotContext,
    favorite: FavoriteItem,
) {
    const userID = ctx.from?.id;
    if (!userID) {
        return await ctx.answerCallbackQuery({
            text: inlineAnswerFail,
        });
    }

    await ctx.answerCallbackQuery({
        text: inlineAnswerSuccess,
    });

    const { currentFavorites } = ctx.session;
    const newFavoriteStatus = !favorite.isFavored;
    const updatedFavorite = { ...favorite, isFavored: newFavoriteStatus };

    const newFavorites = updateFavoriteVoiceStatus(
        userID,
        favorite.id,
        newFavoriteStatus,
    );
    await updateFavoritesData(userID, newFavorites);

    const updatedFavorites =
        currentFavorites?.map((item) =>
            item.id !== favorite.id ? item : updatedFavorite
        ) ?? null;

    ctx.session.currentFavorites = updatedFavorites;
    ctx.menu.update();
}
