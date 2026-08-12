import { InlineKeyboard } from "grammy";
import type { Context } from "#root/bot/context.js";

export function createStartKeyboard(ctx: Context) {
    const keyboard = new InlineKeyboard().switchInline(
        ctx.t("start-button"),
        "",
    );
    if (ctx.config.webAppUrl) {
        keyboard
            .row()
            .webApp(ctx.t("start-web-app-button"), ctx.config.webAppUrl);
    }
    return keyboard;
}
