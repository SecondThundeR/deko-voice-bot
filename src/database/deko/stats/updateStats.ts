import { client } from "@/bot.ts";
import { User } from "@/deps.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";
import { extractUserDetails } from "@/src/helpers/api.ts";
import { UsersStatsSchema } from "@/src/schemas/usersStats.ts";
import { VoiceSchema } from "@/src/schemas/voice.ts";
import { userUsageCache } from "@/src/cache/userUsage.ts";
import { getUserIgnoreStatus } from "@/src/helpers/cache.ts";
import { lastUsedAtCache } from "@/src/cache/lastUsedAt.ts";

const dbName = databaseNames.deko;
const voicesColName = collectionNames[dbName].voices;
const usersColName = collectionNames[dbName].usersStats;

export async function updateStats(voiceID: string, from: User) {
    const db = client.database(dbName);
    const userDetails = extractUserDetails(from);
    const usersStats = db.collection<UsersStatsSchema>(usersColName);
    const voicesCol = db.collection<VoiceSchema>(voicesColName);

    await voicesCol.updateOne(
        { id: voiceID },
        {
            $inc: {
                usesAmount: 1,
            },
        },
    );

    if (userDetails === null) return;

    const userIgnoreStatus = await getUserIgnoreStatus(userDetails.userID);
    if (userIgnoreStatus) return;

    const lastUsedAt = Date.now();
    const modifiedStatsData = await usersStats.findAndModify(
        { userID: userDetails.userID },
        {
            update: {
                $set: {
                    ...userDetails,
                    lastUsedAt,
                },
                $inc: {
                    usesAmount: 1,
                },
            },
            upsert: true,
        },
    );

    if (!modifiedStatsData) return;

    const { userID, usesAmount } = modifiedStatsData;
    // Should increment usage again, as Mongo returns old value, but sets new one
    userUsageCache.set(userID, usesAmount + 1);
    lastUsedAtCache.set(userID, lastUsedAt);
}
