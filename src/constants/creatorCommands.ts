import { BotCommand } from "@/deps.ts";

import { usersCommands } from "@/src/constants/usersCommands.ts";

export const creatorCommands: BotCommand[] = [
    ...usersCommands,
    {
        command: "/invalidate",
        description: "Инвалидирует текущий кеш для обычного запроса",
    },
    {
        command: "/maintenance",
        description: "Переводит бота в статус тех. работ",
    },
];
