import { GrammyError } from "grammy";

import type { MenuContext } from "#root/bot/context.js";
import { isBotBlockedByUser } from "#root/bot/helpers/api.js";
import { outdatedExceptionHandler } from "#root/bot/helpers/menu.js";
import { getSafeErrorInfo } from "#root/logging.js";

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
            await ctx.deleteMessage().catch(() => {});
            return ctx.callbackQuery?.answer();
        }

        await ctx.menu.update({
            immediate: true,
        });
        return ctx.callbackQuery?.answer({
            text: ctx.t("menu-outdated"),
        });
    } catch (error: unknown) {
        const isBannedByUser = await isBotBlockedByUser(ctx);
        if (isBannedByUser) {
            return ctx.callbackQuery?.answer({
                text: ctx.t("inline-bot-blocked"),
            });
        }

        if (!(error instanceof GrammyError)) {
            await outdatedExceptionHandler(ctx);
        }

        ctx.logger.error({
            msg: "Failed to update menu",
            ...getSafeErrorInfo(error),
        });
        return ctx.callbackQuery?.answer();
    }
}
