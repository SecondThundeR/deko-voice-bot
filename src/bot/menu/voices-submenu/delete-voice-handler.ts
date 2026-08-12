import { deleteVoice, getVoicesCount } from "#drizzle/queries/voices.js";
import type { MenuContext } from "#root/bot/context.js";
import { genericBackHandler } from "../generic/generic-back-handler.ts";

export async function deleteVoiceHandler(ctx: MenuContext) {
    if (!ctx.session.currentVoice) {
        return;
    }

    const voiceId = ctx.session.currentVoice.id;
    const confirmation = `${voiceId}:${ctx.session.currentVoice.title}`;
    if (ctx.session.deleteVoiceConfirmation !== confirmation) {
        ctx.session.deleteVoiceConfirmation = confirmation;
        await ctx.menu.update({ immediate: true });
        return ctx.answerCallbackQuery();
    }
    ctx.session.deleteVoiceConfirmation = null;
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
        return ctx.reply(ctx.t("voices-no-data"));
    }
}
