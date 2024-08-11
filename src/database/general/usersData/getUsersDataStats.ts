import { client } from "@/bot";

import { COLLECTION_NAMES, DATABASE_NAMES } from "@/src/constants/database";

import {
    getCachedUsersStatsData,
    setCachedUsersStatsData,
} from "@/src/helpers/cache";

import type { UsersDataSchema } from "@/src/schemas/usersData";

const dbName = DATABASE_NAMES.general;
const usersColName = COLLECTION_NAMES[dbName].usersData;

export async function getUsersDataStats() {
    const cachedUsersStats = getCachedUsersStatsData();
    if (cachedUsersStats) return cachedUsersStats;

    const db = client.db(dbName);
    const usersData = db.collection<UsersDataSchema>(usersColName);

    const usersStats = await usersData.find().toArray();

    setCachedUsersStatsData(usersStats);
    return usersStats;
}
