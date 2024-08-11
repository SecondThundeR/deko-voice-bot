import { featureFlags } from "@/src/constants/database";

import { getFeatureFlag } from "@/src/database/general/featureFlags/getFeatureFlag";

import type { BotContext } from "@/src/types/bot";

export async function maintenanceGatekeep(
    ctx: BotContext,
    next: () => Promise<void>,
) {
    const isInMaintenance = await getFeatureFlag(featureFlags.maintenance);
    const isCalledByCreator = ctx.config.isCreator;
    const isTriggeredByInlineQuery = ctx.inlineQuery !== undefined;
    const isGatekeepSkipped = isCalledByCreator || !isInMaintenance;

    if (isGatekeepSkipped) {
        await next();
        return;
    }

    if (isTriggeredByInlineQuery) {
        await ctx.answerInlineQuery([], {
            button: {
                text: ctx.t("maintenance.inline-button"),
                start_parameter: featureFlags.maintenance,
            },
            cache_time: 0,
        });
        return;
    }

    if (ctx.hasCommand("start") && ctx.match === featureFlags.maintenance) {
        await ctx.reply(ctx.t("maintenance.description-inline"));
        return;
    }

    await ctx.reply(ctx.t("maintenance.description-chat"));
}
