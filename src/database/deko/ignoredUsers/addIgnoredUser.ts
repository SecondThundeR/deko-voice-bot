import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";
import {
    getUserIgnoreStatus,
    updateIgnoredUsersCache,
} from "@/src/helpers/cache.ts";
import { IgnoredUsersSchema } from "@/src/schemas/ignoredUsers.ts";
import { UsersStatsSchema } from "@/src/schemas/usersStats.ts";

const dbName = databaseNames.deko;
const ignoredColName = collectionNames[dbName].ignoredUsers;
const statsColName = collectionNames[dbName].usersStats;

export async function addIgnoredUser(userID: number) {
    if (await getUserIgnoreStatus(userID)) {
        return null;
    }

    const db = client.database(dbName);
    const usersStatsCollection = db.collection<UsersStatsSchema>(
        statsColName,
    );
    const ignoredUsersCollection = db.collection<IgnoredUsersSchema>(
        ignoredColName,
    );
    const userData = await usersStatsCollection.findAndModify({ userID }, {
        remove: true,
    });
    if (!userData) {
        throw new Error(
            "Failed to delete user data. Make sure, such user is exists before removing it",
        );
    }

    await ignoredUsersCollection.insertOne({
        userID,
    });
    updateIgnoredUsersCache(userID, "add");

    return userData;
}
