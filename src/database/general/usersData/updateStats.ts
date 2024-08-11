import type { User } from "grammy/types";

import { client } from "@/bot";

import { lastUsedAtCache } from "@/src/cache/lastUsedAt";
import { userUsageCache } from "@/src/cache/userUsage";

import { COLLECTION_NAMES, DATABASE_NAMES } from "@/src/constants/database";

import { extractUserDetails } from "@/src/helpers/api";
import { getUserIgnoreStatus } from "@/src/helpers/cache";

import type { UsersDataSchema } from "@/src/schemas/usersData";
import type { VoiceSchema } from "@/src/schemas/voice";

const dbName = DATABASE_NAMES.general;
const voicesColName = COLLECTION_NAMES[dbName].voices;
const usersColName = COLLECTION_NAMES[dbName].usersData;

export async function updateStats(voiceID: string, from: User) {
    const db = client.db(dbName);
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

    const modifiedStatsData = await usersData.findOneAndUpdate(
        { userID: userDetails.userID },
        {
            $set: {
                ...userDetails,
                lastUsedAt,
            },
            $inc: {
                usesAmount: 1,
            },
        },
        { upsert: true },
    );

    if (!modifiedStatsData) return;

    const { userID, usesAmount } = modifiedStatsData;

    // Should increment usage again, as Mongo returns old value, but sets new one
    userUsageCache.set(userID, usesAmount + 1);
    lastUsedAtCache.set(userID, lastUsedAt);
}
