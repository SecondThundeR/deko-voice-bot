import { dayjs } from "@/deps.ts";

import { UsersDataSchema } from "@/src/schemas/usersData.ts";
import { VoiceSchema } from "@/src/schemas/voice.ts";

export const usersStatsMAUFilter = (currentDate: Date) => {
    return ({ lastUsedAt }: UsersDataSchema) => {
        if (!lastUsedAt) return false;

        const userLastUsedDate = dayjs(lastUsedAt);
        const oneMonthAgo = dayjs(currentDate).subtract(1, "month");

        return userLastUsedDate.isAfter(oneMonthAgo);
    };
};

export const usersStatsInctiveFilter = (currentDate: Date) => {
    return ({ lastUsedAt }: UsersDataSchema) => {
        if (!lastUsedAt) return true;

        const userLastUsedDate = dayjs(lastUsedAt);
        const threeMonthsAgo = dayjs(currentDate).subtract(3, "month");

        return userLastUsedDate.isAfter(threeMonthsAgo);
    };
};

export const usersStatsNonUsedFilter = ({ usesAmount }: UsersDataSchema) =>
    !!usesAmount;

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

export const voicesStatsMap = ({ title, usesAmount }: VoiceSchema) =>
    `- ${title}: ${usesAmount} раз`;

export const usersStatsMostUsedSort = (
    a: UsersDataSchema,
    b: UsersDataSchema,
) => b.usesAmount - a.usesAmount;

export const usersStatsLastActiveSort = (
    a: UsersDataSchema,
    b: UsersDataSchema,
) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0);

export const voicesStatsMostUsedSort = (a: VoiceSchema, b: VoiceSchema) =>
    b.usesAmount - a.usesAmount;

export const voicesStatsUsesAmountReduce = (acc: number, curr: VoiceSchema) =>
    acc += curr.usesAmount;
