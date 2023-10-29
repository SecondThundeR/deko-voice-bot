import { BotCommand } from "@/deps.ts";

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
        command: "/mydata",
        description: "Получение текущих данных о пользователе",
    },
];
