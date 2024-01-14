import { dayjs } from "@/deps.ts";

import { UsersDataSchema } from "@/src/schemas/usersData.ts";
import { VoiceSchema } from "@/src/schemas/voice.ts";

/**
 * Returns a closure with date for using in filter to get all MAU users
 *
 * @param currentDate Current date object
 * @returns Function for using in MAU users filter
 */
export const usersStatsMAUFilter = (currentDate: Date) => {
    return ({ lastUsedAt }: UsersDataSchema) => {
        if (!lastUsedAt) return false;

        const userLastUsedDate = dayjs(lastUsedAt);
        const oneMonthAgo = dayjs(currentDate).subtract(1, "month");

        return userLastUsedDate.isAfter(oneMonthAgo);
    };
};

/**
 * Returns a closure with date for using in filter to get all inactive users
 *
 * @param currentDate Current date object
 * @returns Function for using in inactive users filter
 */
export const usersStatsInctiveFilter = (currentDate: Date) => {
    return ({ lastUsedAt }: UsersDataSchema) => {
        if (!lastUsedAt) return true;

        const userLastUsedDate = dayjs(lastUsedAt);
        const threeMonthsAgo = dayjs(currentDate).subtract(3, "month");

        return userLastUsedDate.isBefore(threeMonthsAgo);
    };
};

/**
 * Returns status for check if user hasn't used bot at all
 *
 * @param user User data object
 * @returns Status of uses amount present
 */
export const usersStatsNonUsedFilter = ({ usesAmount }: UsersDataSchema) =>
    !!usesAmount;

/**
 * Returns string with user's statistic data
 *
 * @param user User data object
 * @returns Formatted string with user's statistic
 *
 * Format: `link to user: times (last used date)`
 */
export const usersStatsMap = (
    { userID, fullName, username, usesAmount, lastUsedAt }: UsersDataSchema,
) => {
    const userLink = `<a href="tg://user?id=${userID}">${
        username ? `@${username}` : fullName
    }</a>`;
    return `- ${userLink}: ${usesAmount} раз${
        !lastUsedAt ? "" : ` (${
            new Date(lastUsedAt).toLocaleString("ru-RU", {
                timeZone: "Europe/Moscow",
            })
        })`
    }`;
};

/**
 * Returns string with voice's statistic data
 *
 * @param voice Voice data object
 * @returns Formatted string with voice's statistic
 *
 * Format: `title: times`
 */
export const voicesStatsMap = ({ title, usesAmount }: VoiceSchema) =>
    `- ${title}: ${usesAmount} раз`;

/**
 * Returns a difference of users uses amount
 * for sorting most used users
 *
 * @param a First user data object
 * @param b Second user data object
 * @returns Difference of users uses amount
 */
export const usersStatsMostUsedSort = (
    a: UsersDataSchema,
    b: UsersDataSchema,
) => b.usesAmount - a.usesAmount;

/**
 * Returns a difference of users last used time
 * for sorting last active users
 *
 * @param a First user data object
 * @param b Second user data object
 * @returns Difference of users last used time
 */
export const usersStatsLastActiveSort = (
    a: UsersDataSchema,
    b: UsersDataSchema,
) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0);

/**
 * Returns a difference of voices uses amount
 * for sorting most used voices
 *
 * @param a First voice data object
 * @param b Second voice data object
 * @returns Difference of voices uses amount
 */
export const voicesStatsMostUsedSort = (a: VoiceSchema, b: VoiceSchema) =>
    b.usesAmount - a.usesAmount;

/**
 * Returns a sum of accumulator and current voice uses amount number
 *
 * @param acc Accumulator number
 * @param curr Current voice data object
 * @returns Sum of uses amount and accumulator
 */
export const voicesStatsUsesAmountReduce = (acc: number, curr: VoiceSchema) =>
    acc += curr.usesAmount;
