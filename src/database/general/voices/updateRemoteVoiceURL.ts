import { client } from "@/bot";

import { COLLECTION_NAMES, DATABASE_NAMES } from "@/src/constants/database";

import { updateVoiceInCache } from "@/src/helpers/cache";

import type { VoiceSchema } from "@/src/schemas/voice";

const dbName = DATABASE_NAMES.general;
const colName = COLLECTION_NAMES[dbName].voices;

export async function updateRemoteVoiceURL(
    id: string,
    newUrl: string,
    newUniqueId: string,
) {
    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);
    const voiceData = await voices.findOneAndUpdate(
        { id },
        {
            $set: {
                url: newUrl,
                voiceUniqueId: newUniqueId,
            },
        },
    );

    if (!voiceData) return false;
    const { title, fileId: voice_file_id } = voiceData;
    updateVoiceInCache({
        id,
        title,
        type: "voice",
        voice_file_id,
        voice_url: newUrl,
    });
    return true;
}
