import type { MenuRange } from "@/deps.ts";

import { maxMenuElementsPerPage } from "@/src/constants/inline.ts";

import { genericListHandler } from "@/src/handlers/menu/genericListHandler.ts";

import type { BotContext } from "@/src/types/bot.ts";

export function dynamicListHandler(
    ctx: BotContext,
    // @ts-expect-error I wish this types won't conflict ever again
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
                    (ctx) => ctx.session.currentVoice = voiceItem,
                )
                .row();
        },
    });
}
