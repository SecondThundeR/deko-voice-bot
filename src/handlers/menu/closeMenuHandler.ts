import { BotContext } from "@/src/types/bot.ts";

export async function closeMenuHandler(ctx: BotContext) {
    await ctx.deleteMessage();
    ctx.session.currentFavorites = null;
    ctx.session.currentOffset = 0;
    await ctx.answerCallbackQuery();
}
