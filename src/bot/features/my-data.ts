import { Composer } from "grammy";
import { getUserDataQuery } from "@/drizzle/prepared/users";
import type { Context } from "../context";
import { logHandle } from "../helpers/logging";
import { getFormattedUserData } from "../helpers/user";

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
