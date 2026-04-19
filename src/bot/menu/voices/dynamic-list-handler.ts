import type { MenuRange } from "@grammyjs/menu";
import { MAX_MENU_ELEMENTS_PER_PAGE } from "../../constants/inline";
import type { Context } from "../../context";
import { genericListHandler } from "../generic/generic-list-handler";

export function dynamicListHandler(ctx: Context, range: MenuRange<Context>) {
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
