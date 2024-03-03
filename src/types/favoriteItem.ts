import type { InlineResultVoice } from "@/src/types/inline.ts";

export interface FavoriteItem extends Pick<InlineResultVoice, "id" | "title"> {
    isFavored: boolean;
}
