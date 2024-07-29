import { client } from "@/bot";

import { collectionNames, databaseNames } from "@/src/constants/database";

import type { UsersDataSchema } from "@/src/schemas/usersData";

const dbName = databaseNames.general;
const usersColName = collectionNames[dbName].usersData;

export async function getLastUsedAtTime(userID: number) {
    const db = client.db(dbName);
    const usersData = db.collection<UsersDataSchema>(usersColName);
    const data = await usersData.find({ userID }).toArray();

    if (data.length === 0) return;

    return data[0].lastUsedAt;
}
