import {
    deleteVoice,
    getVoicesCount,
} from "@deko-voice-bot/database/queries/voices.js";
import type { MenuContext } from "#root/bot/context.js";
import { confirmVoiceDeletion } from "../generic/confirm-voice-deletion.ts";
import { genericBackHandler } from "../generic/generic-back-handler.ts";

export async function deleteVoiceHandler(ctx: MenuContext) {
    const currentVoice = await confirmVoiceDeletion(ctx);
    if (!currentVoice) return;

    const deletedVoice = await deleteVoice(currentVoice.id);
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
