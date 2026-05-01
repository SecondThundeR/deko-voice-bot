import { Composer } from "grammy";
import { getVoicesCount } from "@/drizzle/queries/select";
import type { Context } from "../context";
import { isAdmin } from "../filter/is-admin";
import { logHandle } from "../helpers/logging";
import { createSelectVoiceKeyboard } from "../keyboards/select-voice";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("voice", logHandle("command-voice"), async (ctx) => {
    const voicesCount = await getVoicesCount();
    if (voicesCount === 0) {
        return ctx.reply(ctx.t("voices.noData"));
    }

    return ctx.reply(ctx.t("voices.menuItemHeaderHint"), {
        reply_markup: createSelectVoiceKeyboard(ctx),
    });
});

export { composer as voiceFeature };
