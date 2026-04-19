import { Composer } from "grammy";
import type { Context } from "../context";
import { isAdmin } from "../filter/is-admin";
import { logHandle } from "../helpers/logging";
import { prepareVoicesSessionMenu } from "../helpers/menu";
import { voicesMenu } from "../menu/voices";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("voices", logHandle("command-voices"), async (ctx) => {
    const prepareStatus = await prepareVoicesSessionMenu(ctx);
    if (!prepareStatus) return await ctx.reply(ctx.t("voices.noData"));

    await ctx.reply(ctx.t("voices.menuHeader"), { reply_markup: voicesMenu });
});

export { composer as voicesFeature };
