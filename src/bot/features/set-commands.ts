import { chatAction } from "@grammyjs/auto-chat-action";
import { Composer } from "grammy";
import type { Context } from "../context";
import { isAdmin } from "../filter/is-admin";
import { setCommandsHandler } from "../handlers/commands/set-commands";
import { logHandle } from "../helpers/logging";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command(
    "setcommands",
    logHandle("command-setcommands"),
    chatAction("typing"),
    setCommandsHandler,
);

export { composer as setCommandsFeature };
