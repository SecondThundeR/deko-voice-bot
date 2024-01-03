import { Composer } from "@/deps.ts";

import { featureFlags } from "@/src/constants/database.ts";
import { locale } from "@/src/constants/locale.ts";

import { toggleFeatureFlag } from "@/src/database/general/featureFlags/toggleFeatureFlag.ts";

const { enabled, disabled } = locale.frontend.maintenance;

export const maintenanceCommand = new Composer();

maintenanceCommand.command("maintenance", async (ctx) => {
    const status = await toggleFeatureFlag(featureFlags.maintenance);
    const replyText = status ? enabled : disabled;

    await ctx.reply(replyText);
});
