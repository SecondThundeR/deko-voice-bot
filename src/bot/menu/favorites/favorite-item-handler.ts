import { deleteUserFavoriteQuery } from "@/drizzle/prepared/usersFavorites";
import { addUserFavorite } from "@/drizzle/queries/insert";
import type { MenuContext } from "../../context";
import type { FavoriteItem } from "../../types/favorite-item";

export async function favoriteItemHandler(
    ctx: MenuContext,
    favorite: FavoriteItem,
) {
    const userId = ctx.from?.id;
    if (!userId) {
        return await ctx.answerCallbackQuery({
            text: ctx.t("favorites.inlineAnswerFail"),
        });
    }

    const { currentFavorites } = ctx.session;
    const newFavoriteStatus = !favorite.isFavored;
    const updatedFavorite = { ...favorite, isFavored: newFavoriteStatus };

    if (newFavoriteStatus) {
        await addUserFavorite({ userId, voiceId: favorite.id });
    } else {
        await deleteUserFavoriteQuery.execute({ userId, voiceId: favorite.id });
    }

    ctx.session.currentFavorites =
        currentFavorites?.map((item) =>
            item.id !== favorite.id ? item : updatedFavorite,
        ) ?? null;

    await ctx.menu.update({
        immediate: true,
    });
    await ctx.answerCallbackQuery({
        text: ctx.t("favorites.inlineAnswerSuccess"),
    });
}
