import { Composer } from "grammy";
import type { Context } from "../context";
import { logHandle } from "../helpers/logging";

export const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("privacy", logHandle("command-privacy"), (ctx) =>
    ctx.reply(ctx.t("privacy.message"), {
        link_preview_options: {
            is_disabled: true,
        },
    }),
);

export { composer as privacyFeature };
