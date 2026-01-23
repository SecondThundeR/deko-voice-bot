import type { Api, Context } from "grammy";
import type { Message } from "grammy/types";

import { ADMIN_COMMANDS } from "@/src/constants/adminCommands";
import { BASE_LINK_URL } from "@/src/constants/general";
import { USER_COMMANDS } from "@/src/constants/userCommands";

import type { BotContext } from "@/src/types/bot";

export async function registerUserCommands(api: Api) {
    await api.setMyCommands(USER_COMMANDS, {
        scope: {
            type: "all_private_chats",
        },
    });
}

export async function registerAdminCommands(api: Api, adminIds: string) {
    if (!adminIds) return;

    const parsedIds = adminIds.split(" ").map(Number)

    // Since there are won't be a lot of admins
    // this implementation should work fine (i guess :p)
    for (const adminId of parsedIds) {
        await api.setMyCommands(ADMIN_COMMANDS, {
            scope: {
                type: "chat",
                chat_id: adminId,
            },
        });
    }
}

export async function isBotBlockedByUser(ctx: Context) {
    try {
        await ctx.replyWithChatAction("find_location");
        return false;
    } catch (_error: unknown) {
        return true;
    }
}

export function getSessionKey(ctx: Context) {
    return ctx.from?.id.toString() || ctx.chat?.id.toString();
}

export async function fetchMediaFileData({
    filePath,
    token,
    returnType = "json",
}: {
    filePath: string;
    token: string;
    /**
     * By default, `json` will be used
     */
    returnType?: "blob" | "json";
}) {
    const file = await fetch(`${BASE_LINK_URL}${token}/${filePath}`);

    if (returnType === "json") {
        return await file.json();
    }

    return await file.blob();
}

export function getMessageEditCallback(ctx: BotContext, message: Message) {
    return async (
        text: string,
        other?: Parameters<Api["editMessageText"]>[3],
    ) =>
        await ctx.api.editMessageText(
            message.chat.id,
            message.message_id,
            text,
            other,
        );
}

export async function sendDonationInvoice(ctx: BotContext, amount: number) {
    if (amount < 1) {
        await ctx.reply(ctx.t("donate.negative"));
        return;
    }

    await ctx.replyWithInvoice(
        ctx.t("donate.title"),
        ctx.t("donate.message", { amount: String(amount) }),
        `donation-${ctx.from?.id}-${Date.now()}`,
        "XTR",
        [{ label: ctx.t("donate.label"), amount }],
    );
}
