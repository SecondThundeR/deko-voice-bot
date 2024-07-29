import { genericCloseHandler } from "@/src/handlers/menu/genericCloseHandler";

import type { MenuBotContext } from "@/src/types/bot";

export async function updateVoiceDataHandler(ctx: MenuBotContext) {
    const conversationPath =
        ctx.session.currentVoice?.voice_file_id !== undefined ? "file" : "url";

    await genericCloseHandler(ctx);
    await ctx.conversation.enter(`voice-${conversationPath}-update`);
}
