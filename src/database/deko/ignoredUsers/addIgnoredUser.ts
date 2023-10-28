import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";
import {
    isUserAlreadyIgnored,
    updateIgnoredUsersCache,
} from "@/src/helpers/cache.ts";
import { IgnoredUsersSchema } from "@/src/schemas/ignoredUsers.ts";
import { UsersStatsSchema } from "@/src/schemas/usersStats.ts";

const dbName = databaseNames.deko;
const ignoredColName = collectionNames[dbName].ignoredUsers;
const statsColName = collectionNames[dbName].usersStats;

export async function addIgnoredUser(userID: number) {
    if (await isUserAlreadyIgnored(userID)) {
        return false;
    }

    const db = client.database(dbName);
    const usersStatsCollection = db.collection<UsersStatsSchema>(
        statsColName,
    );
    const ignoredUsersCollection = db.collection<IgnoredUsersSchema>(
        ignoredColName,
    );
    await Promise.all([
        usersStatsCollection.deleteOne({ userID }),
        ignoredUsersCollection.insertOne({
            userID,
        }),
    ]);

    updateIgnoredUsersCache(userID, "add");
    return true;
}
