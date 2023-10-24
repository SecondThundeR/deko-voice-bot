import { client } from "@/bot.ts";
import { User } from "@/deps.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";
import { extractUserDetails } from "@/src/helpers/api.ts";
import { UsersStatsSchema } from "@/src/schemas/usersStats.ts";
import { VoiceSchema } from "@/src/schemas/voice.ts";

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
