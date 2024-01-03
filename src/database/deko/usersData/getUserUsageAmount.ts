import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";

import type { UsersDataSchema } from "@/src/schemas/usersData.ts";

const dbName = databaseNames.deko;
const usersColName = collectionNames[dbName].usersData;

export async function getUserUsageAmount(userID: number) {
    const db = client.database(dbName);
    const usersData = db.collection<UsersDataSchema>(usersColName);
    const data = await usersData
        .find({ userID })
        .toArray();

    if (data.length === 0) return 0;

    return data[0].usesAmount;
}
