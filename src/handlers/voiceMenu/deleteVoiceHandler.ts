import { deleteVoice } from "@/src/database/general/voices/deleteVoice";

import { closeMenuHandler } from "@/src/handlers/voiceMenu/closeMenuHandler";

import type { MenuBotContext } from "@/src/types/bot";

export async function deleteVoiceHandler(ctx: MenuBotContext) {
    if (!ctx.session.currentVoice) return;

    const voiceID = ctx.session.currentVoice.id;
    const deleteStatus = await deleteVoice(voiceID);
    const translationPath = deleteStatus ? "Success" : "Failure";

    await closeMenuHandler(ctx);
    await ctx.reply(ctx.t(`voices.deleted${translationPath}`));
}
