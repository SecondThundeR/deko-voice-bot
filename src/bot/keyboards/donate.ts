import { InlineKeyboard } from "grammy";
import { donateData } from "@/bot/callback-data/donate";
import type { Context } from "@/bot/context";
import { chunk } from "@/bot/helpers/keyboard";

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
