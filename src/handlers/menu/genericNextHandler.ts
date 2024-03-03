import type { MenuBotContext } from "@/src/types/bot.ts";

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
        await ctx.answerCallbackQuery({
            text: ctx.t("menu.failedToGetSessionData"),
            show_alert: true,
        });
        return;
    }

    const newOffset = currentOffset + elementsPerPage;
    if (newOffset >= menuElements.length) {
        await ctx.answerCallbackQuery({
            text: ctx.t("menu.alreadyNext"),
            show_alert: true,
        });
        return;
    }

    offsetUpdate(newOffset);

    await ctx.menu.update({
        immediate: true,
    });
    await ctx.answerCallbackQuery();
}
