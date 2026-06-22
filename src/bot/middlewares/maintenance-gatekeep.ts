import type { Middleware } from "grammy";
import { getFeatureFlag } from "#drizzle/queries/select.js";
import { MAINTENANCE_FEATURE_FLAG } from "#root/bot/constants/feature-flags.js";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import {
    getCachedMaintenanceFeatureFlag,
    isMaintenanceActive,
    setCachedMaintenanceFeatureFlag,
} from "#root/bot/store/maintenance.js";

export function maintenanceGatekeep(): Middleware<Context> {
    return async (ctx, next) => {
        if (isAdmin(ctx)) {
            return next();
        }

        let maintenanceFeatureFlagStatus = getCachedMaintenanceFeatureFlag();

        if (maintenanceFeatureFlagStatus === null) {
            maintenanceFeatureFlagStatus =
                (await getFeatureFlag(MAINTENANCE_FEATURE_FLAG)) ?? false;
            setCachedMaintenanceFeatureFlag(maintenanceFeatureFlagStatus);
        }

        const isInMaintenance =
            maintenanceFeatureFlagStatus || isMaintenanceActive();
        if (!isInMaintenance) {
            return next();
        }

        if (ctx.inlineQuery) {
            return ctx.answerInlineQuery([], {
                button: {
                    text: ctx.t("maintenance.inline-button"),
                    start_parameter: MAINTENANCE_FEATURE_FLAG,
                },
                cache_time: 30,
                is_personal: true,
            });
        }

        const translationPath =
            ctx.match === MAINTENANCE_FEATURE_FLAG ? "Inline" : "Chat";
        return ctx.reply(ctx.t(`maintenance.description${translationPath}`));
    };
}
