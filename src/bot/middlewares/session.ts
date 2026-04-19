import {
    session as createSession,
    type Middleware,
    type SessionOptions,
} from "grammy";

import type { Context, SessionData } from "../context";

type Options = Pick<
    SessionOptions<SessionData, Context>,
    "getSessionKey" | "storage"
>;

export function session(options: Options): Middleware<Context> {
    return createSession({
        getSessionKey: options.getSessionKey,
        storage: options.storage,
        initial: () => ({
            currentFavoritesOffset: 0,
            currentVoicesOffset: 0,
        }),
    });
}
