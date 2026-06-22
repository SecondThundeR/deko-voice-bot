import type { MenuRange } from "@grammyjs/menu";

import type { Context } from "#root/bot/context.js";

type GenericListHandlerData<T> = {
    menuElements: T[] | null | undefined;
    currentOffset: number;
    elementsPerPage: number;
    forEachCallback: (range: MenuRange<Context>, element: T) => void;
};

export function genericListHandler<T>(
    range: MenuRange<Context>,
    data: GenericListHandlerData<T>,
) {
    const { menuElements, currentOffset, elementsPerPage, forEachCallback } =
        data;
    if (!menuElements) {
        return;
    }

    const newOffset = currentOffset + elementsPerPage;
    const indexLimit =
        newOffset > menuElements.length ? menuElements.length : newOffset;

    menuElements.slice(currentOffset, indexLimit).forEach((favoriteItem) => {
        forEachCallback(range, favoriteItem);
    });
}
