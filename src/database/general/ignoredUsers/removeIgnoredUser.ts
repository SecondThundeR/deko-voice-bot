import type { User } from "grammy/types";

import { client } from "@/bot";

import { COLLECTION_NAMES, DATABASE_NAMES } from "@/src/constants/database";

import {
    getUserIgnoreStatus,
    removeIgnoredUserFromCache,
} from "@/src/helpers/cache";
import { extractUserDetails } from "@/src/helpers/api";

import type { IgnoredUsersSchema } from "@/src/schemas/ignoredUsers";
import type { UsersDataSchema } from "@/src/schemas/usersData";

const dbName = DATABASE_NAMES.general;
const ignoredColName = COLLECTION_NAMES[dbName].ignoredUsers;
const usersColName = COLLECTION_NAMES[dbName].usersData;

export async function removeIgnoredUser(from: User) {
    const { userID, fullName, username } = extractUserDetails(from)!;
    if (!(await getUserIgnoreStatus(userID))) {
        return false;
    }

    const db = client.db(dbName);
    const usersDataCollection = db.collection<UsersDataSchema>(usersColName);
    const ignoredUsersCollection =
        db.collection<IgnoredUsersSchema>(ignoredColName);
    const [, deleteStatus] = await Promise.all([
        usersDataCollection.insertOne({
            userID,
            fullName,
            username,
            usesAmount: 0,
        }),
        ignoredUsersCollection.findOneAndDelete({ userID }),
    ]);

    if (!deleteStatus) return false;

    removeIgnoredUserFromCache(userID);
    return true;
}
