import { session } from "grammy";

import { getSessionKey } from "@/src/helpers/api";

import type { BotContext, SessionType } from "@/src/types/bot";

export const sessionSetup = async () => {
    return session<SessionType["session"], BotContext>({
        getSessionKey,
        initial: () => ({
            currentFavoritesOffset: 0,
            currentVoicesOffset: 0,
        }),
    });
};
