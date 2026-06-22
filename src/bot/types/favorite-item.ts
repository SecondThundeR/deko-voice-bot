import type { InlineResultVoice } from "./inline.ts";

export interface FavoriteItem extends Pick<InlineResultVoice, "id" | "title"> {
    isFavored: boolean;
}
