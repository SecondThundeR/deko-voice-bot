import { Composer } from "grammy";

import { FEATURE_FLAGS } from "@/src/constants/database";

import { toggleFeatureFlag } from "@/src/database/general/featureFlags/toggleFeatureFlag";

import type { BotContext } from "@/src/types/bot";

export const maintenanceCommand = new Composer<BotContext>();

maintenanceCommand.command("maintenance", async (ctx) => {
    const maintenanceStatus = await toggleFeatureFlag(
        FEATURE_FLAGS.maintenance,
    );
    const translationPath = maintenanceStatus ? "enabled" : "disabled";

    await ctx.reply(ctx.t(`maintenance.${translationPath}`));
});
