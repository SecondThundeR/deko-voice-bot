import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";
import { IgnoredUsersSchema } from "@/src/schemas/ignoredUsers.ts";
import { ignoredUsersCache } from "@/src/cache/ignoredUsers.ts";
import { ignoredUsersCacheKey } from "@/src/constants/cache.ts";

const dbName = databaseNames.deko;
const usersColName = collectionNames[dbName].ignoredUsers;

export async function getIgnoredUsersArray() {
    if (ignoredUsersCache.has(ignoredUsersCacheKey)) {
        return ignoredUsersCache.get(ignoredUsersCacheKey)!;
    }

    const db = client.database(dbName);
    const ignoredUsersCollection = db.collection<IgnoredUsersSchema>(
        usersColName,
    );
    const ignoredUsersData = await ignoredUsersCollection.find().toArray();
    const extractedIdsArray = ignoredUsersData.map((data) => data.userID);

    ignoredUsersCache.set(ignoredUsersCacheKey, extractedIdsArray);

    return extractedIdsArray;
}
