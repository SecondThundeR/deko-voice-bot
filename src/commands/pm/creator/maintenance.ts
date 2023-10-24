import { Composer } from "@/deps.ts";

import { featureFlags } from "@/src/constants/database.ts";
import { locale } from "@/src/constants/locale.ts";
import { toggleFeatureFlag } from "@/src/database/general/featureFlags/toggleFeatureFlag.ts";

const maintenanceCommand = new Composer();

const { enabled, disabled } = locale.frontend.maintenance;

maintenanceCommand.command("maintenance", async (ctx) => {
    const { status } = await toggleFeatureFlag(featureFlags.maintenance);
    return await ctx.reply(status ? enabled : disabled);
});

export { maintenanceCommand };
