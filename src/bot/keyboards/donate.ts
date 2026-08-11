import { InlineKeyboard } from "grammy";
import { donateData } from "#root/bot/callback-data/donate.js";
import type { Context } from "#root/bot/context.js";
import { chunk } from "#root/bot/helpers/keyboard.js";

const KEYS = [
    ["25", "donate-25-button"],
    ["50", "donate-50-button"],
    ["100", "donate-100-button"],
    ["200", "donate-200-button"],
    ["custom", "donate-custom-button"],
] as const;
const ROW_SIZE = 2;

export function createDonateKeyboard(ctx: Context) {
    return InlineKeyboard.from(
        chunk(
            KEYS.map(([amount, messageId]) => ({
                text: ctx.t(messageId),
                callback_data: donateData.pack({
                    amount,
                }),
            })),
            ROW_SIZE,
        ),
    );
}
