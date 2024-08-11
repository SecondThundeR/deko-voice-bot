import { client } from "@/bot";

import { COLLECTION_NAMES, DATABASE_NAMES } from "@/src/constants/database";

import { removeVoiceFromCache } from "@/src/helpers/cache";

import type { VoiceSchema } from "@/src/schemas/voice";

const dbName = DATABASE_NAMES.general;
const colName = COLLECTION_NAMES[dbName].voices;

export async function deleteVoice(id: string) {
    const db = client.db(dbName);
    const voices = db.collection<VoiceSchema>(colName);
    const { deletedCount } = await voices.deleteOne({ id });

    if (deletedCount === 0) return false;
    removeVoiceFromCache(id);
    return true;
}
