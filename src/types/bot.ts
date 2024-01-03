import { Context, I18nFlavor, MenuFlavor, SessionFlavor } from "@/deps.ts";

import { FavoriteItem } from "@/src/types/favoriteItem.ts";

interface SessionData {
    currentFavorites?: FavoriteItem[] | null;
    currentOffset: number;
}

interface CustomContext {
    config?: {
        creatorID?: number;
        isCreator: boolean;
    };
}

type Session = SessionFlavor<SessionData>;

export type BotContext = Context & CustomContext & Session & I18nFlavor;
export type MenuBotContext = BotContext & MenuFlavor;
