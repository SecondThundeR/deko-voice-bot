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
): Promise<void> {
    const { menuElements, currentOffset, elementsPerPage, offsetUpdate } = data;

    if (!menuElements) {
        return void await ctx.answerCallbackQuery({
            text: ctx.t("menu.failedToGetSessionData"),
            show_alert: true,
        });
    }

    const newOffset = currentOffset + elementsPerPage;
    if (newOffset >= menuElements.length) {
        return void ctx.answerCallbackQuery({
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
