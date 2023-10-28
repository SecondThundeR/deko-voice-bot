import { BotCommand } from "@/deps.ts";

export const usersCommands: BotCommand[] = [
    {
        command: "/start",
        description: "Получить информацию о боте",
    },
    {
        command: "/mydata",
        description: "Получение текущих данных о пользователе",
    },
];
