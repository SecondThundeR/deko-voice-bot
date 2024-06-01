import { getUsersDataStats } from "@/src/database/general/usersData/getUsersDataStats.ts";
import { getVoicesStats } from "@/src/database/general/voices/getVoicesStats.ts";

import { extractUserDetails } from "@/src/helpers/api.ts";
import { convertLastUsedAtTimestamp } from "@/src/helpers/time.ts";
import {
    usersStatsInactiveFilter,
    usersStatsLastActiveSort,
    usersStatsMap,
    usersStatsMAUFilter,
    usersStatsMostUsedSort,
    usersStatsNonUsedFilter,
    voicesStatsMap,
    voicesStatsMostUsedSort,
    voicesStatsUsesAmountReduce,
} from "@/src/helpers/stats.ts";

import type { UsersDataSchema } from "@/src/schemas/usersData.ts";

import type { BotContext } from "@/src/types/bot.ts";

type UserDataMessageDetails =
    & NonNullable<ReturnType<typeof extractUserDetails>>
    & Pick<UsersDataSchema, "usesAmount" | "lastUsedAt">;

type OptOutUserData = Omit<UsersDataSchema, "_id">;

/**
 * Returns regular stats data as formatted text
 * with locale for using in messages
 *
 * @param ctx Current context object
 * @returns Formatted locale text for sending in messages
 */
export async function getStatsMessageText(ctx: BotContext) {
    const usersStats = await getUsersDataStats();
    const voicesStats = await getVoicesStats();

    const allUsedUsers = usersStats?.length ?? 0;
    const allMAUUsers = usersStats
        ?.filter(usersStatsMAUFilter()).length ?? 0;
    const allInactiveUsers = usersStats
        ?.filter(usersStatsInactiveFilter()).length ?? 0;
    const allUsedVoices = voicesStats
        .reduce(voicesStatsUsesAmountReduce, 0);

    return ctx.t("stats.regular", {
        allUsedUsers,
        allMAUUsers,
        allInactiveUsers,
        allUsedVoices,
    });
}

/**
 * Returns extended stats data as formatted text
 * with locale for using in messages
 *
 * @param ctx Current context object
 * @returns Formatted locale text for sending in messages
 */
export async function getFullStatsMessageText(ctx: BotContext) {
    const usersStats = await getUsersDataStats();
    const voicesStats = await getVoicesStats();

    const allUsedUsers = usersStats?.length ?? 0;
    const allMAUUsers = usersStats
        ?.filter(usersStatsMAUFilter()).length ?? 0;
    const allInactiveUsers = usersStats
        ?.filter(usersStatsInactiveFilter()).length ?? 0;
    const mostUsedUsers = usersStats
        .sort(usersStatsMostUsedSort)
        .slice(0, 5)
        .map(usersStatsMap)
        .join("\n");
    const lastUsedUsers = usersStats
        .filter(usersStatsNonUsedFilter)
        .sort(usersStatsLastActiveSort)
        .slice(0, 5)
        .map(usersStatsMap)
        .join("\n");
    const allUsedVoices = voicesStats
        .reduce(voicesStatsUsesAmountReduce, 0);
    const mostUsedVoices = voicesStats
        .sort(voicesStatsMostUsedSort)
        .slice(0, 5)
        .map(voicesStatsMap)
        .join("\n");

    return ctx.t("stats.full", {
        allUsedUsers,
        allMAUUsers,
        allInactiveUsers,
        mostUsedUsers: mostUsedUsers.length === 0
            ? "Нет информации"
            : mostUsedUsers,
        lastUsedUsers: lastUsedUsers.length === 0
            ? "Нет информации"
            : lastUsedUsers,
        allUsedVoices,
        mostUsedVoices: mostUsedVoices.length === 0
            ? "Нет информации"
            : mostUsedVoices,
    });
}

/**
 * Returns user's data as formatted text with locale
 * for using in messages
 *
 * @param ctx Current context object
 * @param data User data object
 * @returns Formatted locale text for sending in messages
 */
export function getUserDataMessageText(
    ctx: BotContext,
    data: UserDataMessageDetails,
) {
    const { userID, fullName, username, usesAmount, lastUsedAt } = data;
    const userIDString = String(userID);
    const usernameText = username
        ? `\n- Ваше имя пользователя в Telegram: @${username}`
        : "";
    const lastUsedAtText = lastUsedAt
        ? `\n- Время последней отправки реплики (по МСК): ${
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

/**
 * Returns opt out user's data as formatted text
 * with locale for using in messages
 *
 * @param ctx Current context object
 * @param data Opt out user data object
 * @returns Formatted locale text for sending in messages
 */
export function getOptOutMessageText(ctx: BotContext, data: OptOutUserData) {
    const { userID, fullName, username, usesAmount, lastUsedAt } = data;
    const userIDString = String(userID);
    const fullNameText = fullName
        ? `\n- Ваше полное имя в Telegram: ${fullName}`
        : "";
    const usernameText = username
        ? `\n- Ваше имя пользователя в Telegram: @${username}`
        : "";
    const lastUsedAtText = lastUsedAt
        ? `\n- Время последней отправки реплики (по МСК): ${
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
