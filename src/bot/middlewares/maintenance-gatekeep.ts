import type { Middleware } from "grammy";
import { getFeatureFlag } from "@/drizzle/queries/select";

import { MAINTENANCE_FEATURE_FLAG } from "../constants/feature-flags";
import type { Context } from "../context";
import { isAdmin } from "../filter/is-admin";
import {
    getCachedMaintenanceFeatureFlag,
    isMaintenanceActive,
    setCachedMaintenanceFeatureFlag,
} from "../store/maintenance";

export function maintenanceGatekeep(): Middleware<Context> {
    return async (ctx, next) => {
        if (isAdmin(ctx)) return await next();

        let maintenanceFeatureFlagStatus = getCachedMaintenanceFeatureFlag();

        if (maintenanceFeatureFlagStatus === null) {
            maintenanceFeatureFlagStatus =
                (await getFeatureFlag(MAINTENANCE_FEATURE_FLAG)) ?? false;
            setCachedMaintenanceFeatureFlag(maintenanceFeatureFlagStatus);
        }

        const isInMaintenance =
            maintenanceFeatureFlagStatus || isMaintenanceActive();
        if (!isInMaintenance) return await next();

        if (ctx.inlineQuery) {
            return await ctx.answerInlineQuery([], {
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
        await ctx.reply(ctx.t(`maintenance.description${translationPath}`));
    };
}
