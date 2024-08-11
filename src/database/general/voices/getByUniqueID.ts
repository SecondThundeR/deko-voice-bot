import { client } from "@/bot";

import { COLLECTION_NAMES, DATABASE_NAMES } from "@/src/constants/database";

import type { VoiceSchema } from "@/src/schemas/voice";

const dbName = DATABASE_NAMES.general;
const colName = COLLECTION_NAMES[dbName].voices;

export async function getByUniqueID(uniqueId: string) {
    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);
    const voiceData = await voices.findOne({ voiceUniqueId: uniqueId });

    return voiceData;
}
