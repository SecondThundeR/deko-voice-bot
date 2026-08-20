import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { voicesMenu } from "#root/bot/menu/voices.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("voices", logHandle("command-voices"), async (ctx) => {
    ctx.session.currentVoicesOffset = 0;
    return ctx.reply(ctx.t("voices-menu-header"), { reply_markup: voicesMenu });
});

export { composer as voicesFeature };
