import { Composer } from "@/deps.ts";

import { featureFlags } from "@/src/constants/database.ts";

import { toggleFeatureFlag } from "@/src/helpers/database.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const maintenanceCommand = new Composer<BotContext>();

maintenanceCommand.command("maintenance", async (ctx) => {
    const maintenanceStatus = await toggleFeatureFlag(
        featureFlags.maintenance,
    );
    const translationPath = maintenanceStatus ? "enabled" : "disabled";

    await ctx.reply(ctx.t(`maintenance.${translationPath}`));
});
