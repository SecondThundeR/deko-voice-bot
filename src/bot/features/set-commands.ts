import { chatAction } from "@grammyjs/auto-chat-action";
import { Composer } from "grammy";
import type { Context } from "@/bot/context";
import { isAdmin } from "@/bot/filter/is-admin";
import { setCommandsHandler } from "@/bot/handlers/commands/set-commands";
import { logHandle } from "@/bot/helpers/logging";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command(
    "setcommands",
    logHandle("command-setcommands"),
    chatAction("typing"),
    setCommandsHandler,
);

export { composer as setCommandsFeature };
