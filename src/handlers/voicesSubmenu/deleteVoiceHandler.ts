import { deleteVoice } from "@/src/database/general/voices/deleteVoice.ts";

import { genericBackHandler } from "@/src/handlers/menu/genericBackHandler.ts";

import type { MenuBotContext } from "@/src/types/bot.ts";

export async function deleteVoiceHandler(ctx: MenuBotContext) {
    if (!ctx.session.currentVoice) return;

    const voiceID = ctx.session.currentVoice.id;
    const filteredVoices = (ctx.session.currentVoices ?? []).filter((voice) =>
        voice.id !== voiceID
    );

    await deleteVoice(voiceID);

    genericBackHandler(ctx, (ctx) => {
        ctx.session.currentVoice = null;
        ctx.session.currentVoices = filteredVoices;
        ctx.session.currentVoicesOffset = 0;
    });
}
