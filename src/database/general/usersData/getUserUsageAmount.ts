import { client } from "@/bot";

import { userUsageCache } from "@/src/cache/userUsage";

import { COLLECTION_NAMES, DATABASE_NAMES } from "@/src/constants/database";

import type { UsersDataSchema } from "@/src/schemas/usersData";

const dbName = DATABASE_NAMES.general;
const usersColName = COLLECTION_NAMES[dbName].usersData;

export async function getUserUsageAmount(userID: number) {
    if (userUsageCache.has(userID)) {
        return userUsageCache.get(userID)!;
    }

    const db = client.db(dbName);
    const usersData = db.collection<UsersDataSchema>(usersColName);
    const data = await usersData.find({ userID }).toArray();
    const dataUsage = data.length === 0 ? 0 : data[0].usesAmount;

    userUsageCache.set(userID, dataUsage);

    return dataUsage;
}
