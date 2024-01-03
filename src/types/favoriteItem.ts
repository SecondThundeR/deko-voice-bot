import { InlineQueryResultVoice } from "@/deps.ts";

export interface FavoriteItem
    extends Pick<InlineQueryResultVoice, "id" | "title"> {
    isFavored: boolean;
}
