import type {
    Context,
    Conversation,
    ConversationFlavor,
    I18nFlavor,
    MenuFlavor,
    SessionFlavor,
} from "@/deps.ts";

import type { FavoriteItem } from "@/src/types/favoriteItem.ts";
import type { InlineResultVoice } from "@/src/types/inline.ts";

interface SessionData {
    currentFavorites?: FavoriteItem[] | null;
    currentFavoritesOffset: number;
    currentVoices?: InlineResultVoice[] | null;
    currentVoicesOffset: number;
    currentVoice?: InlineResultVoice | null;
    addedVoices?: string[] | null;
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
export type ConversationContext = Conversation<BotContext>;
