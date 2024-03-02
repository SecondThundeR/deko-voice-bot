import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";

import { updateVoiceInCache } from "@/src/helpers/cache.ts";

import type { VoiceSchema } from "@/src/schemas/voice.ts";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].voices;

export async function updateVoiceFileID(
    id: string,
    newFileID: string,
    newUniqueId: string,
) {
    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);
    const voiceData = await voices.findOneAndUpdate({ id }, {
        $set: {
            fileId: newFileID,
            voiceUniqueId: newUniqueId,
        },
    });

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
