import { getVoicesCount } from "#drizzle/queries/voices.js";
import { MAX_MENU_ELEMENTS_PER_PAGE } from "#root/bot/constants/inline.js";
import type { Context, MenuContext } from "#root/bot/context.js";
import { getVoicesMenuIdentificator } from "#root/bot/helpers/menu.js";
import { createPaginatedMenu } from "./generic/create-paginated-menu.ts";
import { createVoiceActionsMenu } from "./generic/create-voice-actions-menu.ts";
import { genericBackHandler } from "./generic/generic-back-handler.ts";
import { dynamicListHandler } from "./voices/dynamic-list-handler.ts";
import { deleteVoiceHandler } from "./voices-submenu/delete-voice-handler.ts";

export const voicesMenu = createPaginatedMenu({
    id: "voices-menu",
    elementsPerPage: MAX_MENU_ELEMENTS_PER_PAGE,
    fingerprint: getVoicesMenuIdentificator,
    getCurrentOffset: (ctx) => ctx.session.currentVoicesOffset,
    getTotalElements: getVoicesCount,
    hasElements: async () => (await getVoicesCount()) > 0,
    render: dynamicListHandler,
    reset: (ctx: Context) => {
        ctx.session.currentVoicesOffset = 0;
    },
    setCurrentOffset: (ctx, offset) => {
        ctx.session.currentVoicesOffset = offset;
    },
});

const voicesSubmenu = createVoiceActionsMenu({
    id: "voice-submenu",
    deleteVoice: deleteVoiceHandler,
    finalAction: {
        label: (ctx: Context) => ctx.t("menu-back-button"),
        handler: (ctx: MenuContext) =>
            genericBackHandler(ctx, (ctx) => {
                ctx.session.currentVoice = null;
            }),
    },
});

voicesMenu.register(voicesSubmenu);
