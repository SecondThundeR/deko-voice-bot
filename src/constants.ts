import { BotCommand } from "@/deps.ts";

export const rootCacheKey = "root";
export const rootCacheTime = 3600000;
export const textCacheTime = 30000;

export const maxVoiceQueriesPerPage = 15;

export const googleExportDownloadLink =
  "https://drive.google.com/uc?export=download&id=";

export const locale = {
  general: {
    googleExportLinkFail: "Failed to extract ID from provided link",
    envsCheckFail:
      "Failed to get some of required environment variables. Make sure you have entered them!",
  },
  frontend: {
    startButtonText: "Начать использование",
    startHelp: (botUsername: string) =>
      `Чтобы отправлять фразы дЕко (или декО?) или найти ту самую нужную, введи в любом другом чате мою юзерку @${botUsername} или нажми кнопку снизу`,
    allVoices: "Отображение всех фраз (Для поиска начните вводить текст)",
    filteredVoices: (str: string) => `Поиск: ${str}`,
    invalidatedSuccessfully: "Главный кеш был успешно инвалидирован!",
  },
} as const;
export const creatorCommands: BotCommand[] = [
  {
    command: "/invalidate",
    description: "Инвалидирует текущий кеш для обычного запроса",
  },
];
