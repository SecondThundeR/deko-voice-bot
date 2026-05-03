import { toggleFeatureFlag } from "drizzle/queries/update";
import { Composer } from "grammy";
import { MAINTENANCE_FEATURE_FLAG } from "@/bot/constants/feature-flags";
import type { Context } from "@/bot/context";
import { isAdmin } from "@/bot/filter/is-admin";
import { logHandle } from "@/bot/helpers/logging";
import { setCachedMaintenanceFeatureFlag } from "@/bot/store/maintenance";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command(
    "maintenance",
    logHandle("command-maintenance"),
    async (ctx) => {
        const maintenanceStatus = await toggleFeatureFlag(
            MAINTENANCE_FEATURE_FLAG,
        );

        setCachedMaintenanceFeatureFlag(maintenanceStatus);

        const translationPath = maintenanceStatus ? "enabled" : "disabled";
        return ctx.reply(ctx.t(`maintenance.${translationPath}`));
    },
);

export { composer as maintenanceFeature };
