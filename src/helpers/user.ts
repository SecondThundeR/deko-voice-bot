import type { User } from "grammy/types";

import type { SelectUser } from "@/drizzle/schema";

import { convertLastUsedAtTimestamp } from "@/src/helpers/time";

export function getFormattedUserData(data: Omit<SelectUser, "isIgnored">) {
    const { userId, fullname, username, lastUsedAt, usesAmount } = data;

    return {
        usesAmount: usesAmount ?? 0,
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

export function extractUserDetails(from?: User) {
    if (!from) return null;

    const { id: userId, first_name, last_name, username } = from;
    const fullname = getUserFullname(first_name, last_name);

    return { userId, fullname, username: username ?? null };
}
