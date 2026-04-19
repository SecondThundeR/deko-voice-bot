import { GrammyError } from "grammy";

import type { MenuContext } from "../../context";
import { isBotBlockedByUser } from "../../helpers/api";
import { getUpdateInfo } from "../../helpers/logging";
import { outdatedExceptionHandler } from "../../helpers/menu";

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
            await ctx.callbackQuery?.answer();
            return;
        }

        await ctx.menu.update({
            immediate: true,
        });
        await ctx.callbackQuery?.answer({
            text: ctx.t("menu.outdated"),
        });
    } catch (error: unknown) {
        const isBannedByUser = await isBotBlockedByUser(ctx);
        if (isBannedByUser) {
            return await ctx.callbackQuery?.answer({
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
        await ctx.callbackQuery?.answer();
    }
}
