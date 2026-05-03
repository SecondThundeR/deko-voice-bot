import type { Context } from "@/bot/context";

export function infoButtonHandler(ctx: Context) {
    if (!ctx.session.currentVoice) {
        return ctx.t("voices.unknown");
    }

    const { id, title } = ctx.session.currentVoice;
    return `${title} (${id})`;
}
