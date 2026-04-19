import type { MenuContext } from "../../context";
import { UPDATE_VOICE_FILE_CONVERSATION } from "../../conversations/update-voice-file";
import { genericCloseHandler } from "../generic/generic-close-handler";

export async function updateVoiceDataHandler(ctx: MenuContext) {
    await genericCloseHandler(ctx);
    await ctx.conversation.enter(UPDATE_VOICE_FILE_CONVERSATION);
}
