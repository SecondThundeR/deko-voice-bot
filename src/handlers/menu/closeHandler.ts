import { BotContext } from "@/src/types/bot.ts";

export async function closeMenuHandler(ctx: BotContext) {
    await ctx.answerCallbackQuery();
    ctx.session.currentFavorites = null;
    ctx.session.currentOffset = 0;
    await ctx.deleteMessage();
}
