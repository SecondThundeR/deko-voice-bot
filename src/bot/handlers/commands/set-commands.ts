import { Command, CommandGroup } from "@grammyjs/commands";
import type { CommandContext } from "grammy";
import type { Context } from "#root/bot/context.js";

const USER_COMMANDS = {
    start: "start-command-description",
    optin: "opt-in-command-description",
    optout: "opt-out-command-description",
    privacy: "privacy-command-description",
    mydata: "my-data-command-description",
    favorites: "favorites-command-description",
    donate: "donate-command-description",
} as const;

const ADMIN_COMMANDS = {
    maintenance: "maintenance-command-description",
    stats: "stats-command-description",
    fullstats: "full-stats-command-description",
    voice: "voice-command-description",
    voices: "voices-command-description",
    newvoices: "new-voices-command-description",
    export: "export-command-description",
    import: "import-command-description",
    refund: "refund-command-description",
} as const;

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

    Object.entries(USER_COMMANDS).forEach(([commandName, descriptionKey]) => {
        const command = new Command(
            commandName,
            ctx.t(descriptionKey),
        ).addToScope({ type: "all_private_chats" });
        addCommandToChats(command, ctx.config.adminIds);

        commands.add(command);
    });

    Object.entries(ADMIN_COMMANDS).forEach(([commandName, descriptionKey]) => {
        const command = new Command(commandName, ctx.t(descriptionKey));
        addCommandToChats(command, ctx.config.adminIds);

        commands.add(command);
    });

    await commands.setCommands(ctx);

    return ctx.reply(ctx.t("commands-updated"));
}
