import { client } from "@/bot";

import { collectionNames, databaseNames } from "@/src/constants/database";

import { removeVoiceFromCache } from "@/src/helpers/cache";

import type { VoiceSchema } from "@/src/schemas/voice";

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
