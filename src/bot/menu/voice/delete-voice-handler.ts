import { deleteVoiceByIdQuery } from "@/drizzle/prepared/voices";
import type { MenuContext } from "../../context";
import { closeMenuHandler } from "./close-menu-handler";

export async function deleteVoiceHandler(ctx: MenuContext) {
    if (!ctx.session.currentVoice) {
        return;
    }

    const voiceId = ctx.session.currentVoice.id;
    const [deleteData] = await deleteVoiceByIdQuery.execute({ voiceId });
    const translationPath = deleteData.voiceTitle ? "Success" : "Failure";

    await closeMenuHandler(ctx);
    return ctx.reply(
        ctx.t(`voices.deleted${translationPath}`, {
            voiceTitle: deleteData.voiceTitle,
        }),
    );
}
