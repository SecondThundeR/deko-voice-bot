import type { MenuContext } from "../../context";
import { UPDATE_VOICE_ID_CONVERSATION } from "../../conversations/update-voice-id";
import { genericCloseHandler } from "../generic/generic-close-handler";

export async function updateIDHandler(ctx: MenuContext) {
    await genericCloseHandler(ctx);
    await ctx.conversation.enter(UPDATE_VOICE_ID_CONVERSATION);
}
