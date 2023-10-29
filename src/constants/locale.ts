import { extractUserDetails } from "@/src/helpers/api.ts";
import { UsersStatsSchema } from "@/src/schemas/usersStats.ts";

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
            usesAmount: number,
        ) => `Для сохранения полной прозрачности, вот вся информация, которая хранится о Вас:\n- Ваш Telegram ID: <code>${userID}</code>\n- Ваше полное имя в Telegram: ${fullName}\n${
            username !== undefined
                ? `- Ваше имя пользователя в Telegram: @${username}\n`
                : ""
        }- Ваше количество отправленных реплик: ${usesAmount}\n\nЭти данные используются для построения приватных графиков использования, которые помогают увидеть охват бота в динамике и отобразить список самых активных пользователей\nЕсли вы хотите удалить эти данные из базы данных и больше не собирать хранить эти данные, используйте команду /optout`,
        filteredVoices: (str: string) => `Поиск: ${str}`,
        invalidatedSuccessfully: "Главный кеш был успешно инвалидирован!",
        maintenance: {
            enabled: "Технические работы активированы",
            disabled: "Технические работы отключены",
            button: "Выполняются тех. работы!",
            description:
                "На данный момент, бот находится в режиме технических работ и получить реплику пока что нельзя. Это может продлится от нескольких минут до часов",
        },
        addIgnore: {
            success: (
                { userID, fullName, username, usesAmount }: Omit<
                    UsersStatsSchema,
                    "_id"
                >,
            ) => `Жаль, что вы решили убрать свои данные из статистики. Вот вся информация, которая хранилась о Вас до этого момента:\n- Ваш Telegram ID: <code>${userID}</code>\n${
                fullName !== undefined
                    ? `- Ваше полное имя в Telegram: ${fullName}\n`
                    : ""
            }${
                username !== undefined
                    ? `- Ваше имя пользователя в Telegram: @${username}\n`
                    : ""
            }- Ваше количество отправленных реплик: ${usesAmount}\n\nЕсли вы хотите снова использовать статистику, используйте команду /optin`,
            failed:
                "Вы и так уже были удалены из статистики! Если хотите снова записывать количество использований, используйте /optin",
            exception:
                "Что-то пошло не так и не получилось удалить данные из базы данных. Похоже в базе данных нет записи о Вас, поэтому и удалять нечего! Попробуйте отправить любое голосовое сообщение, чтобы добавить себя в статистику, по кнопке ниже",
        },
        removeIgnore: {
            success:
                "Отлично, вы снова теперь добавлены в статистику! Чтобы отслеживать свои данные, используйте /mydata",
            failed:
                "Вы и так уже добавлены в статистику! Если хотите удалить свои данные из базы данных, используйте /optout",
            exception:
                "Ваших данных нет в статистике, но вы и не удалялись из нее. Попробуйте использовать бота, чтобы добавить свои данные в статистику",
        },
    },
} as const;
