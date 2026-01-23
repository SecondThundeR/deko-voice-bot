import type { SelectVoice } from "@/drizzle/schema";

export function convertVoiceDataToQueriesArray(voicesData: SelectVoice[]) {
    return voicesData.map(
        ({ voiceId: id, voiceTitle: title, fileId: voice_file_id }) => ({
            type: "voice",
            id,
            title,
            voice_file_id,
        } as const),
    );
}
