import { InlineKeyboard } from "grammy";
import type { Context } from "#root/bot/context.js";

export function createStartKeyboard(ctx: Context) {
    return InlineKeyboard.from([
        [
            {
                text: ctx.t("start.keyboard"),
                switch_inline_query: "",
            },
        ],
    ]);
}
