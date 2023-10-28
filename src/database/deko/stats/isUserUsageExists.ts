import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";
import { UsersStatsSchema } from "@/src/schemas/usersStats.ts";

const dbName = databaseNames.deko;
const usersColName = collectionNames[dbName].usersStats;

export async function isUserUsageExists(userID: number) {
    const db = client.database(dbName);
    const usersStats = db.collection<UsersStatsSchema>(usersColName);
    const data = await usersStats.find({ userID }).toArray();

    return data.length > 0;
}
