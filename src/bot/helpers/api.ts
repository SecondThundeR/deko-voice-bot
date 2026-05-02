import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { I18nFlavor } from "@grammyjs/i18n";
import type { Context } from "grammy";

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
) {
    const file = await fetch(
        `https://api.telegram.org/file/bot${token}/${filePath}`,
    );

    if (!file.ok || !file.body) {
        return false;
    }

    try {
        await pipeline(
            Readable.fromWeb(file.body),
            createWriteStream(outputPath),
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
        return ctx.reply(ctx.t("donate.negative"));
    }

    const donationId = `donation-${ctx.from?.id}-${Date.now()}`;

    try {
        return ctx.replyWithInvoice(
            ctx.t("donate.title"),
            ctx.t("donate.message", { amount: String(amount) }),
            donationId,
            "XTR",
            [{ label: ctx.t("donate.label"), amount }],
        );
    } catch {
        return ctx.reply(ctx.t("donate.error"), {
            parse_mode: "HTML",
        });
    }
}
