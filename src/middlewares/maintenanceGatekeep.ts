import { featureFlags } from "@/src/constants/database.ts";

import { getFeatureFlag } from "@/src/database/general/featureFlags/getFeatureFlag.ts";

import type { BotContext } from "@/src/types/bot.ts";

export async function maintenanceGatekeep(
    ctx: BotContext,
    next: () => Promise<void>,
) {
    const isInMaintenance = await getFeatureFlag(featureFlags.maintenance);
    const isCalledByCreator = !!ctx.config?.isCreator;
    const isTriggeredByInlineQuery = !!ctx.inlineQuery;
    const isGatekeepSkipped = isCalledByCreator || !isInMaintenance;

    if (isGatekeepSkipped) {
        return void await next();
    }

    if (isTriggeredByInlineQuery) {
        return await ctx.answerInlineQuery([], {
            button: {
                text: ctx.t("maintenance.inline-button"),
                start_parameter: featureFlags.maintenance,
            },
            cache_time: 0,
        });
    }

    if (ctx.hasCommand("start") && ctx.match === featureFlags.maintenance) {
        return await ctx.reply(ctx.t("maintenance.description-inline"));
    }

    await ctx.reply(ctx.t("maintenance.description-chat"));
}
