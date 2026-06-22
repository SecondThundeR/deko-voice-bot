import type { MenuContext } from "#root/bot/context.js";
import { UPDATE_VOICE_FILE_CONVERSATION } from "#root/bot/conversations/update-voice-file.js";
import { genericCloseHandler } from "../generic/generic-close-handler.ts";

export async function updateVoiceDataHandler(ctx: MenuContext) {
    await genericCloseHandler(ctx);
    return ctx.conversation.enter(UPDATE_VOICE_FILE_CONVERSATION);
}
