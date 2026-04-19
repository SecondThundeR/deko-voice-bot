import { Composer } from "grammy";
import { toggleFeatureFlag } from "@/drizzle/queries/update";
import { MAINTENANCE_FEATURE_FLAG } from "../constants/feature-flags";
import type { Context } from "../context";
import { isAdmin } from "../filter/is-admin";
import { logHandle } from "../helpers/logging";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command(
    "maintenance",
    logHandle("command-maintenance"),
    async (ctx) => {
        const maintenanceStatus = await toggleFeatureFlag(
            MAINTENANCE_FEATURE_FLAG,
        );
        if (maintenanceStatus === null) {
            return await ctx.reply(ctx.t("featureFlag.missing"));
        }

        const translationPath = maintenanceStatus ? "enabled" : "disabled";
        await ctx.reply(ctx.t(`maintenance.${translationPath}`));
    },
);

export { composer as maintenanceFeature };
