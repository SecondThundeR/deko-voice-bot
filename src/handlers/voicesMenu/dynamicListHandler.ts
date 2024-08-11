import type { MenuRange } from "@grammyjs/menu";

import { MAX_MENU_ELEMENTS_PER_PAGE } from "@/src/constants/inline";

import { genericListHandler } from "@/src/handlers/menu/genericListHandler";

import type { BotContext } from "@/src/types/bot";

export function dynamicListHandler(
    ctx: BotContext,
    range: MenuRange<BotContext>,
) {
    const { currentVoicesOffset, currentVoices } = ctx.session;

    genericListHandler(range, {
        menuElements: currentVoices,
        currentOffset: currentVoicesOffset,
        elementsPerPage: MAX_MENU_ELEMENTS_PER_PAGE,
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
