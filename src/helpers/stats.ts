import { dayjs } from "@/deps.ts";

import type { UsersDataSchema } from "@/src/schemas/usersData.ts";
import type { VoiceSchema } from "@/src/schemas/voice.ts";

/**
 * Returns a closure with date for using in filter to get all MAU users
 *
 * @returns Function for using in MAU users filter
 */
export function usersStatsMAUFilter() {
    return ({ lastUsedAt }: Pick<UsersDataSchema, "lastUsedAt">) => {
        if (!lastUsedAt) return false;

        const userLastUsedDate = dayjs(lastUsedAt);
        const oneMonthAgo = dayjs().subtract(1, "month");

        return userLastUsedDate.isAfter(oneMonthAgo);
    };
}

/**
 * Returns a closure with date for using in filter to get all inactive users
 *
 * @returns Function for using in inactive users filter
 */
export function usersStatsInactiveFilter() {
    return ({ lastUsedAt }: Pick<UsersDataSchema, "lastUsedAt">) => {
        if (!lastUsedAt) return true;

        const userLastUsedDate = dayjs(lastUsedAt);
        const threeMonthsAgo = dayjs().subtract(3, "month");

        return userLastUsedDate.isBefore(threeMonthsAgo);
    };
}

/**
 * Returns status for check if user hasn't used bot at all
 *
 * @param user User data object
 * @returns Status of uses amount present
 */
export function usersStatsNonUsedFilter(
    { usesAmount }: Pick<UsersDataSchema, "usesAmount">,
) {
    return !!usesAmount;
}

/**
 * Returns string with user's statistic data
 *
 * @param user User data object
 * @returns Formatted string with user's statistic
 *
 * Format: `link to user: times (last used date)`
 */
export function usersStatsMap(
    { userID, username, fullName, usesAmount, lastUsedAt }: Omit<
        UsersDataSchema,
        "favoritesIds"
    >,
) {
    const userLink = `<a href="tg://user?id=${userID}">${
        username ? `@${username}` : fullName
    }</a>`;
    const dateString = !lastUsedAt
        ? ""
        : ` (${
            new Date(lastUsedAt).toLocaleString("ru-RU", {
                timeZone: "Europe/Moscow",
            })
        })`;

    return `- ${userLink}: ${usesAmount} раз${dateString}`;
}

/**
 * Returns string with voice's statistic data
 *
 * @param voice Voice data object
 * @returns Formatted string with voice's statistic
 *
 * Format: `title: times`
 */
export function voicesStatsMap(
    { title, usesAmount }: Pick<VoiceSchema, "title" | "usesAmount">,
) {
    return `- ${title}: ${usesAmount} раз`;
}

/**
 * Returns a difference of users uses amount
 * for sorting most used users
 *
 * @param a First user data object
 * @param b Second user data object
 * @returns Difference of users uses amount
 */
export function usersStatsMostUsedSort(
    a: UsersDataSchema,
    b: UsersDataSchema,
) {
    return b.usesAmount - a.usesAmount;
}

/**
 * Returns a difference of users last used time
 * for sorting last active users
 *
 * @param a First user data object
 * @param b Second user data object
 * @returns Difference of users last used time
 */
export function usersStatsLastActiveSort(
    a: UsersDataSchema,
    b: UsersDataSchema,
) {
    return (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0);
}

/**
 * Returns a difference of voices uses amount
 * for sorting most used voices
 *
 * @param a First voice data object
 * @param b Second voice data object
 * @returns Difference of voices uses amount
 */
export function voicesStatsMostUsedSort(
    a: VoiceSchema,
    b: VoiceSchema,
) {
    return b.usesAmount - a.usesAmount;
}

/**
 * Returns a sum of accumulator and current voice uses amount number
 *
 * @param acc Accumulator number
 * @param curr Current voice data object
 * @returns Sum of uses amount and accumulator
 */
export function voicesStatsUsesAmountReduce(acc: number, curr: VoiceSchema) {
    return acc += curr.usesAmount;
}
