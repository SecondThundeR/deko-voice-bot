import { client } from "@/bot";

import { COLLECTION_NAMES, DATABASE_NAMES } from "@/src/constants/database";

import type { VoiceSchema } from "@/src/schemas/voice";

const dbName = DATABASE_NAMES.general;
const colName = COLLECTION_NAMES[dbName].voices;

export async function getVoices(queryString?: string) {
    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);
    const voiceToFind = !queryString ? "" : new RegExp(queryString, "i");

    return await voices
        .find({ title: { $regex: voiceToFind } })
        .sort({ title: 1 })
        .toArray();
}
