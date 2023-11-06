import {
    Context,
    InlineQueryResultVoice,
    MenuFlavor,
    SessionFlavor,
} from "@/deps.ts";

export interface FavoriteItem
    extends Pick<InlineQueryResultVoice, "id" | "title"> {
    isFavored: boolean;
}

interface SessionData {
    currentFavorites?: FavoriteItem[] | null;
    currentOffset: number;
}

export type BotContext =
    & Context
    & SessionFlavor<SessionData>;
export type MenuBotContext = BotContext & MenuFlavor;
