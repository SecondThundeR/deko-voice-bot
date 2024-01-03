import { extractUserDetails } from "@/src/helpers/api.ts";
import { convertLastUsedAtTimestamp } from "@/src/helpers/time.ts";

import { UsersDataSchema } from "@/src/schemas/usersData.ts";

import type { BotContext } from "@/src/types/bot.ts";

type UserDataMessageDetails =
    & NonNullable<ReturnType<typeof extractUserDetails>>
    & Pick<UsersDataSchema, "usesAmount" | "lastUsedAt">;

type OptOutUserData = Omit<UsersDataSchema, "_id">;

export function getUserDataMessageText(
    ctx: BotContext,
    data: UserDataMessageDetails,
) {
    const { userID, fullName, username, usesAmount, lastUsedAt } = data;

    const userIDString = String(userID);
    const usernameText = username
        ? `- Ваше имя пользователя в Telegram: @${username}`
        : "";
    const lastUsedAtText = lastUsedAt
        ? `- Время последней отправки реплики (по МСК): ${
            convertLastUsedAtTimestamp(lastUsedAt)
        }`
        : "";

    return ctx.t("myData.dataMessage", {
        userID: userIDString,
        fullName,
        usernameText,
        usesAmount,
        lastUsedAtText,
    });
}

export function getOptOutMessageText(ctx: BotContext, data: OptOutUserData) {
    const { userID, fullName, username, usesAmount, lastUsedAt } = data;

    const userIDString = String(userID);
    const fullNameText = fullName
        ? `- Ваше полное имя в Telegram: ${fullName}`
        : "";
    const usernameText = username
        ? `- Ваше имя пользователя в Telegram: @${username}`
        : "";
    const lastUsedAtText = lastUsedAt
        ? `- Время последней отправки реплики (по МСК): ${
            convertLastUsedAtTimestamp(lastUsedAt)
        }`
        : "";

    return ctx.t("optout.success", {
        userID: userIDString,
        fullNameText,
        usernameText,
        usesAmount,
        lastUsedAtText,
    });
}
