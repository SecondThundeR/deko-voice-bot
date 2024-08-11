import { client } from "@/bot";

import { COLLECTION_NAMES, DATABASE_NAMES } from "@/src/constants/database";

import type { VoiceSchema } from "@/src/schemas/voice";

const dbName = DATABASE_NAMES.general;
const colName = COLLECTION_NAMES[dbName].voices;

export async function addNewRemoteVoice(
    id: string,
    title: string,
    url: string,
    uniqueId: string,
) {
    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);

    const data = await voices.insertOne({
        id,
        title,
        url,
        usesAmount: 0,
        voiceUniqueId: uniqueId,
    });

    return data.acknowledged;
}
