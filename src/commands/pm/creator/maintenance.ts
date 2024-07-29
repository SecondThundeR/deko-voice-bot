import { Composer } from "grammy";

import { featureFlags } from "@/src/constants/database";

import { toggleFeatureFlag } from "@/src/helpers/database";

import type { BotContext } from "@/src/types/bot";

export const maintenanceCommand = new Composer<BotContext>();

maintenanceCommand.command("maintenance", async (ctx) => {
    const maintenanceStatus = await toggleFeatureFlag(featureFlags.maintenance);
    const translationPath = maintenanceStatus ? "enabled" : "disabled";

    await ctx.reply(ctx.t(`maintenance.${translationPath}`));
});
