import type { MenuContext } from "../../context";
import { genericOutdatedHandler } from "../generic/generic-outdated-handler";

export async function outdatedHandler(ctx: MenuContext) {
    await genericOutdatedHandler(ctx, {
        menuElement: ctx.session.currentVoices,
    });
}
