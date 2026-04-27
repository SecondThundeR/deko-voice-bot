import type { MenuContext } from "../../context";

type NextHandlerData = {
    currentOffset: number;
    elementsPerPage: number;
    offsetUpdate: (newOffset: number) => void;
    totalElements: number;
};

export async function genericNextHandler(
    ctx: MenuContext,
    data: NextHandlerData,
) {
    const { currentOffset, elementsPerPage, offsetUpdate, totalElements } =
        data;

    const newOffset = currentOffset + elementsPerPage;
    if (newOffset >= totalElements) {
        return await ctx.callbackQuery?.answer({
            text: ctx.t("menu.alreadyNext"),
            show_alert: true,
        });
    }

    offsetUpdate(newOffset);
    await ctx.menu.update({
        immediate: true,
    });
    await ctx.callbackQuery?.answer();
}
