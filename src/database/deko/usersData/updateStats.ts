import { client } from "@/bot.ts";
import type { User } from "@/deps.ts";

import { lastUsedAtCache } from "@/src/cache/lastUsedAt.ts";
import { userUsageCache } from "@/src/cache/userUsage.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";

import { extractUserDetails } from "@/src/helpers/api.ts";
import { getUserIgnoreStatus } from "@/src/helpers/cache.ts";

import type { UsersDataSchema } from "@/src/schemas/usersData.ts";
import type { VoiceSchema } from "@/src/schemas/voice.ts";

const dbName = databaseNames.deko;
const voicesColName = collectionNames[dbName].voices;
const usersColName = collectionNames[dbName].usersData;

export async function updateStats(voiceID: string, from: User) {
    const db = client.database(dbName);
    const usersData = db.collection<UsersDataSchema>(usersColName);
    const voicesCol = db.collection<VoiceSchema>(voicesColName);
    const userDetails = extractUserDetails(from);
    const lastUsedAt = Date.now();

    await voicesCol.updateOne(
        { id: voiceID },
        {
            $inc: {
                usesAmount: 1,
            },
        },
    );

    if (!userDetails) return;

    const userIgnoreStatus = await getUserIgnoreStatus(userDetails.userID);
    if (userIgnoreStatus) return;

    const modifiedStatsData = await usersData.findAndModify(
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
