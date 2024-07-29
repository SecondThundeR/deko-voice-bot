import { client } from "@/bot";

import { collectionNames, databaseNames } from "@/src/constants/database";

import {
    getCachedVoicesStatsData,
    setCachedVoicesStatsData,
} from "@/src/helpers/cache";

import type { VoiceSchema } from "@/src/schemas/voice";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].voices;

export async function getVoicesStats() {
    const cachedVoicesStats = getCachedVoicesStatsData();
    if (cachedVoicesStats) return cachedVoicesStats;

    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);

    const voicesStats = await voices.find().toArray();
    setCachedVoicesStatsData(voicesStats);

    return voicesStats;
}
