import { client } from "@/bot";

import { COLLECTION_NAMES, DATABASE_NAMES } from "@/src/constants/database";

import type { UsersDataSchema } from "@/src/schemas/usersData";

const dbName = DATABASE_NAMES.general;
const usersColName = COLLECTION_NAMES[dbName].usersData;

export async function getUserUsageAmount(userID: number) {
    const db = client.db(dbName);
    const usersData = db.collection<UsersDataSchema>(usersColName);
    const data = await usersData.find({ userID }).toArray();

    if (data.length === 0) return 0;

    return data[0].usesAmount;
}
