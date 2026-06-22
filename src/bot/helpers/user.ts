import type { User } from "grammy/types";
import type { SelectUser } from "#drizzle/schema.js";

import { convertLastUsedAtTimestamp } from "./time.ts";

export function getFormattedUserData({
    userId,
    fullname,
    username,
    lastUsedAt,
    usesAmount,
}: Omit<SelectUser, "isIgnored">) {
    return {
        usesAmount: String(usesAmount),
        userId: String(userId),
        fullname: fullname ? `\n- Ваше полное имя в Telegram: ${fullname}` : "",
        username: username
            ? `\n- Ваше имя пользователя в Telegram: @${username}`
            : "",
        lastUsedAt: lastUsedAt
            ? `\n- Время последней отправки реплики (по МСК): ${convertLastUsedAtTimestamp(lastUsedAt)}`
            : "",
    };
}

export function getUserFullname(firstName: string, lastName?: string) {
    return !lastName ? firstName : `${firstName} ${lastName}`;
}

export function extractUserDetails(from: User) {
    const { id: userId, first_name, last_name, username = null } = from;
    const fullname = getUserFullname(first_name, last_name);

    return { userId, fullname, username: username ?? null };
}
