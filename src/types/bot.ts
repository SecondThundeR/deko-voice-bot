import { Context, MenuFlavor, SessionFlavor } from "@/deps.ts";

import { FavoriteItem } from "@/src/types/favoriteItem.ts";

interface SessionData {
    currentFavorites?: FavoriteItem[] | null;
    currentOffset: number;
}

type Session = SessionFlavor<SessionData>;

export type BotContext = Context & Session;
export type MenuBotContext = BotContext & MenuFlavor;
