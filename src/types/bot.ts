import type { Context, SessionFlavor } from "grammy";
import type { I18nFlavor } from "@grammyjs/i18n";
import type { MenuFlavor } from "@grammyjs/menu";
import type { Conversation, ConversationFlavor } from "@grammyjs/conversations";

import type { FavoriteItem } from "@/src/types/favoriteItem";
import type { InlineResultVoice } from "@/src/types/inline";

interface SessionData {
    currentFavorites?: FavoriteItem[] | null;
    currentFavoritesOffset: number;
    currentVoices?: InlineResultVoice[] | null;
    currentVoicesOffset: number;
    currentVoice?: InlineResultVoice | null;
    addedVoices?: string[] | null;
    canRunFFMPEG?: boolean;
}

interface ConfigContext {
    config: {
        adminIDs: number[];
        isAdmin: boolean;
        stickerFileID?: string;
    };
}

export type CallbackWithContext = (ctx: BotContext) => void;

export type SessionType = SessionFlavor<SessionData>;

export type BotContext = Context &
    ConfigContext &
    SessionType &
    I18nFlavor &
    ConversationFlavor;
export type MenuBotContext = BotContext & MenuFlavor;
export type ConversationContext = Conversation<BotContext>;
