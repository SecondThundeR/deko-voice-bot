import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";

import { updateVoiceInCache } from "@/src/helpers/cache.ts";

import type { VoiceSchema } from "@/src/schemas/voice.ts";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].voices;

export async function updateRemoteVoiceURL(
    id: string,
    newUrl: string,
    newUniqueId: string,
) {
    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);
    const voiceData = await voices.findOneAndUpdate({ id }, {
        $set: {
            url: newUrl,
            voiceUniqueId: newUniqueId,
        },
    });

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
