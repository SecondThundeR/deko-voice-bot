import type {
    FullStats,
    FullUsersStats,
    FullVoicesStats,
} from "#drizzle/types.js";
import { convertLastUsedAtTimestamp } from "./time.ts";

function formatUserStatsLine({
    username,
    fullname,
    usesAmount,
    lastUsedAt,
}: FullUsersStats) {
    const userName = username ? `@${username}` : fullname;
    const dateString = lastUsedAt
        ? ` (${convertLastUsedAtTimestamp(lastUsedAt)})`
        : "";

    return `- ${userName}: ${usesAmount} раз${dateString}`;
}

function formatVoiceStatsLine({ voiceTitle, usesAmount }: FullVoicesStats) {
    return `- ${voiceTitle}: ${usesAmount} раз`;
}

export function getFullStatsData({
    basicStats,
    mostUsedUsersStats,
    lastUsedUsersStats,
    mostUsedVoicesStats,
}: FullStats) {
    const mostUsedUsers = mostUsedUsersStats
        .map(formatUserStatsLine)
        .join("\n");
    const mostUsedVoices = mostUsedVoicesStats
        .map(formatVoiceStatsLine)
        .join("\n");
    const lastUsedUsers = lastUsedUsersStats
        .map(formatUserStatsLine)
        .join("\n");

    return {
        ...basicStats,
        mostUsedUsers:
            mostUsedUsers.length === 0 ? "Нет информации" : mostUsedUsers,
        lastUsedUsers:
            lastUsedUsers.length === 0 ? "Нет информации" : lastUsedUsers,
        mostUsedVoices:
            mostUsedVoices.length === 0 ? "Нет информации" : mostUsedVoices,
    };
}
