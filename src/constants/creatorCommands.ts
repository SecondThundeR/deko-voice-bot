import { BotCommand } from "@/deps.ts";

export const creatorCommands: BotCommand[] = [
    {
        command: "/invalidate",
        description: "Инвалидирует текущий кеш для обычного запроса",
    },
    {
        command: "/maintenance",
        description: "Переводит бота в статус тех. работ",
    },
];
