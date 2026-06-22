import { Composer } from "grammy";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { createDonateKeyboard } from "#root/bot/keyboards/donate.js";
import { createStartKeyboard } from "#root/bot/keyboards/start.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("start", logHandle("command-start"), async (ctx) => {
    if (ctx.match === "donate") {
        return ctx.reply(ctx.t("donate.commandText"), {
            reply_markup: createDonateKeyboard(ctx),
        });
    }

    return ctx.reply(ctx.t("start.text"), {
        reply_markup: createStartKeyboard(ctx),
    });
});

export { composer as startFeature };
