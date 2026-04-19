import type { InlineResultVoice } from "./inline";

export interface FavoriteItem extends Pick<InlineResultVoice, "id" | "title"> {
    isFavored: boolean;
}
