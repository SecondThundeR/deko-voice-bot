import type { MenuContext } from "@/bot/context";
import { UPDATE_VOICE_ID_CONVERSATION } from "@/bot/conversations/update-voice-id";
import { genericCloseHandler } from "../generic/generic-close-handler";

export async function updateIDHandler(ctx: MenuContext) {
    await genericCloseHandler(ctx);
    return ctx.conversation.enter(UPDATE_VOICE_ID_CONVERSATION);
}
