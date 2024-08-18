import { deleteVoiceByIdQuery } from "@/drizzle/prepared/voices";

import { closeMenuHandler } from "@/src/handlers/voiceMenu/closeMenuHandler";

import type { MenuBotContext } from "@/src/types/bot";

export async function deleteVoiceHandler(ctx: MenuBotContext) {
    if (!ctx.session.currentVoice) return;

    const voiceId = ctx.session.currentVoice.id;
    const [deleteData] = await deleteVoiceByIdQuery.execute({ voiceId });
    const translationPath = deleteData.voiceId ? "Success" : "Failure";

    await closeMenuHandler(ctx);
    await ctx.reply(ctx.t(`voices.deleted${translationPath}`));
}
