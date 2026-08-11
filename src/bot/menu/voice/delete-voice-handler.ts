import { deleteVoice } from "#drizzle/queries/voices.js";
import type { MenuContext } from "#root/bot/context.js";
import { escapeHTML } from "#root/bot/helpers/html.js";
import { closeMenuHandler } from "./close-menu-handler.ts";

export async function deleteVoiceHandler(ctx: MenuContext) {
    const currentVoice = ctx.session.currentVoice;
    if (!currentVoice) {
        return;
    }

    const voiceId = currentVoice.id;
    const deletedVoice = await deleteVoice(voiceId);
    const messageId = deletedVoice
        ? "voices-delete-success"
        : "voices-delete-failed";

    await closeMenuHandler(ctx);
    return ctx.reply(
        ctx.t(messageId, {
            voiceTitle: escapeHTML(
                deletedVoice?.voiceTitle ?? currentVoice.title,
            ),
        }),
    );
}
