import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";

import {
    getCachedUsersStatsData,
    setCachedUsersStatsData,
} from "@/src/helpers/cache.ts";

import type { UsersDataSchema } from "@/src/schemas/usersData.ts";

const dbName = databaseNames.general;
const usersColName = collectionNames[dbName].usersData;

export async function getUsersDataStats() {
    const cachedUsersStats = getCachedUsersStatsData();
    if (cachedUsersStats) return cachedUsersStats;

    const db = client.db(dbName);
    const usersData = db.collection<UsersDataSchema>(usersColName);

    const usersStats = await usersData.find().toArray();

    setCachedUsersStatsData(usersStats);
    return usersStats;
}
