import { extractUserDetails } from "@/src/helpers/api.ts";

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
        failedToFindUserData:
            "Не удалось выполнить команду! Похоже, вы вызвали ее таким образом, что я не могу получить ваш ID",
        noDataForIgnoredUser:
            "Ваши данные были удалены из статистики! Чтобы снова внести их, используйте команду /optin",
        userDataMessage: (
            { userID, fullName, username }: NonNullable<
                ReturnType<typeof extractUserDetails>
            >,
            usageAmount: number,
        ) => `Для сохранения полной прозрачности, вот вся информация, которая хранится о Вас:\n${
            userID && `- Ваш Telegram ID: <code>${userID}</code>`
        }\n${fullName && `- Ваше полное имя в Telegram: ${fullName}`}\n${
            username && `- Ваше имя пользователя в Telegram: @${username}`
        }\n- Ваше количество отправленных реплик: ${usageAmount}\n\nЭти данные используются для построения приватных графиков использования, которые помогают увидеть охват бота в динамике и отобразить список самых активных пользователей\nЕсли вы хотите удалить эти данные из базы данных и больше не собирать хранить эти данные, используйте команду /optout`,
        filteredVoices: (str: string) => `Поиск: ${str}`,
        invalidatedSuccessfully: "Главный кеш был успешно инвалидирован!",
        maintenance: {
            enabled: "Технические работы активированы",
            disabled: "Технические работы отключены",
            button: "Выполняются тех. работы!",
            description:
                "На данный момент, бот находится в режиме технических работ и получить реплику пока что нельзя. Это может продлится от нескольких минут до часов",
        },
    },
} as const;
