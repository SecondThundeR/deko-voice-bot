import { FavoriteItem, MenuBotContext } from "@/src/types/bot.ts";
import { updateFavoriteVoiceStatus } from "@/src/helpers/cache.ts";
import { locale } from "@/src/constants/locale.ts";
import { updateFavoritesData } from "@/src/database/deko/usersData/updateFavoritesData.ts";
import { isBotBlockedByUser } from "@/src/helpers/api.ts";

const { botBlocked, favorites: { inlineAnswerFail, inlineAnswerSuccess } } =
    locale.frontend;

export async function favoriteItemHandler(
    ctx: MenuBotContext,
    favorite: FavoriteItem,
) {
    if (await isBotBlockedByUser(ctx)) {
        return void await ctx.answerCallbackQuery(botBlocked);
    }

    const userID = ctx.from?.id;
    if (!userID) {
        return void await ctx.answerCallbackQuery({
            text: inlineAnswerFail,
        });
    }

    const { currentFavorites } = ctx.session;
    const newFavoriteStatus = !favorite.isFavored;
    const updatedFavorite = { ...favorite, isFavored: newFavoriteStatus };

    const newFavorites = await updateFavoriteVoiceStatus(
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
    await ctx.answerCallbackQuery({
        text: inlineAnswerSuccess,
    });
}
