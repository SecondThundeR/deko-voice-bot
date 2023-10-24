import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";
import { VoiceSchema } from "@/src/schemas/voice.ts";

const dbName = databaseNames.deko;
const colName = collectionNames[dbName].voices;

export async function getVoices(queryString?: string) {
    const db = client.database(dbName);
    const voices = db.collection<VoiceSchema>(colName);
    const voiceToFind = !queryString ? "" : new RegExp(queryString, "i");

    return await voices.find({ title: { $regex: voiceToFind } }).sort({
        "title": 1,
    }).toArray();
}
