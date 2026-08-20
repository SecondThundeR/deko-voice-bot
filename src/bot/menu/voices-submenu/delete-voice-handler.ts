import { deleteVoice } from "#drizzle/queries/voices.js";
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
    if (!deletedVoice) {
        return ctx.answerCallbackQuery({
            text: ctx.t("voices-delete-failed", {
                voiceTitle: ctx.session.currentVoice.title,
            }),
            show_alert: true,
        });
    }

    return genericBackHandler(ctx, (ctx) => {
        ctx.session.currentVoice = null;
        ctx.session.currentVoicesOffset = 0;
    });
}
