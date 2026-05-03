import { getVoicesCount } from "drizzle/queries/select";
import type { MenuContext } from "@/bot/context";
import { genericOutdatedHandler } from "../generic/generic-outdated-handler";

export async function outdatedHandler(ctx: MenuContext) {
    const hasVoices = (await getVoicesCount()) > 0;

    return genericOutdatedHandler(ctx, {
        menuElement: hasVoices,
    });
}
