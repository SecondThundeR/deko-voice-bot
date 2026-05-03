import { deleteUserFavoriteQuery } from "drizzle/prepared/users-favorites";
import { addUserFavorite } from "drizzle/queries/insert";
import type { MenuContext } from "@/bot/context";
import type { FavoriteItem } from "@/bot/types/favorite-item";

export async function favoriteItemHandler(
    ctx: MenuContext,
    favorite: FavoriteItem,
) {
    const userId = ctx.from?.id;
    if (!userId) {
        return ctx.answerCallbackQuery({
            text: ctx.t("favorites.inlineAnswerFail"),
        });
    }

    const newFavoriteStatus = !favorite.isFavored;

    if (newFavoriteStatus) {
        await addUserFavorite({ userId, voiceId: favorite.id });
    } else {
        await deleteUserFavoriteQuery.execute({ userId, voiceId: favorite.id });
    }

    await ctx.menu.update({
        immediate: true,
    });
    return ctx.answerCallbackQuery({
        text: ctx.t("favorites.inlineAnswerSuccess"),
    });
}
