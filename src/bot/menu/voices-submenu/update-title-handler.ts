import type { MenuContext } from "#root/bot/context.js";
import { UPDATE_VOICE_TITLE_CONVERSATION } from "#root/bot/conversations/update-voice-title.js";
import { genericCloseHandler } from "../generic/generic-close-handler.ts";

export async function updateTitleHandler(ctx: MenuContext) {
    await genericCloseHandler(ctx);
    return ctx.conversation.enter(UPDATE_VOICE_TITLE_CONVERSATION);
}
