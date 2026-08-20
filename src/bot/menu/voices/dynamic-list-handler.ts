import type { MenuRange } from "@grammyjs/menu";
import type { Context } from "#root/bot/context.js";
import { getVoicesMenuPage } from "#root/bot/helpers/menu.js";

export async function dynamicListHandler(
    ctx: Context,
    range: MenuRange<Context>,
) {
    const currentVoices = await getVoicesMenuPage(ctx);

    for (const voiceItem of currentVoices) {
        const { title } = voiceItem;

        range
            .submenu(
                title,
                "voice-submenu",
                (ctx) => (ctx.session.currentVoice = voiceItem),
            )
            .row();
    }
}
