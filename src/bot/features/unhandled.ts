import { Composer } from "grammy";

import type { Context } from "@/bot/context";
import { logHandle } from "@/bot/helpers/logging";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.on("callback_query", logHandle("unhandled-callback-query"), (ctx) =>
    ctx.callbackQuery.answer(),
);

export { composer as unhandledFeature };
