import { getVoicesCount } from "#drizzle/queries/select.js";
import type { MenuContext } from "#root/bot/context.js";
import { genericOutdatedHandler } from "../generic/generic-outdated-handler.ts";

export async function outdatedHandler(ctx: MenuContext) {
    const hasVoices = (await getVoicesCount()) > 0;

    return genericOutdatedHandler(ctx, {
        menuElement: hasVoices,
    });
}
