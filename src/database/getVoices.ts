import { client } from "@/bot.ts";

import { VoiceSchema } from "@/src/schemas/voice.ts";

export async function getVoices(queryString?: string) {
    const db = client.database("deko");
    const voices = db.collection<VoiceSchema>("voices");

    if (!queryString) return await voices.find().toArray();

    const voiceToFind = new RegExp(queryString, "i");
    return await voices
        .find({
            title: {
                $regex: voiceToFind,
            },
        })
        .toArray();
}
