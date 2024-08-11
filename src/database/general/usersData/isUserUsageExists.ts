import { client } from "@/bot";

import { COLLECTION_NAMES, DATABASE_NAMES } from "@/src/constants/database";

import type { UsersDataSchema } from "@/src/schemas/usersData";

const dbName = DATABASE_NAMES.general;
const usersColName = COLLECTION_NAMES[dbName].usersData;

export async function isUserUsageExists(userID: number) {
    const db = client.db(dbName);
    const usersData = db.collection<UsersDataSchema>(usersColName);
    const data = await usersData.find({ userID }).toArray();

    return data.length > 0;
}
