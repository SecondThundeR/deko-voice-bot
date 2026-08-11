import { Menu, type MenuRange } from "@grammyjs/menu";

import type { Context, MenuContext } from "#root/bot/context.js";
import { genericCloseHandler } from "./generic-close-handler.ts";
import { genericNextHandler } from "./generic-next-handler.ts";
import { genericOutdatedHandler } from "./generic-outdated-handler.ts";
import { genericPrevHandler } from "./generic-prev-handler.ts";

type PaginatedMenuOptions = {
    elementsPerPage: number;
    fingerprint: (ctx: Context) => Promise<string> | string;
    getCurrentOffset: (ctx: Context) => number;
    getTotalElements: () => Promise<number>;
    hasElements: () => Promise<boolean>;
    id: string;
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
    render,
    reset,
    setCurrentOffset,
}: PaginatedMenuOptions) {
    return new Menu<Context>(id, {
        autoAnswer: false,
        fingerprint,
        onMenuOutdated: async (ctx) =>
            genericOutdatedHandler(ctx, {
                menuElement: await hasElements(),
            }),
    })
        .dynamic(render)
        .row()
        .text(
            (ctx) => ctx.t("menu-previous-button"),
            (ctx: MenuContext) =>
                genericPrevHandler(ctx, {
                    currentOffset: getCurrentOffset(ctx),
                    elementsPerPage,
                    offsetUpdate: (offset) => setCurrentOffset(ctx, offset),
                }),
        )
        .text(
            (ctx) => ctx.t("menu-close-button"),
            (ctx) => genericCloseHandler(ctx, reset),
        )
        .text(
            (ctx) => ctx.t("menu-next-button"),
            async (ctx: MenuContext) =>
                genericNextHandler(ctx, {
                    currentOffset: getCurrentOffset(ctx),
                    elementsPerPage,
                    offsetUpdate: (offset) => setCurrentOffset(ctx, offset),
                    totalElements: await getTotalElements(),
                }),
        );
}
