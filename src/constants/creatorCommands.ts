import type { BotCommand } from "@/deps.ts";

import { userCommands } from "@/src/constants/userCommands.ts";

export const creatorCommands: BotCommand[] = [
    ...userCommands,
    {
        command: "/invalidate",
        description: "Инвалидирует текущий кеш для обычного запроса",
    },
    {
        command: "/maintenance",
        description: "Переводит бота в статус тех. работ",
    },
    {
        command: "/stats",
        description: "Выводит общую статистику по использованию бота",
    },
    {
        command: "/fullstats",
        description: "Выводит полную статистику по использованию бота",
    },
    {
        command: "/newvoice",
        description: "Добавляет новую реплику в базу данных",
    },
];
