import { deleteVoiceByIdQuery } from "@/drizzle/prepared/voices";
import { getVoicesCount } from "@/drizzle/queries/select";
import type { MenuContext } from "../../context";
import { genericBackHandler } from "../generic/generic-back-handler";

export async function deleteVoiceHandler(ctx: MenuContext) {
    if (!ctx.session.currentVoice) return;

    const voiceId = ctx.session.currentVoice.id;

    await deleteVoiceByIdQuery.execute({ voiceId });
    const shouldDeleteMessage = (await getVoicesCount()) === 0;

    await genericBackHandler(
        ctx,
        (ctx) => {
            ctx.session.currentVoice = null;
            ctx.session.currentVoicesOffset = 0;
        },
        shouldDeleteMessage,
    );
}
