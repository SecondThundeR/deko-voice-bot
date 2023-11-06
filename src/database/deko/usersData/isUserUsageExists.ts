import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";
import { UsersDataSchema } from "@/src/schemas/usersData.ts";

const dbName = databaseNames.deko;
const usersColName = collectionNames[dbName].usersData;

export async function isUserUsageExists(userID: number) {
    const db = client.database(dbName);
    const usersData = db.collection<UsersDataSchema>(usersColName);
    const data = await usersData.find({ userID }).toArray();

    return data.length > 0;
}
