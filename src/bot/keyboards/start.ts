import { InlineKeyboard } from "grammy";
import type { Context } from "@/bot/context";

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
