import type { MenuRange } from "@grammyjs/menu";

import { maxMenuElementsPerPage } from "@/src/constants/inline";

import { genericListHandler } from "@/src/handlers/menu/genericListHandler";

import type { BotContext } from "@/src/types/bot";

export function dynamicListHandler(
    ctx: BotContext,
    range: MenuRange<BotContext>,
) {
    const { currentVoicesOffset, currentVoices } = ctx.session;

    genericListHandler(ctx, range, {
        menuElements: currentVoices,
        currentOffset: currentVoicesOffset,
        elementsPerPage: maxMenuElementsPerPage,
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
