import type { BotCommand } from "grammy/types";

import { USER_COMMANDS } from "@/src/constants/userCommands";

export const ADMIN_COMMANDS: BotCommand[] = [
    ...USER_COMMANDS,
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
        command: "/export",
        description: "Экспортировать данные из базы данных в JSON файл",
    },
    {
        command: "/refund",
        description: "Отмена пожертвования по его идентификатору",
    },
];
