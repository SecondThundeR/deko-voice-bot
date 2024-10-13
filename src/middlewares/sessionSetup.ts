import { session } from "grammy";

import { getSessionKey } from "@/src/helpers/api";

export const sessionSetup = () =>
    session({
        getSessionKey,
        initial: () => ({
            currentFavoritesOffset: 0,
            currentVoicesOffset: 0,
        }),
    });
