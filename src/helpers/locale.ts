import { getUsersDataStats } from "@/src/database/general/usersData/getUsersDataStats";
import { getVoicesStats } from "@/src/database/general/voices/getVoicesStats";

import { extractUserDetails } from "@/src/helpers/api";
import { convertLastUsedAtTimestamp } from "@/src/helpers/time";
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
} from "@/src/helpers/stats";

import type { UsersDataSchema } from "@/src/schemas/usersData";
import type { VoiceSchema } from "@/src/schemas/voice";

import type { BotContext } from "@/src/types/bot";

type UserDataMessageDetails = NonNullable<
    ReturnType<typeof extractUserDetails>
> &
    Pick<UsersDataSchema, "usesAmount" | "lastUsedAt">;

type OptOutUserData = Omit<UsersDataSchema, "_id">;

/**
 * Returns basic stats data (all used users/voices, all MAU/inactive users)
 *
 * @param usersStats Array of users stats
 * @param voicesStats Array of voices stats
 * @returns Object with basic stats data
 */
function getBasicStatsData(
    usersStats: UsersDataSchema[],
    voicesStats: VoiceSchema[],
) {
    return {
        allUsedUsers: usersStats.length,
        allMAUUsers: usersStats.filter(usersStatsMAUFilter()).length,
        allInactiveUsers: usersStats.filter(usersStatsInactiveFilter()).length,
        allUsedVoices: voicesStats.reduce(voicesStatsUsesAmountReduce, 0),
    };
}

/**
 * Returns full stats data including basic data
 * (all used users/voices, all MAU/inactive users, most used users/voices,
 * last used users)
 *
 * @param usersStats Array of users stats
 * @param voicesStats Array of voices stats
 * @returns Object with full stats data
 */
function getFullStatsData(
    usersStats: UsersDataSchema[],
    voicesStats: VoiceSchema[],
) {
    return {
        ...getBasicStatsData(usersStats, voicesStats),
        mostUsedUsers: usersStats
            .sort(usersStatsMostUsedSort)
            .slice(0, 5)
            .map(usersStatsMap)
            .join("\n"),
        mostUsedVoices: voicesStats
            .sort(voicesStatsMostUsedSort)
            .slice(0, 5)
            .map(voicesStatsMap)
            .join("\n"),
        lastUsedUsers: usersStats
            .filter(usersStatsNonUsedFilter)
            .sort(usersStatsLastActiveSort)
            .slice(0, 5)
            .map(usersStatsMap)
            .join("\n"),
    };
}

/**
 * Returns regular stats data as formatted text
 * with locale for using in messages
 *
 * @param ctx Current context object
 * @returns Formatted locale text for sending in messages
 */
export async function getStatsMessageText(ctx: BotContext) {
    const { isCachingDisabled } = ctx.config;
    const cacheQuoteText = isCachingDisabled
        ? ""
        : `\n${ctx.t("stats.cacheQuote")}`;
    const usersStats = await getUsersDataStats();
    const voicesStats = await getVoicesStats();
    const { allUsedUsers, allMAUUsers, allInactiveUsers, allUsedVoices } =
        getBasicStatsData(usersStats, voicesStats);

    return `${ctx.t("stats.regular", {
        allUsedUsers,
        allMAUUsers,
        allInactiveUsers,
        allUsedVoices,
    })}${cacheQuoteText}`;
}

/**
 * Returns extended stats data as formatted text
 * with locale for using in messages
 *
 * @param ctx Current context object
 * @returns Formatted locale text for sending in messages
 */
export async function getFullStatsMessageText(ctx: BotContext) {
    const { isCachingDisabled } = ctx.config;
    const cacheQuoteText = isCachingDisabled
        ? ""
        : `\n${ctx.t("stats.cacheQuote")}`;
    const usersStats = await getUsersDataStats();
    const voicesStats = await getVoicesStats();
    const {
        allUsedUsers,
        allMAUUsers,
        allInactiveUsers,
        allUsedVoices,
        mostUsedUsers,
        mostUsedVoices,
        lastUsedUsers,
    } = getFullStatsData(usersStats, voicesStats);

    return `${ctx.t("stats.full", {
        allUsedUsers,
        allMAUUsers,
        allInactiveUsers,
        mostUsedUsers:
            mostUsedUsers.length === 0 ? "Нет информации" : mostUsedUsers,
        lastUsedUsers:
            lastUsedUsers.length === 0 ? "Нет информации" : lastUsedUsers,
        allUsedVoices,
        mostUsedVoices:
            mostUsedVoices.length === 0 ? "Нет информации" : mostUsedVoices,
    })}${cacheQuoteText}`;
}

/**
 * Returns formatted strings with user data
 *
 * @param data User data from myData or optOut command
 * @returns Object with formatted data
 */
function getFormattedUserData(data: UserDataMessageDetails | OptOutUserData) {
    const { userID, fullName, username, lastUsedAt } = data;
    const userIDString = String(userID);
    const lastUsedAtString = lastUsedAt
        ? convertLastUsedAtTimestamp(lastUsedAt)
        : "";

    return {
        userIDString,
        fullNameText: fullName
            ? `\n- Ваше полное имя в Telegram: ${fullName}`
            : "",
        usernameText: username
            ? `\n- Ваше имя пользователя в Telegram: @${username}`
            : "",
        lastUsedAtText: lastUsedAt
            ? `\n- Время последней отправки реплики (по МСК): ${lastUsedAtString}`
            : "",
    };
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
    const { usesAmount } = data;
    const { userIDString, fullNameText, usernameText, lastUsedAtText } =
        getFormattedUserData(data);

    return ctx.t("myData.dataMessage", {
        userID: userIDString,
        fullNameText,
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
    const { usesAmount } = data;
    const { userIDString, fullNameText, usernameText, lastUsedAtText } =
        getFormattedUserData(data);

    return ctx.t("optout.success", {
        userID: userIDString,
        fullNameText,
        usernameText,
        usesAmount,
        lastUsedAtText,
    });
}
