import type { MenuContext } from "@/bot/context";
import { UPDATE_VOICE_TITLE_CONVERSATION } from "@/bot/conversations/update-voice-title";
import { genericCloseHandler } from "../generic/generic-close-handler";

export async function updateTitleHandler(ctx: MenuContext) {
    await genericCloseHandler(ctx);
    return ctx.conversation.enter(UPDATE_VOICE_TITLE_CONVERSATION);
}
