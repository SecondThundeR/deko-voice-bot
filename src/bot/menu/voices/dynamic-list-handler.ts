import type { MenuRange } from "@grammyjs/menu";
import type { Context } from "../../context";
import { getVoicesMenuPage } from "../../helpers/menu";
import { genericListHandler } from "../generic/generic-list-handler";

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
