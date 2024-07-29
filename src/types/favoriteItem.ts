import type { InlineResultVoice } from "@/src/types/inline";

export interface FavoriteItem extends Pick<InlineResultVoice, "id" | "title"> {
    isFavored: boolean;
}
