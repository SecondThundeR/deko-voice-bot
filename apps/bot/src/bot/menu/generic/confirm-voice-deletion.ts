import type { MenuContext } from "#root/bot/context.js";

export async function confirmVoiceDeletion(ctx: MenuContext) {
    const voice = ctx.session.currentVoice;
    if (!voice) return null;

    const confirmation = `${voice.id}:${voice.title}`;
    if (ctx.session.deleteVoiceConfirmation !== confirmation) {
        ctx.session.deleteVoiceConfirmation = confirmation;
        await ctx.menu.update({ immediate: true });
        await ctx.answerCallbackQuery();
        return null;
    }

    ctx.session.deleteVoiceConfirmation = null;
    return voice;
}
