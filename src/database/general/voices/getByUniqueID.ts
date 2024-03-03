import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";

import type { VoiceSchema } from "@/src/schemas/voice.ts";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].voices;

export async function getByUniqueID(uniqueId: string) {
    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);
    const voiceData = await voices.findOne({ voiceUniqueId: uniqueId });

    return voiceData;
}
