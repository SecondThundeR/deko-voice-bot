import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";

import { addVoiceToCache } from "@/src/helpers/cache.ts";

import type { VoiceSchema } from "@/src/schemas/voice.ts";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].voices;

export async function addNewVoice(id: string, title: string, fileId: string) {
    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);

    await voices.insertOne({
        id,
        title,
        fileId,
        usesAmount: 0,
    });

    addVoiceToCache({
        id,
        title,
        type: "voice",
        voice_file_id: fileId,
    });
}
