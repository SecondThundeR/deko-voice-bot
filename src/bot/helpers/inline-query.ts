import type { SelectVoice } from "#drizzle/schema.js";

export function convertVoiceDataToQuery({
    voiceId: id,
    voiceTitle: title,
    fileId: voice_file_id,
}: SelectVoice) {
    return {
        type: "voice",
        id,
        title,
        voice_file_id,
    } as const;
}
