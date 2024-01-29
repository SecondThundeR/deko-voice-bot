import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";

import { removeVoiceFromCache } from "@/src/helpers/cache.ts";

import type { VoiceSchema } from "@/src/schemas/voice.ts";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].voices;

export async function deleteVoice(id: string) {
    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);
    const { deletedCount } = await voices.deleteOne({ id });

    if (deletedCount === 0) return false;
    removeVoiceFromCache(id);
    return true;
}
