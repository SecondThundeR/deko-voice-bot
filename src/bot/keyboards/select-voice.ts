import { InlineKeyboard } from "grammy";
import type { Context } from "../context";

export function createSelectVoiceKeyboard(ctx: Context) {
    return InlineKeyboard.from([
        [
            {
                text: ctx.t("voices.keyboard"),
                switch_inline_query_current_chat: "",
            },
        ],
    ]);
}
