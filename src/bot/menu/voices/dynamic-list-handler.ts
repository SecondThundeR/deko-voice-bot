import type { MenuRange } from "@grammyjs/menu";
import type { Context } from "#root/bot/context.js";
import { getVoicesMenuPage } from "#root/bot/helpers/menu.js";
import { genericListHandler } from "../generic/generic-list-handler.ts";

export async function dynamicListHandler(
    ctx: Context,
    range: MenuRange<Context>,
) {
    const currentVoices = await getVoicesMenuPage(ctx);

    genericListHandler(range, {
        menuElements: currentVoices,
        currentOffset: 0,
        elementsPerPage: currentVoices.length,
        forEachCallback: (range, voiceItem) => {
            const { title } = voiceItem;

            range
                .submenu(
                    title,
                    "voice-submenu",
                    (ctx) => (ctx.session.currentVoice = voiceItem),
                )
                .row();
        },
    });
}
