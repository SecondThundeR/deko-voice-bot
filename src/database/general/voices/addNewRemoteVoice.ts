import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";

import { addVoiceToCache } from "@/src/helpers/cache.ts";

import type { VoiceSchema } from "@/src/schemas/voice.ts";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].voices;

export async function addNewRemoteVoice(
    id: string,
    title: string,
    url: string,
    uniqueId: string,
) {
    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);

    await voices.insertOne({
        id,
        title,
        url,
        usesAmount: 0,
        voiceUniqueId: uniqueId,
    });

    addVoiceToCache({
        id,
        title,
        type: "voice",
        voice_url: url,
    });
}
