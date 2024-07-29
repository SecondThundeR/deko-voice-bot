import type { BotContext } from "@/src/types/bot";

export function updateVoiceLabelHandler(ctx: BotContext) {
    const translationPath =
        ctx.session.currentVoice?.voice_file_id !== undefined ? "File" : "URL";

    return ctx.t(`voices.update${translationPath}`);
}
