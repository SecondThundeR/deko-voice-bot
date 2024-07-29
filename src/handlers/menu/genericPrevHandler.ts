import type { MenuBotContext } from "@/src/types/bot";

type PrevHandlerData = {
    currentOffset: number;
    elementsPerPage: number;
    offsetUpdate: (newOffset: number) => void;
};

export async function genericPrevHandler(
    ctx: MenuBotContext,
    data: PrevHandlerData,
) {
    const { currentOffset, elementsPerPage, offsetUpdate } = data;

    if (currentOffset === 0) {
        await ctx.answerCallbackQuery({
            text: ctx.t("menu.alreadyPrev"),
            show_alert: true,
        });
        return;
    }

    const newOffset = currentOffset - elementsPerPage;
    offsetUpdate(newOffset < 0 ? 0 : newOffset);

    await ctx.menu.update({
        immediate: true,
    });
    await ctx.answerCallbackQuery();
}
