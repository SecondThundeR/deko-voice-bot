import { client } from "@/bot";

import { collectionNames, databaseNames } from "@/src/constants/database";

import {
    addNewIgnoredUserInCache,
    getUserIgnoreStatus,
} from "@/src/helpers/cache";

import type { IgnoredUsersSchema } from "@/src/schemas/ignoredUsers";
import type { UsersDataSchema } from "@/src/schemas/usersData";

const dbName = databaseNames.general;
const ignoredColName = collectionNames[dbName].ignoredUsers;
const usersColName = collectionNames[dbName].usersData;

export async function addIgnoredUser(userID: number) {
    if (await getUserIgnoreStatus(userID)) {
        return null;
    }

    const db = client.db(dbName);
    const usersDataCollection = db.collection<UsersDataSchema>(usersColName);
    const ignoredUsersCollection =
        db.collection<IgnoredUsersSchema>(ignoredColName);
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
