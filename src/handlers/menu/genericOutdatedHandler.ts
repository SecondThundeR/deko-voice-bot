import { GrammyError } from "grammy";

import { isBotBlockedByUser } from "@/src/helpers/api";
import { outdatedExceptionHandler } from "@/src/helpers/menu";

import type { MenuBotContext } from "@/src/types/bot";

type OutdatedHandlerData<T> = {
    menuElement: T | T[] | null | undefined;
};

export async function genericOutdatedHandler<T>(
    ctx: MenuBotContext,
    data: OutdatedHandlerData<T>,
) {
    const { menuElement } = data;

    try {
        if (!menuElement) {
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
            return await ctx.answerCallbackQuery(ctx.t("inline.blocked"));
        }

        if (!(error instanceof GrammyError)) {
            await outdatedExceptionHandler(ctx);
        }

        let errorMessage = "Something prevented from updating menu. Details: ";

        if (error instanceof Error) {
            errorMessage += error.message;
        } else {
            errorMessage += JSON.stringify(error, null, 4);
        }

        console.error(errorMessage);
        await ctx.answerCallbackQuery();
    }
}
