import type { SelectVoice } from "@/drizzle/schema";

const voiceDataToQueriesMapper = ({
    voiceId: id,
    voiceTitle: title,
    fileId: voice_file_id,
}: SelectVoice) =>
    ({
        type: "voice",
        id,
        title,
        voice_file_id,
    }) as const;

export function convertVoiceDataToQueriesArray(voicesData: SelectVoice[]) {
    return voicesData.map(voiceDataToQueriesMapper);
}
