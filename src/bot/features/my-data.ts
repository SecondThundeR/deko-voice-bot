import { Composer } from "grammy";
import { getUserDataQuery } from "#drizzle/prepared/users.js";
import type { Context } from "#root/bot/context.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { getFormattedUserData } from "#root/bot/helpers/user.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("mydata", logHandle("command-mydata"), async (ctx) => {
    const [userData] = await getUserDataQuery.execute({ userId: ctx.from.id });
    if (!userData) {
        return ctx.reply(ctx.t("mydata.noData"));
    }

    return ctx.reply(
        ctx.t("mydata.dataMessage", getFormattedUserData(userData)),
    );
});

export { composer as mydataFeature };
