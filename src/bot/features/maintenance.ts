import { Composer } from "grammy";
import { toggleFeatureFlag } from "#drizzle/queries/feature-flags.js";
import { MAINTENANCE_FEATURE_FLAG } from "#root/bot/constants/feature-flags.js";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { setCachedMaintenanceFeatureFlag } from "#root/bot/maintenance/state.js";

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

        const messageId = maintenanceStatus
            ? "maintenance-enabled"
            : "maintenance-disabled";
        return ctx.reply(ctx.t(messageId));
    },
);

export { composer as maintenanceFeature };
