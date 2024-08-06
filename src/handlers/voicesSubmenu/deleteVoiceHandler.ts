import { deleteVoice } from "@/src/database/general/voices/deleteVoice";

import { genericBackHandler } from "@/src/handlers/menu/genericBackHandler";

import type { MenuBotContext } from "@/src/types/bot";

export async function deleteVoiceHandler(ctx: MenuBotContext) {
    if (!ctx.session.currentVoice) return;

    const voiceID = ctx.session.currentVoice.id;
    const filteredVoices = (ctx.session.currentVoices ?? []).filter(
        (voice) => voice.id !== voiceID,
    );
    const shouldDeleteMessage = filteredVoices.length === 0;

    await deleteVoice(voiceID);

    genericBackHandler(
        ctx,
        (ctx) => {
            ctx.session.currentVoice = null;
            ctx.session.currentVoices = filteredVoices;
            ctx.session.currentVoicesOffset = 0;
        },
        shouldDeleteMessage,
    );
}
