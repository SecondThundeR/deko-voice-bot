import { Command, CommandGroup } from "@grammyjs/commands";
import type { CommandContext } from "grammy";
import type { Context } from "../../context";

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
            ctx.t(`${commandName}.description`),
        ).addToScope({ type: "all_private_chats" });
        addCommandToChats(command, ctx.config.adminIds);

        commands.add(command);
    });

    ADMIN_COMMANDS.forEach((commandName) => {
        const command = new Command(
            commandName,
            ctx.t(`${commandName}.description`),
        );
        addCommandToChats(command, ctx.config.adminIds);

        commands.add(command);
    });

    await commands.setCommands(ctx);

    return ctx.reply(ctx.t("general.commandsUpdated"));
}
