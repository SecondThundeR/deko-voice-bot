import type { MenuContext } from "@/bot/context";
import { UPDATE_VOICE_FILE_CONVERSATION } from "@/bot/conversations/update-voice-file";
import { genericCloseHandler } from "../generic/generic-close-handler";

export async function updateVoiceDataHandler(ctx: MenuContext) {
    await genericCloseHandler(ctx);
    return ctx.conversation.enter(UPDATE_VOICE_FILE_CONVERSATION);
}
