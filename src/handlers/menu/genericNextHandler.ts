import type { MenuBotContext } from "@/src/types/bot";

type NextHandlerData<T> = {
    menuElements: T[] | null | undefined;
    currentOffset: number;
    elementsPerPage: number;
    offsetUpdate: (newOffset: number) => void;
};

export async function genericNextHandler<T>(
    ctx: MenuBotContext,
    data: NextHandlerData<T>,
) {
    const { menuElements, currentOffset, elementsPerPage, offsetUpdate } = data;

    if (!menuElements) {
        return await ctx.answerCallbackQuery({
            text: ctx.t("menu.failedToGetSessionData"),
            show_alert: true,
        });
    }

    const newOffset = currentOffset + elementsPerPage;
    if (newOffset >= menuElements.length) {
        return await ctx.answerCallbackQuery({
            text: ctx.t("menu.alreadyNext"),
            show_alert: true,
        });
    }

    offsetUpdate(newOffset);
    await ctx.menu.update({
        immediate: true,
    });
    await ctx.answerCallbackQuery();
}
