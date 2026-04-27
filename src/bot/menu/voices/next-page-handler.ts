import { getVoicesCount } from "@/drizzle/queries/select";
import { MAX_MENU_ELEMENTS_PER_PAGE } from "../../constants/inline";
import type { MenuContext } from "../../context";
import { genericNextHandler } from "../generic/generic-next-handler";

export async function nextPageHandler(ctx: MenuContext) {
    const { currentVoicesOffset } = ctx.session;
    const totalElements = await getVoicesCount();

    await genericNextHandler(ctx, {
        currentOffset: currentVoicesOffset,
        elementsPerPage: MAX_MENU_ELEMENTS_PER_PAGE,
        offsetUpdate: (newOffset) =>
            (ctx.session.currentVoicesOffset = newOffset),
        totalElements,
    });
}
