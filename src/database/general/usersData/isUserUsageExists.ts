import { client } from "@/bot";

import { collectionNames, databaseNames } from "@/src/constants/database";

import type { UsersDataSchema } from "@/src/schemas/usersData";

const dbName = databaseNames.general;
const usersColName = collectionNames[dbName].usersData;

export async function isUserUsageExists(userID: number) {
    const db = client.db(dbName);
    const usersData = db.collection<UsersDataSchema>(usersColName);
    const data = await usersData.find({ userID }).toArray();

    return data.length > 0;
}
