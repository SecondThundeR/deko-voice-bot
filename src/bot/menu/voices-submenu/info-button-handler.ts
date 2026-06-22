import type { Context } from "#root/bot/context.js";

export function infoButtonHandler(ctx: Context) {
    if (!ctx.session.currentVoice) {
        return ctx.t("voices.unknown");
    }

    const { id, title } = ctx.session.currentVoice;
    return `${title} (${id})`;
}
