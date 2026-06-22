import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { prepareVoicesSessionMenu } from "#root/bot/helpers/menu.js";
import { voicesMenu } from "#root/bot/menu/voices.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("voices", logHandle("command-voices"), async (ctx) => {
    const prepareStatus = await prepareVoicesSessionMenu(ctx);
    if (!prepareStatus) {
        return ctx.reply(ctx.t("voices.noData"));
    }

    return ctx.reply(ctx.t("voices.menuHeader"), { reply_markup: voicesMenu });
});

export { composer as voicesFeature };
