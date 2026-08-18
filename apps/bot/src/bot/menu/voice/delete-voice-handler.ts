import { deleteVoice } from "@deko-voice-bot/database/queries/voices.js";
import type { MenuContext } from "#root/bot/context.js";
import { escapeHTML } from "#root/bot/helpers/html.js";
import { confirmVoiceDeletion } from "../generic/confirm-voice-deletion.ts";
import { genericCloseHandler } from "../generic/generic-close-handler.ts";

export async function deleteVoiceHandler(ctx: MenuContext) {
    const currentVoice = await confirmVoiceDeletion(ctx);
    if (!currentVoice) return;

    const deletedVoice = await deleteVoice(currentVoice.id);
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
