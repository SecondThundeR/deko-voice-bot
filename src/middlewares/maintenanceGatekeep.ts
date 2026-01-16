import type { NextFunction } from "grammy";

import { getFeatureFlag } from "@/drizzle/queries/select";

import { MAINTENANCE_FEATURE_FLAG } from "@/src/constants/featureFlags";

import { isDatabaseMaintenanceActive } from "@/src/store/databaseMaintenance";

import type { BotContext } from "@/src/types/bot";

export async function maintenanceGatekeep(ctx: BotContext, next: NextFunction) {
    const { isAdmin } = ctx.config;
    if (isAdmin) return await next();

    const isInMaintenance =
        (await getFeatureFlag(MAINTENANCE_FEATURE_FLAG)) ||
        isDatabaseMaintenanceActive();
    if (!isInMaintenance) return await next();

    if (!!ctx.inlineQuery) {
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
}
