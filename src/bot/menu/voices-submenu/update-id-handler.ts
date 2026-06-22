import type { MenuContext } from "#root/bot/context.js";
import { UPDATE_VOICE_ID_CONVERSATION } from "#root/bot/conversations/update-voice-id.js";
import { genericCloseHandler } from "../generic/generic-close-handler.ts";

export async function updateIDHandler(ctx: MenuContext) {
    await genericCloseHandler(ctx);
    return ctx.conversation.enter(UPDATE_VOICE_ID_CONVERSATION);
}
