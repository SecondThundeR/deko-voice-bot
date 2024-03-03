import type { MenuRange } from "@/deps.ts";

import type { BotContext } from "@/src/types/bot.ts";

type GenericListHandlerData<T> = {
    menuElements: T[] | null | undefined;
    currentOffset: number;
    elementsPerPage: number;
    forEachCallback: (
        // @ts-expect-error I wish this types won't conflict ever again
        range: MenuRange<BotContext>,
        element: T,
    ) => void;
};

export function genericListHandler<T>(
    _ctx: BotContext,
    // @ts-expect-error I wish this types won't conflict ever again
    range: MenuRange<BotContext>,
    data: GenericListHandlerData<T>,
) {
    const { menuElements, currentOffset, elementsPerPage, forEachCallback } =
        data;
    if (!menuElements) return;

    const newOffset = currentOffset + elementsPerPage;
    const indexLimit = newOffset > menuElements.length
        ? menuElements.length
        : newOffset;

    menuElements.slice(currentOffset, indexLimit).forEach(
        (favoriteItem) => forEachCallback(range, favoriteItem),
    );
}
