import { Composer } from "grammy";
import type { Context } from "@/bot/context";
import { isAdmin } from "@/bot/filter/is-admin";
import { logHandle } from "@/bot/helpers/logging";
import { prepareVoicesSessionMenu } from "@/bot/helpers/menu";
import { voicesMenu } from "@/bot/menu/voices";

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
