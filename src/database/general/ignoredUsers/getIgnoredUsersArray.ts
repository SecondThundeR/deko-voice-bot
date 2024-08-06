import { client } from "@/bot";

import { ignoredUsersCache } from "@/src/cache/ignoredUsers";

import { ignoredUsersCacheKey } from "@/src/constants/cache";
import { collectionNames, databaseNames } from "@/src/constants/database";

import type { IgnoredUsersSchema } from "@/src/schemas/ignoredUsers";

const dbName = databaseNames.general;
const usersColName = collectionNames[dbName].ignoredUsers;

export async function getIgnoredUsersArray() {
    if (ignoredUsersCache.has(ignoredUsersCacheKey)) {
        return ignoredUsersCache.get(ignoredUsersCacheKey)!;
    }

    const db = client.db(dbName);
    const ignoredUsersCollection =
        db.collection<IgnoredUsersSchema>(usersColName);
    const ignoredUsersData = await ignoredUsersCollection.find().toArray();
    const extractedIdsArray = ignoredUsersData.map((data) => data.userID);

    ignoredUsersCache.set(ignoredUsersCacheKey, extractedIdsArray);

    return extractedIdsArray;
}
