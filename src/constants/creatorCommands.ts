import { BotCommand } from "@/deps.ts";

import { userCommands } from "./userCommands.ts";

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
];
