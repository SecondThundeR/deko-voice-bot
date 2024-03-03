import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";

import type { VoiceSchema } from "@/src/schemas/voice.ts";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].voices;

export async function addNewVoice(
    id: string,
    title: string,
    fileId: string,
    uniqueId: string,
) {
    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);

    const data = await voices.insertOne({
        id,
        title,
        fileId,
        usesAmount: 0,
        voiceUniqueId: uniqueId,
    });

    return data.acknowledged;
}
