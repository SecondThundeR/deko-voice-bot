import { InlineKeyboard } from "grammy";
import { donateData } from "#root/bot/callback-data/donate.js";
import type { Context } from "#root/bot/context.js";
import { chunk } from "#root/bot/helpers/keyboard.js";

const KEYS = ["25", "50", "100", "200", "custom"];
const ROW_SIZE = 2;

export function createDonateKeyboard(ctx: Context) {
    return InlineKeyboard.from(
        chunk(
            KEYS.map((key) => ({
                text: ctx.t(`donate.key${key}`),
                callback_data: donateData.pack({
                    amount: key,
                }),
            })),
            ROW_SIZE,
        ),
    );
}
