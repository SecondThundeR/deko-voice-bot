import type {
    Context,
    Conversation,
    ConversationFlavor,
    I18nFlavor,
    MenuFlavor,
    SessionFlavor,
} from "@/deps.ts";

import { FavoriteItem } from "@/src/types/favoriteItem.ts";
import { InlineResultVoice } from "@/src/types/inline.ts";

interface SessionData {
    currentFavorites?: FavoriteItem[] | null;
    currentFavoritesOffset: number;
    currentVoices?: InlineResultVoice[] | null;
    currentVoicesOffset: number;
}

interface ConfigContext {
    config?: {
        creatorID?: number;
        isCreator: boolean;
    };
}

type Session = SessionFlavor<SessionData>;

export type BotContext =
    & Context
    & ConfigContext
    & Session
    & I18nFlavor
    & ConversationFlavor;
export type MenuBotContext = BotContext & MenuFlavor;
// @ts-expect-error
export type ConversationContext = Conversation<BotContext>;
