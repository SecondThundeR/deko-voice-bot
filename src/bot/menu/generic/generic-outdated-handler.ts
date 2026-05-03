import { GrammyError } from "grammy";

import type { MenuContext } from "@/bot/context";
import { isBotBlockedByUser } from "@/bot/helpers/api";
import { getUpdateInfo } from "@/bot/helpers/logging";
import { outdatedExceptionHandler } from "@/bot/helpers/menu";

type OutdatedHandlerData<T> = {
    menuElement: T | T[] | null | undefined;
};

export async function genericOutdatedHandler<T>(
    ctx: MenuContext,
    data: OutdatedHandlerData<T>,
) {
    const { menuElement } = data;

    try {
        if (!menuElement) {
            await ctx.deleteMessage();
            return ctx.callbackQuery?.answer();
        }

        await ctx.menu.update({
            immediate: true,
        });
        return ctx.callbackQuery?.answer({
            text: ctx.t("menu.outdated"),
        });
    } catch (error: unknown) {
        const isBannedByUser = await isBotBlockedByUser(ctx);
        if (isBannedByUser) {
            return ctx.callbackQuery?.answer({
                text: ctx.t("inline.blocked"),
            });
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

        ctx.logger.error({
            err: errorMessage,
            update: getUpdateInfo(ctx),
        });
        return ctx.callbackQuery?.answer();
    }
}
