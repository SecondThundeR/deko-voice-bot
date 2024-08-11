import { client } from "@/bot";

import { ignoredUsersCache } from "@/src/cache/ignoredUsers";

import { IGNORED_USERS_CACHE_KEY } from "@/src/constants/cache";
import { COLLECTION_NAMES, DATABASE_NAMES } from "@/src/constants/database";

import type { IgnoredUsersSchema } from "@/src/schemas/ignoredUsers";

const dbName = DATABASE_NAMES.general;
const usersColName = COLLECTION_NAMES[dbName].ignoredUsers;

export async function getIgnoredUsersArray() {
    if (ignoredUsersCache.has(IGNORED_USERS_CACHE_KEY)) {
        return ignoredUsersCache.get(IGNORED_USERS_CACHE_KEY)!;
    }

    const db = client.db(dbName);
    const ignoredUsersCollection =
        db.collection<IgnoredUsersSchema>(usersColName);
    const ignoredUsersData = await ignoredUsersCollection.find().toArray();
    const extractedIdsArray = ignoredUsersData.map((data) => data.userID);

    ignoredUsersCache.set(IGNORED_USERS_CACHE_KEY, extractedIdsArray);

    return extractedIdsArray;
}
