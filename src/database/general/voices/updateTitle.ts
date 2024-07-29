import { client } from "@/bot";

import { collectionNames, databaseNames } from "@/src/constants/database";

import { updateVoiceInCache } from "@/src/helpers/cache";

import type { VoiceSchema } from "@/src/schemas/voice";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].voices;

export async function updateTitle(id: string, title: string) {
    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);
    const voiceData = await voices.findOneAndUpdate(
        { id },
        {
            $set: {
                title,
            },
        },
    );

    if (!voiceData) return false;
    const { fileId: voice_file_id, url: voice_url } = voiceData;
    updateVoiceInCache({
        id,
        title,
        type: "voice",
        voice_file_id,
        voice_url,
    });
    return true;
}
