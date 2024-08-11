import type { MenuRange } from "@grammyjs/menu";

import type { BotContext } from "@/src/types/bot";

type GenericListHandlerData<T> = {
    menuElements: T[] | null | undefined;
    currentOffset: number;
    elementsPerPage: number;
    forEachCallback: (range: MenuRange<BotContext>, element: T) => void;
};

export function genericListHandler<T>(
    range: MenuRange<BotContext>,
    data: GenericListHandlerData<T>,
) {
    const { menuElements, currentOffset, elementsPerPage, forEachCallback } =
        data;
    if (!menuElements) return;

    const newOffset = currentOffset + elementsPerPage;
    const indexLimit =
        newOffset > menuElements.length ? menuElements.length : newOffset;

    menuElements
        .slice(currentOffset, indexLimit)
        .forEach((favoriteItem) => forEachCallback(range, favoriteItem));
}
