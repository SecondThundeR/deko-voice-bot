import { client } from "@/bot.ts";

import { VoiceSchema } from "@/src/schemas/voice.ts";

export async function getVoices(queryString?: string) {
    const db = client.database("deko");
    const voices = db.collection<VoiceSchema>("voices");
    const voiceToFind = !queryString ? "" : new RegExp(queryString, "i");

    return await voices.find({ title: { $regex: voiceToFind } }).sort({
        "title": 1,
    }).toArray();
}
