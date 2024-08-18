import dayjs from "dayjs";

import type {
    BasicUsersStats,
    FullUsersStats,
    BasicVoicesStats,
    FullVoicesStats,
} from "@/drizzle/types";

function usersStatsMAUFilter({ lastUsedAt }: BasicUsersStats) {
    if (!lastUsedAt) return false;

    const userLastUsedDate = dayjs(lastUsedAt);
    const oneMonthAgo = dayjs().subtract(1, "month");

    return userLastUsedDate.isAfter(oneMonthAgo);
}

function usersStatsInactiveFilter({ lastUsedAt }: BasicUsersStats) {
    if (!lastUsedAt) return true;

    const userLastUsedDate = dayjs(lastUsedAt);
    const threeMonthsAgo = dayjs().subtract(3, "month");

    return userLastUsedDate.isBefore(threeMonthsAgo);
}

function usersStatsMap({
    username,
    fullname,
    usesAmount,
    lastUsedAt,
}: FullUsersStats) {
    const userName = username ? `@${username}` : fullname;
    const dateString = lastUsedAt
        ? ` (${new Date(lastUsedAt).toLocaleString("ru-RU", {
              timeZone: "Europe/Moscow",
          })})`
        : "";

    return `- ${userName}: ${usesAmount} раз${dateString}`;
}

function voicesStatsMap({ voiceTitle, usesAmount }: FullVoicesStats) {
    return `- ${voiceTitle}: ${usesAmount} раз`;
}

function voicesStatsUsesAmountReduce(
    acc: number,
    { usesAmount }: BasicVoicesStats,
) {
    acc += usesAmount;
    return acc;
}

export function getBasicStatsData(
    usersStats: BasicUsersStats[],
    voicesStats: BasicVoicesStats[],
) {
    return {
        allUsedUsers: usersStats.length,
        allMAUUsers: usersStats.filter(usersStatsMAUFilter).length,
        allInactiveUsers: usersStats.filter(usersStatsInactiveFilter).length,
        allUsedVoices: voicesStats.reduce(voicesStatsUsesAmountReduce, 0),
    };
}

export function getFullStatsData(
    usersStats: FullUsersStats[],
    voicesStats: FullVoicesStats[],
) {
    const mostUsedUsers = usersStats
        .sort((a, b) => (b.usesAmount ?? 0) - (a.usesAmount ?? 0))
        .slice(0, 5)
        .map(usersStatsMap)
        .join("\n");
    const mostUsedVoices = voicesStats
        .sort((a, b) => b.usesAmount - a.usesAmount)
        .slice(0, 5)
        .map(voicesStatsMap)
        .join("\n");
    const lastUsedUsers = usersStats
        .filter(({ usesAmount }) => !!usesAmount)
        .sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))
        .slice(0, 5)
        .map(usersStatsMap)
        .join("\n");

    return {
        ...getBasicStatsData(usersStats, voicesStats),
        mostUsedUsers:
            mostUsedUsers.length === 0 ? "Нет информации" : mostUsedUsers,
        lastUsedUsers:
            lastUsedUsers.length === 0 ? "Нет информации" : lastUsedUsers,
        mostUsedVoices:
            mostUsedVoices.length === 0 ? "Нет информации" : mostUsedVoices,
    };
}
