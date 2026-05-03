import { deleteVoiceAndCheckHasVoices } from "drizzle/prepared/voices";
import type { MenuContext } from "@/bot/context";
import { genericBackHandler } from "../generic/generic-back-handler";

export async function deleteVoiceHandler(ctx: MenuContext) {
    if (!ctx.session.currentVoice) {
        return;
    }

    const voiceId = ctx.session.currentVoice.id;
    const hasVoices = await deleteVoiceAndCheckHasVoices(voiceId);

    await genericBackHandler(
        ctx,
        (ctx) => {
            ctx.session.currentVoice = null;
            ctx.session.currentVoicesOffset = 0;
        },
        !hasVoices,
    );

    if (!hasVoices) {
        return ctx.reply(ctx.t("voices.noData"));
    }
}
