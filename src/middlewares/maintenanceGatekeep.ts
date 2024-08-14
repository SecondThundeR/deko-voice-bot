import { getFeatureFlag } from "@/drizzle/queries/select";

import { MAINTENANCE_FEATURE_FLAG } from "@/src/constants/featureFlags";

import type { BotContext } from "@/src/types/bot";

export async function maintenanceGatekeep(
    ctx: BotContext,
    next: () => Promise<void>,
) {
    const flagStatus = await getFeatureFlag(MAINTENANCE_FEATURE_FLAG);
    if (!flagStatus) {
        await next();
        return;
    }

    const isCalledByCreator = ctx.config.isCreator;
    const isTriggeredByInlineQuery = ctx.inlineQuery !== undefined;
    const isGatekeepSkipped = isCalledByCreator || !flagStatus;

    if (isGatekeepSkipped) {
        await next();
        return;
    }

    if (isTriggeredByInlineQuery) {
        await ctx.answerInlineQuery([], {
            button: {
                text: ctx.t("maintenance.inline-button"),
                start_parameter: MAINTENANCE_FEATURE_FLAG,
            },
            cache_time: 0,
        });
        return;
    }

    const translationPath =
        ctx.hasCommand("start") && ctx.match === MAINTENANCE_FEATURE_FLAG
            ? "Inline"
            : "Chat";
    await ctx.reply(ctx.t(`maintenance.description${translationPath}`));
}
