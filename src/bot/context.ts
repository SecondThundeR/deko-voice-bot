import type { AutoChatActionFlavor } from "@grammyjs/auto-chat-action";
import type { ConversationFlavor } from "@grammyjs/conversations";
import type { HydrateFlavor } from "@grammyjs/hydrate";
import type { I18nFlavor } from "@grammyjs/i18n";
import type { MenuFlavor } from "@grammyjs/menu";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";
import type { Context as DefaultContext, SessionFlavor } from "grammy";
import type { Config } from "@/config";
import type { Logger } from "@/logger";
import type { InlineResultVoice } from "./types/inline";

export type SessionData = {
    currentFavoritesOffset: number;
    currentVoicesOffset: number;
    currentVoice?: InlineResultVoice | null;
    addedVoices?: string[] | null;
};

interface ExtendedContextFlavor {
    logger: Logger;
    config: Config;
}

export type Context = ConversationFlavor<
    ParseModeFlavor<
        HydrateFlavor<
            DefaultContext &
                ExtendedContextFlavor &
                SessionFlavor<SessionData> &
                I18nFlavor &
                AutoChatActionFlavor
        >
    >
>;

export type CallbackWithContext = (ctx: Context) => void;

export type MenuContext = Context & MenuFlavor;

export type ConversationContext = DefaultContext & I18nFlavor;
