import { BotContext } from "@/src/types/bot";

export function infoButtonHandler(ctx: BotContext) {
    if (!ctx.session.currentVoice) return ctx.t("voices.unknown");

    const { id, title } = ctx.session.currentVoice;
    return `${title} (${id})`;
}
