import type { MenuContext } from "#root/bot/context.js";

type PrevHandlerData = {
    currentOffset: number;
    elementsPerPage: number;
    offsetUpdate: (newOffset: number) => void;
};

export async function genericPrevHandler(
    ctx: MenuContext,
    data: PrevHandlerData,
) {
    const { currentOffset, elementsPerPage, offsetUpdate } = data;

    if (currentOffset === 0) {
        return ctx.callbackQuery?.answer({
            text: ctx.t("menu.alreadyPrev"),
            show_alert: true,
        });
    }

    const newOffset = currentOffset - elementsPerPage;
    offsetUpdate(newOffset < 0 ? 0 : newOffset);

    await ctx.menu.update({
        immediate: true,
    });
    return ctx.callbackQuery?.answer();
}
