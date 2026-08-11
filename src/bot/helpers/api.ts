import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { I18nFlavor } from "@grammyjs/i18n";
import type { Context } from "grammy";

const POSITIVE_INTEGER = /^[1-9]\d*$/;

export function parseDonationAmount(value: string) {
    if (!POSITIVE_INTEGER.test(value)) {
        return null;
    }

    const amount = Number(value);
    return Number.isSafeInteger(amount) ? amount : null;
}

export async function isBotBlockedByUser(ctx: Context) {
    try {
        await ctx.replyWithChatAction("find_location");
        return false;
    } catch {
        return true;
    }
}

export async function downloadTelegramFileToPath(
    filePath: string,
    outputPath: string,
    token: string,
    maxBytes?: number,
) {
    const file = await fetch(
        `https://api.telegram.org/file/bot${token}/${filePath}`,
    );

    if (!file.ok || !file.body) {
        return false;
    }

    try {
        let bytesDownloaded = 0;
        const sizeLimiter = new Transform({
            transform(chunk: Buffer, _encoding, callback) {
                bytesDownloaded += chunk.length;
                if (maxBytes !== undefined && bytesDownloaded > maxBytes) {
                    callback(new Error("Telegram file exceeds the size limit"));
                    return;
                }
                callback(null, chunk);
            },
        });

        await pipeline(
            Readable.fromWeb(file.body),
            sizeLimiter,
            createWriteStream(outputPath, { mode: 0o600 }),
        );
        return true;
    } catch (error) {
        unlink(outputPath).catch(() => {});
        throw error;
    }
}

export async function sendDonationInvoice(
    ctx: Context & I18nFlavor,
    amount: number,
) {
    if (amount < 1) {
        return ctx.reply(ctx.t("donate-amount-too-small"));
    }

    const donationId = `donation-${ctx.from?.id}-${Date.now()}`;

    try {
        return ctx.replyWithInvoice(
            ctx.t("donate-invoice-title"),
            ctx.t("donate-invoice-description", { amount }),
            donationId,
            "XTR",
            [{ label: ctx.t("donate-invoice-label"), amount }],
        );
    } catch {
        return ctx.reply(ctx.t("donate-error"), {
            parse_mode: "HTML",
        });
    }
}
