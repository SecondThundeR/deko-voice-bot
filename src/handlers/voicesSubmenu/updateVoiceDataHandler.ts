import type { MenuBotContext } from "@/src/types/bot.ts";
import { genericCloseHandler } from "@/src/handlers/menu/genericCloseHandler.ts";

export async function updateVoiceDataHandler(ctx: MenuBotContext) {
    const conversationPath =
        ctx.session.currentVoice?.voice_file_id !== undefined ? "file" : "url";
    await genericCloseHandler(ctx);
    await ctx.conversation.enter(
        `voice-${conversationPath}-update`,
    );
}
