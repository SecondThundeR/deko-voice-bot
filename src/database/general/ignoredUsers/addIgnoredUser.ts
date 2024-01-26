import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";

import {
    addNewIgnoredUserInCache,
    getUserIgnoreStatus,
} from "@/src/helpers/cache.ts";

import type { IgnoredUsersSchema } from "@/src/schemas/ignoredUsers.ts";
import type { UsersDataSchema } from "@/src/schemas/usersData.ts";

const dbName = databaseNames.general;
const ignoredColName = collectionNames[dbName].ignoredUsers;
const usersColName = collectionNames[dbName].usersData;

export async function addIgnoredUser(userID: number) {
    if (await getUserIgnoreStatus(userID)) {
        return null;
    }

    const db = client.db(dbName);
    const usersDataCollection = db.collection<UsersDataSchema>(
        usersColName,
    );
    const ignoredUsersCollection = db.collection<IgnoredUsersSchema>(
        ignoredColName,
    );
    const userData = await usersDataCollection.findOneAndDelete({ userID });
    if (!userData) {
        throw new Error(
            "Failed to delete user data. Make sure, such user is exists before removing it",
        );
    }

    await ignoredUsersCollection.insertOne({
        userID,
    });
    addNewIgnoredUserInCache(userID);

    return userData;
}
