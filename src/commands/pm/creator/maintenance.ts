import { Composer } from "@/deps.ts";

import { locale } from "@/src/constants/locale.ts";
import { toggleFeatureFlag } from "@/src/database/general/featureFlags/toggleFeatureFlag.ts";

const maintenanceCommand = new Composer();

const { enabled, disabled } = locale.frontend.maintenance;

maintenanceCommand
    .filter((ctx) => ctx.chat?.type === "private")
    .command("maintenance", async (ctx) => {
        const creatorID = Deno.env.get("CREATOR_ID");
        if (!creatorID || ctx.update.message?.from?.id !== Number(creatorID)) {
            return;
        }

        const { status } = await toggleFeatureFlag("maintenance");
        return await ctx.reply(status ? enabled : disabled);
    });

export { maintenanceCommand };
