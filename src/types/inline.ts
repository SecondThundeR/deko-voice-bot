import type {
    InlineQueryResultCachedVoice,
    InlineQueryResultVoice,
} from "grammy/types";

export type InlineResultVoice = {
    type: "voice";
    id: string;
    title: string;
    voice_url?: string;
    voice_file_id?: string;
};

export type InlineQueriesArray = (
    | InlineQueryResultVoice
    | InlineQueryResultCachedVoice
)[];
