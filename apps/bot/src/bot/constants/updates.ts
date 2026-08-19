import type { Update } from "grammy/types";

export const BOT_ALLOWED_UPDATES = [
    "message",
    "callback_query",
    "inline_query",
    "chosen_inline_result",
    "pre_checkout_query",
] as const satisfies ReadonlyArray<Exclude<keyof Update, "update_id">>;
