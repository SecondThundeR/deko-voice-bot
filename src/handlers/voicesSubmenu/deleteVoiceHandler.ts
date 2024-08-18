import { deleteVoiceByIdQuery } from "@/drizzle/prepared/voices";

import { genericBackHandler } from "@/src/handlers/menu/genericBackHandler";

import type { MenuBotContext } from "@/src/types/bot";

export async function deleteVoiceHandler(ctx: MenuBotContext) {
    if (!ctx.session.currentVoice) return;

    const voiceId = ctx.session.currentVoice.id;
    const currentVoices = ctx.session.currentVoices ?? [];
    const filteredVoices = currentVoices.filter(
        (voice) => voice.id !== voiceId,
    );
    const shouldDeleteMessage = filteredVoices.length === 0;

    await deleteVoiceByIdQuery.execute({ voiceId });
    await genericBackHandler(
        ctx,
        (ctx) => {
            ctx.session.currentVoice = null;
            ctx.session.currentVoices = filteredVoices;
            ctx.session.currentVoicesOffset = 0;
        },
        shouldDeleteMessage,
    );
}
