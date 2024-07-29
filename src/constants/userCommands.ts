import type { BotCommand } from "grammy/types";

export const userCommands: BotCommand[] = [
    {
        command: "/start",
        description: "Получить информацию о боте",
    },
    {
        command: "/optin",
        description: "Добавить свои данные в статистику",
    },
    {
        command: "/optout",
        description: "Удалить свои данные из статистики",
    },
    {
        command: "/privacy",
        description: "Получить информацию о политике приватности",
    },
    {
        command: "/mydata",
        description: "Получить мои данные по использованию",
    },
    {
        command: "/favorites",
        description: "Управлять списком избранных реплик",
    },
];
