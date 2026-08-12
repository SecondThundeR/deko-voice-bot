import { deleteVoice } from "#drizzle/queries/voices.js";
import type { MenuContext } from "#root/bot/context.js";
import { escapeHTML } from "#root/bot/helpers/html.js";
import { genericCloseHandler } from "../generic/generic-close-handler.ts";

export async function deleteVoiceHandler(ctx: MenuContext) {
    const currentVoice = ctx.session.currentVoice;
    if (!currentVoice) {
        return;
    }

    const voiceId = currentVoice.id;
    const confirmation = `${voiceId}:${currentVoice.title}`;
    if (ctx.session.deleteVoiceConfirmation !== confirmation) {
        ctx.session.deleteVoiceConfirmation = confirmation;
        await ctx.menu.update({ immediate: true });
        return ctx.answerCallbackQuery();
    }
    ctx.session.deleteVoiceConfirmation = null;
    const deletedVoice = await deleteVoice(voiceId);
    const messageId = deletedVoice
        ? "voices-delete-success"
        : "voices-delete-failed";

    await genericCloseHandler(ctx, (ctx) => {
        ctx.session.currentVoice = null;
    });
    return ctx.reply(
        ctx.t(messageId, {
            voiceTitle: escapeHTML(
                deletedVoice?.voiceTitle ?? currentVoice.title,
            ),
        }),
    );
}
