import { session } from "grammy";

import { getSessionKey } from "@/src/helpers/api";

export function sessionSetup() {
    return session({
        getSessionKey,
        initial() {
            return {
                currentFavoritesOffset: 0,
                currentVoicesOffset: 0,
            };
        },
    });
}
