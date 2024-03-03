import { deleteVoice } from "@/src/database/general/voices/deleteVoice.ts";

import { closeMenuHandler } from "@/src/handlers/voiceMenu/closeMenuHandler.ts";

import type { MenuBotContext } from "@/src/types/bot.ts";

export async function deleteVoiceHandler(ctx: MenuBotContext) {
    if (!ctx.session.currentVoice) return;

    const voiceID = ctx.session.currentVoice.id;
    const status = await deleteVoice(voiceID);
    const translationPath = status ? "Success" : "Failure";

    await closeMenuHandler(ctx);
    await ctx.reply(ctx.t(`voices.deleted${translationPath}`));
}
