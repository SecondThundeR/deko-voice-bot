import { client } from "@/bot";

import { collectionNames, databaseNames } from "@/src/constants/database";

import type { VoiceSchema } from "@/src/schemas/voice";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].voices;

export async function getByUniqueID(uniqueId: string) {
    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);
    const voiceData = await voices.findOne({ voiceUniqueId: uniqueId });

    return voiceData;
}
