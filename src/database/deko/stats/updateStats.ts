import { client } from "@/bot.ts";
import { User } from "@/deps.ts";

import { rootCacheKey } from "@/src/constants/cache.ts";
import { collectionNames, databaseNames } from "@/src/constants/database.ts";
import { rootQueryCache } from "@/src/handlers/inlineQuery.ts";
import { extractUserDetails } from "@/src/helpers/api.ts";
import { VoiceStatsSchema } from "@/src/schemas/voiceStats.ts";
import { UsersStatsSchema } from "@/src/schemas/usersStats.ts";

const dbName = databaseNames.deko;
const voiceColName = collectionNames[dbName].voiceStats;
const usersColName = collectionNames[dbName].usersStats;

export async function updateVoiceStats(voiceID: string) {
    const db = client.database(dbName);
    const voiceStats = db.collection<VoiceStatsSchema>(voiceColName);
    const { id, title } = rootQueryCache
        .get(rootCacheKey)!
        .find((data) => data.id === voiceID)!;

    await voiceStats.findAndModify(
        { id },
        {
            update: {
                $set: {
                    id,
                    title,
                },
                $inc: {
                    usesAmount: 1,
                },
            },
            upsert: true,
        },
    );
}

export async function updateUsersStats(from: User) {
    const db = client.database(dbName);
    const userDetails = extractUserDetails(from);
    const usersStats = db.collection<UsersStatsSchema>(usersColName);

    await usersStats.findAndModify(
        { userID: userDetails.userID },
        {
            update: {
                $set: {
                    ...userDetails,
                },
                $inc: {
                    usesAmount: 1,
                },
            },
            upsert: true,
        },
    );
}
