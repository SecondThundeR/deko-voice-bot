import type { BotCommand } from "@/deps.ts";

import { userCommands } from "@/src/constants/userCommands.ts";

export const creatorCommands: BotCommand[] = [
    ...userCommands,
    {
        command: "/invalidate",
        description: "Инвалидировать текущий кеш для обычного запроса",
    },
    {
        command: "/maintenance",
        description: "Перевести бота в статус тех. работ",
    },
    {
        command: "/stats",
        description: "Получить общую статистику по использованию бота",
    },
    {
        command: "/fullstats",
        description: "Получить полную статистику по использованию бота",
    },
    {
        command: "/voice",
        description: "Выбрать реплику для изменения",
    },
    {
        command: "/voices",
        description: "Получить меню со списком всех реплик",
    },
    {
        command: "/newvoices",
        description: "Добавить новые реплики через файлы",
    },
    {
        command: "/newremotevoices",
        description: "Добавить новые реплики через ссылки",
    },
];
