import { Menu, type MenuRange } from "@grammyjs/menu";

import type { Context, MenuContext } from "#root/bot/context.js";
import { genericCloseHandler } from "./generic-close-handler.ts";
import { genericOutdatedHandler } from "./generic-outdated-handler.ts";

type PaginatedMenuOptions = {
    elementsPerPage: number;
    fingerprint: (ctx: Context) => Promise<string> | string;
    getCurrentOffset: (ctx: Context) => number;
    getTotalElements: () => Promise<number>;
    hasElements: () => Promise<boolean>;
    id: string;
    leadingAction?: {
        handler: (ctx: MenuContext) => Promise<unknown> | unknown;
        label: (ctx: Context) => string;
    };
    render: (ctx: Context, range: MenuRange<Context>) => Promise<void> | void;
    reset: (ctx: Context) => void;
    setCurrentOffset: (ctx: Context, offset: number) => void;
};

export function createPaginatedMenu({
    elementsPerPage,
    fingerprint,
    getCurrentOffset,
    getTotalElements,
    hasElements,
    id,
    leadingAction,
    render,
    reset,
    setCurrentOffset,
}: PaginatedMenuOptions) {
    const menu = new Menu<Context>(id, {
        autoAnswer: false,
        fingerprint,
        onMenuOutdated: async (ctx) =>
            genericOutdatedHandler(ctx, {
                menuElement: await hasElements(),
            }),
    });

    if (leadingAction) {
        menu.text(leadingAction.label, leadingAction.handler).row();
    }

    return menu
        .dynamic(render)
        .row()
        .text(
            (ctx) => ctx.t("menu-previous-button"),
            async (ctx) => {
                const currentOffset = getCurrentOffset(ctx);
                if (currentOffset === 0) {
                    return ctx.callbackQuery.answer({
                        text: ctx.t("menu-already-first-page"),
                        show_alert: true,
                    });
                }

                setCurrentOffset(
                    ctx,
                    Math.max(0, currentOffset - elementsPerPage),
                );
                await ctx.menu.update({ immediate: true });
                return ctx.callbackQuery.answer();
            },
        )
        .text(
            (ctx) => ctx.t("menu-close-button"),
            (ctx) => genericCloseHandler(ctx, reset),
        )
        .text(
            (ctx) => ctx.t("menu-next-button"),
            async (ctx) => {
                const nextOffset = getCurrentOffset(ctx) + elementsPerPage;
                if (nextOffset >= (await getTotalElements())) {
                    return ctx.callbackQuery.answer({
                        text: ctx.t("menu-no-next-page"),
                        show_alert: true,
                    });
                }

                setCurrentOffset(ctx, nextOffset);
                await ctx.menu.update({ immediate: true });
                return ctx.callbackQuery.answer();
            },
        );
}
