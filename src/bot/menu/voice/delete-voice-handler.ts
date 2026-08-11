import { deleteVoice } from "#drizzle/queries/voices.js";
import type { MenuContext } from "#root/bot/context.js";
import { closeMenuHandler } from "./close-menu-handler.ts";

export async function deleteVoiceHandler(ctx: MenuContext) {
    const currentVoice = ctx.session.currentVoice;
    if (!currentVoice) {
        return;
    }

    const voiceId = currentVoice.id;
    const deletedVoice = await deleteVoice(voiceId);
    const translationPath = deletedVoice ? "Success" : "Failure";

    await closeMenuHandler(ctx);
    return ctx.reply(
        ctx.t(`voices.deleted${translationPath}`, {
            voiceTitle: deletedVoice?.voiceTitle ?? currentVoice.title,
        }),
    );
}
