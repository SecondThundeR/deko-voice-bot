import type { I18nFlavor } from "@grammyjs/i18n";
import type { Context } from "grammy";

export async function isBotBlockedByUser(ctx: Context) {
    try {
        await ctx.replyWithChatAction("find_location");
        return false;
    } catch (_error: unknown) {
        return true;
    }
}

export async function fetchMediaFileData({
    filePath,
    token,
}: {
    filePath: string;
    token: string;
}): Promise<unknown>;
export async function fetchMediaFileData({
    filePath,
    token,
    returnType,
}: {
    filePath: string;
    token: string;
    returnType?: "blob";
}): Promise<Blob>;
export async function fetchMediaFileData({
    filePath,
    token,
    returnType,
}: {
    filePath: string;
    token: string;
    returnType?: "json";
}): Promise<unknown>;
export async function fetchMediaFileData({
    filePath,
    token,
    returnType = "json",
}: {
    filePath: string;
    token: string;
    returnType?: "blob" | "json";
}) {
    const file = await fetch(
        `https://api.telegram.org/file/bot${token}/${filePath}`,
    );

    if (returnType === "json") {
        return await file.json();
    }

    return await file.blob();
}

export async function sendDonationInvoice(
    ctx: Context & I18nFlavor,
    amount: number,
) {
    if (amount < 1) {
        await ctx.reply(ctx.t("donate.negative"));
        return;
    }

    try {
        await ctx.replyWithInvoice(
            ctx.t("donate.title"),
            ctx.t("donate.message", { amount: String(amount) }),
            `donation-${ctx.from?.id}-${Date.now()}`,
            "XTR",
            [{ label: ctx.t("donate.label"), amount }],
        );
    } catch {
        await ctx.reply(ctx.t("donate.error"), {
            parse_mode: "HTML",
        });
    }
}
