import type { SelectVoice } from "@/drizzle/schema";

import type { InlineResultVoice } from "@/src/types/inline";

import { convertVoiceUrl } from "./general";

export function convertVoiceDataToQueriesArray(voicesData: SelectVoice[]) {
    return voicesData
        .map(
            ({
                voiceId: id,
                voiceTitle: title,
                url,
                fileId: voice_file_id,
            }) => {
                if (!url) {
                    return {
                        type: "voice",
                        id,
                        title,
                        voice_file_id,
                    };
                }

                try {
                    return {
                        type: "voice",
                        id,
                        title,
                        voice_url: convertVoiceUrl(url),
                    };
                } catch (error: unknown) {
                    console.error(
                        `Failed to process "${title}" (${id})\n${error}`,
                    );

                    return null;
                }
            },
        )
        .filter((item) => item !== null) as InlineResultVoice[];
}
