import { InlineKeyboard } from "grammy";
import type { Context } from "#root/bot/context.js";

export function createSelectVoiceKeyboard(ctx: Context) {
    return InlineKeyboard.from([
        [
            {
                text: ctx.t("voices-select-button"),
                switch_inline_query_current_chat: "",
            },
        ],
    ]);
}
