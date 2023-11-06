import { MenuBotContext } from "@/src/types/bot.ts";
import { locale } from "@/src/constants/locale.ts";

const { outdated } = locale.frontend.menu;

export async function outdatedHandler(ctx: MenuBotContext) {
    await ctx.answerCallbackQuery(outdated);
    if (!ctx.session.currentFavorites) {
        return await ctx.deleteMessage();
    }
    ctx.menu.update();
}
