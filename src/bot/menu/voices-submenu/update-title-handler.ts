import type { MenuContext } from "../../context";
import { UPDATE_VOICE_TITLE_CONVERSATION } from "../../conversations/update-voice-title";
import { genericCloseHandler } from "../generic/generic-close-handler";

export async function updateTitleHandler(ctx: MenuContext) {
    await genericCloseHandler(ctx);
    await ctx.conversation.enter(UPDATE_VOICE_TITLE_CONVERSATION);
}
