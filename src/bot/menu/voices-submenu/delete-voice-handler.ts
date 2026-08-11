import { deleteVoice, getVoicesCount } from "#drizzle/queries/voices.js";
import type { MenuContext } from "#root/bot/context.js";
import { genericBackHandler } from "../generic/generic-back-handler.ts";

export async function deleteVoiceHandler(ctx: MenuContext) {
    if (!ctx.session.currentVoice) {
        return;
    }

    const voiceId = ctx.session.currentVoice.id;
    const deletedVoice = await deleteVoice(voiceId);
    const hasVoices = deletedVoice?.hasVoices ?? (await getVoicesCount()) > 0;

    await genericBackHandler(
        ctx,
        (ctx) => {
            ctx.session.currentVoice = null;
            ctx.session.currentVoicesOffset = 0;
        },
        !hasVoices,
    );

    if (!hasVoices) {
        return ctx.reply(ctx.t("voices.noData"));
    }
}
