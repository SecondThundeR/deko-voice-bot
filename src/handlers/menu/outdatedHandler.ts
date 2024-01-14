import { GrammyError } from "@/deps.ts";

import { isBotBlockedByUser } from "@/src/helpers/api.ts";
import { outdatedExceptionHandler } from "@/src/helpers/menu.ts";

import type { MenuBotContext } from "@/src/types/bot.ts";

export async function outdatedHandler(ctx: MenuBotContext) {
    try {
        if (!ctx.session.currentFavorites) {
            await ctx.deleteMessage();
            await ctx.answerCallbackQuery();
            return;
        }

        await ctx.menu.update({
            immediate: true,
        });
        await ctx.answerCallbackQuery(ctx.t("menu.outdated"));
    } catch (error: unknown) {
        const isBannedByUser = await isBotBlockedByUser(ctx);
        if (isBannedByUser) {
            return void await ctx.answerCallbackQuery(ctx.t("inline.blocked"));
        }

        console.error(
            "Something prevented from updating menu:",
            (error as Error).message,
        );

        if (!(error instanceof GrammyError)) {
            await outdatedExceptionHandler(ctx);
        }

        await ctx.answerCallbackQuery();
    }
}
