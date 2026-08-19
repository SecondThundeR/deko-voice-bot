import { Composer } from "grammy";

import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.on("callback_query", logHandle("unhandled-callback-query"), (ctx) =>
    ctx.callbackQuery.answer(),
);

export { composer as unhandledFeature };
