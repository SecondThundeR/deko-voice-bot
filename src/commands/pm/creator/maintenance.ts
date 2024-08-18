import { Composer } from "grammy";

import { toggleFeatureFlag } from "@/drizzle/queries/update";

import { MAINTENANCE_FEATURE_FLAG } from "@/src/constants/featureFlags";

import type { BotContext } from "@/src/types/bot";

export const maintenanceCommand = new Composer<BotContext>();

maintenanceCommand.command("maintenance", async (ctx) => {
    const maintenanceStatus = await toggleFeatureFlag(MAINTENANCE_FEATURE_FLAG);
    if (maintenanceStatus === null) {
        await ctx.reply(ctx.t("featureFlag.missing"));
        return;
    }

    const translationPath = maintenanceStatus ? "enabled" : "disabled";
    await ctx.reply(ctx.t(`maintenance.${translationPath}`));
});
