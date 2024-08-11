import { client } from "@/bot";

import { COLLECTION_NAMES, DATABASE_NAMES } from "@/src/constants/database";

import { updateVoiceInCache } from "@/src/helpers/cache";

import type { VoiceSchema } from "@/src/schemas/voice";

const dbName = DATABASE_NAMES.general;
const colName = COLLECTION_NAMES[dbName].voices;

export async function updateID(id: string, newId: string) {
    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);
    const voiceData = await voices.findOneAndUpdate(
        { id },
        {
            $set: {
                id: newId,
            },
        },
    );

    if (!voiceData) return false;
    const { title, fileId: voice_file_id, url: voice_url } = voiceData;
    updateVoiceInCache(
        {
            id: newId,
            title,
            type: "voice",
            voice_file_id,
            voice_url,
        },
        id,
    );
    return true;
}
