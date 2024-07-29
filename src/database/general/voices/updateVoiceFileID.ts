import { client } from "@/bot";

import { collectionNames, databaseNames } from "@/src/constants/database";

import { updateVoiceInCache } from "@/src/helpers/cache";

import type { VoiceSchema } from "@/src/schemas/voice";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].voices;

export async function updateVoiceFileID(
    id: string,
    newFileID: string,
    newUniqueId: string,
) {
    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);
    const voiceData = await voices.findOneAndUpdate(
        { id },
        {
            $set: {
                fileId: newFileID,
                voiceUniqueId: newUniqueId,
            },
        },
    );

    if (!voiceData) return false;
    const { title, url: voice_url } = voiceData;
    updateVoiceInCache({
        id,
        title,
        type: "voice",
        voice_file_id: newFileID,
        voice_url,
    });
    return true;
}
