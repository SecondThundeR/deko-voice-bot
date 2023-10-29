import { User } from "@/deps.ts";
import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";
import {
    getUserIgnoreStatus,
    updateIgnoredUsersCache,
} from "@/src/helpers/cache.ts";
import { IgnoredUsersSchema } from "@/src/schemas/ignoredUsers.ts";
import { UsersStatsSchema } from "@/src/schemas/usersStats.ts";
import { extractUserDetails } from "@/src/helpers/api.ts";

const dbName = databaseNames.deko;
const ignoredColName = collectionNames[dbName].ignoredUsers;
const statsColName = collectionNames[dbName].usersStats;

export async function removeIgnoredUser(from: User) {
    const { userID, fullName, username } = extractUserDetails(from)!;
    if (!await getUserIgnoreStatus(userID)) {
        return false;
    }

    const db = client.database(dbName);
    const usersStatsCollection = db.collection<UsersStatsSchema>(
        statsColName,
    );
    const ignoredUsersCollection = db.collection<IgnoredUsersSchema>(
        ignoredColName,
    );
    const [, deleteStatus] = await Promise.all([
        usersStatsCollection.insertOne({
            userID,
            fullName,
            username,
            usesAmount: 0,
        }),
        ignoredUsersCollection.findAndModify({
            userID,
        }, {
            remove: true,
        }),
    ]);

    if (deleteStatus === null) return false;
    updateIgnoredUsersCache(userID, "remove");

    return true;
}
