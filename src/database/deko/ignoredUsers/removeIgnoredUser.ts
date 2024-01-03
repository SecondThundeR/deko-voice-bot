import { User } from "@/deps.ts";
import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";

import {
    getUserIgnoreStatus,
    removeIgnoredUserFromCache,
} from "@/src/helpers/cache.ts";
import { IgnoredUsersSchema } from "@/src/schemas/ignoredUsers.ts";
import { UsersDataSchema } from "@/src/schemas/usersData.ts";
import { extractUserDetails } from "@/src/helpers/api.ts";

const dbName = databaseNames.deko;
const ignoredColName = collectionNames[dbName].ignoredUsers;
const usersColName = collectionNames[dbName].usersData;

export async function removeIgnoredUser(from: User) {
    const { userID, fullName, username } = extractUserDetails(from)!;
    if (!await getUserIgnoreStatus(userID)) {
        return false;
    }

    const db = client.database(dbName);
    const usersDataCollection = db.collection<UsersDataSchema>(
        usersColName,
    );
    const ignoredUsersCollection = db.collection<IgnoredUsersSchema>(
        ignoredColName,
    );
    const [, deleteStatus] = await Promise.all([
        usersDataCollection.insertOne({
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

    if (!deleteStatus) return false;

    removeIgnoredUserFromCache(userID);
    return true;
}
