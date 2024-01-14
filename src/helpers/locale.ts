import { getUsersDataStats } from "@/src/database/general/usersData/getUsersDataStats.ts";
import { getVoicesStats } from "@/src/database/general/voices/getVoicesStats.ts";

import { extractUserDetails } from "@/src/helpers/api.ts";
import { convertLastUsedAtTimestamp } from "@/src/helpers/time.ts";
import {
    usersStatsInctiveFilter,
    usersStatsLastActiveSort,
    usersStatsMap,
    usersStatsMAUFilter,
    usersStatsMostUsedSort,
    usersStatsNonUsedFilter,
    voicesStatsMap,
    voicesStatsMostUsedSort,
    voicesStatsUsesAmountReduce,
} from "@/src/helpers/stats.ts";

import { UsersDataSchema } from "@/src/schemas/usersData.ts";

import type { BotContext } from "@/src/types/bot.ts";

type UserDataMessageDetails =
    & NonNullable<ReturnType<typeof extractUserDetails>>
    & Pick<UsersDataSchema, "usesAmount" | "lastUsedAt">;

type OptOutUserData = Omit<UsersDataSchema, "_id">;

export async function getStatsMessageText(ctx: BotContext) {
    const currentDate = new Date();

    const usersStats = await getUsersDataStats();
    const voicesStats = await getVoicesStats();

    const allUsedUsers = usersStats?.length ?? 0;
    const allMAUUsers = usersStats
        ?.filter(usersStatsMAUFilter(currentDate)).length ?? 0;
    const allInactiveUsers = usersStats
        ?.filter(usersStatsInctiveFilter(currentDate)).length ?? 0;

    const allUsedVoices = voicesStats
        .reduce(voicesStatsUsesAmountReduce, 0);

    return ctx.t("stats.regular", {
        allUsedUsers,
        allMAUUsers,
        allInactiveUsers,
        allUsedVoices,
    });
}

export async function getFullStatsMessageText(ctx: BotContext) {
    const currentDate = new Date();

    const usersStats = await getUsersDataStats();
    const voicesStats = await getVoicesStats();

    const allUsedUsers = usersStats?.length ?? 0;
    const allMAUUsers = usersStats
        ?.filter(usersStatsMAUFilter(currentDate)).length ?? 0;
    const allInactiveUsers = usersStats
        ?.filter(usersStatsInctiveFilter(currentDate)).length ?? 0;
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
        mostUsedUsers,
        lastUsedUsers,
        allUsedVoices,
        mostUsedVoices,
    });
}

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
