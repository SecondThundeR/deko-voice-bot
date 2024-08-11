import { client } from "@/bot";
import { lastUsedAtCache } from "@/src/cache/lastUsedAt";

import { COLLECTION_NAMES, DATABASE_NAMES } from "@/src/constants/database";

import type { UsersDataSchema } from "@/src/schemas/usersData";

const dbName = DATABASE_NAMES.general;
const usersColName = COLLECTION_NAMES[dbName].usersData;

export async function getLastUsedAtTime(userID: number) {
    if (lastUsedAtCache.has(userID)) {
        return lastUsedAtCache.get(userID)!;
    }

    const db = client.db(dbName);
    const usersData = db.collection<UsersDataSchema>(usersColName);
    const data = await usersData.find({ userID }).toArray();
    const lastUsedAt = data.length === 0 ? undefined : data[0].lastUsedAt;

    lastUsedAtCache.set(userID, lastUsedAt);

    return lastUsedAt;
}
