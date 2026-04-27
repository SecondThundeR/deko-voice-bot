import { Command, CommandGroup } from "@grammyjs/commands";
import type { LanguageCode } from "@grammyjs/types";
import type { CommandContext } from "grammy";
import type { Context } from "../../context";
import { i18n } from "../../i18n";

const USER_COMMANDS = [
    "start",
    "optin",
    "optout",
    "privacy",
    "mydata",
    "favorites",
    "donate",
];

const ADMIN_COMMANDS = [
    "maintenance",
    "stats",
    "fullstats",
    "voice",
    "voices",
    "newvoices",
    "export",
    "refund",
];

function addCommandLocalizations(command: Command) {
    i18n.locales.forEach((locale) => {
        command.localize(
            locale as LanguageCode,
            command.name,
            i18n.t(locale, `${command.name}.description`),
        );
    });
    return command;
}

function addCommandToChats(command: Command, chats: number[]) {
    for (const chatId of chats) {
        command.addToScope({
            type: "chat",
            chat_id: chatId,
        });
    }
}

export async function setCommandsHandler(ctx: CommandContext<Context>) {
    const commands = new CommandGroup();

    USER_COMMANDS.forEach((commandName) => {
        const command = new Command(
            commandName,
            i18n.t("ru", `${commandName}.description`),
        ).addToScope({ type: "all_private_chats" });
        addCommandLocalizations(command);
        addCommandToChats(command, ctx.config.adminIds);

        commands.add(command);
    });

    ADMIN_COMMANDS.forEach((commandName) => {
        const command = new Command(
            commandName,
            i18n.t("ru", `${commandName}.description`),
        );
        addCommandToChats(command, ctx.config.adminIds);

        commands.add(command);
    });

    ctx.logger.debug({
        msg: "Commands data",
        commands: commands.toString()
    });
    await commands.setCommands(ctx);

    return ctx.reply(ctx.t("general.commandsUpdated"));
}
