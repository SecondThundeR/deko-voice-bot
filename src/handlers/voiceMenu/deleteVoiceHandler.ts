import { deleteVoice } from "@/src/database/general/voices/deleteVoice.ts";

import { closeMenuHandler } from "./closeMenuHandler.ts";

import type { MenuBotContext } from "@/src/types/bot.ts";

export async function deleteVoiceHandler(ctx: MenuBotContext) {
    if (!ctx.session.currentVoice) return;

    const voiceID = ctx.session.currentVoice.id;
    await deleteVoice(voiceID);
    await closeMenuHandler(ctx);
}
