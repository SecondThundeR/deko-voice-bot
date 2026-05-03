import { Composer } from "grammy";
import type { Context } from "@/bot/context";
import { logHandle } from "@/bot/helpers/logging";
import { createDonateKeyboard } from "@/bot/keyboards/donate";
import { createStartKeyboard } from "@/bot/keyboards/start";

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
