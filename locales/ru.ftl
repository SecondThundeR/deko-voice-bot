internal =
    .googleExportLinkFail = Failed to extract ID from provided link
    .envsCheckFail = Failed to get some of required environment variables. Make sure you have entered them!

general =
    .failedToFindUserData = Не удалось выполнить команду! Похоже, вы вызвали ее таким образом, что я не могу получить ваш ID

start = Чтобы отправлять фразы дЕко (или декО?) или найти ту самую нужную, введи в любом другом чате мою юзерку { $botUsername } или нажми кнопку снизу

myData =
    .ignoredUser = Ваши данные были удалены из статистики! Чтобы снова внести их, используйте команду /optin
    .dataMessage = Для сохранения полной прозрачности, вот вся информация, которая хранится о Вас:
    - Ваш Telegram ID: <code>{ $userID }</code>
    - Ваше полное имя в Telegram: { $fullName }{ $usernameText }
    - Ваше количество отправленных реплик: { $usesAmount }{ $lastUsedAtText }

    Эти данные используются для построения графиков использования, которые помогают увидеть охват бота в динамике и отобразить список самых активных пользователей
    Если вы хотите удалить эти данные из базы данных и больше не собирать эти данные, используйте команду /optout

optin =
    .success = Отлично, вы снова теперь добавлены в статистику! Чтобы отслеживать свои данные, используйте /mydata
    .failed = Вы и так уже добавлены в статистику! Если хотите удалить свои данные из базы данных, используйте /optout
    .exception = Ваших данных нет в статистике, но вы и не удалялись из нее. Попробуйте использовать бота, чтобы добавить свои данные в статистику

optout =
    .success = Жаль, что вы решили убрать свои данные из статистики. Вот вся информация, которая хранилась о Вас до этого момента:
    - Ваш Telegram ID: <code>{ $userID }</code>{ $fullNameText }{ $usernameText }
    - Ваше количество отправленных реплик: { $usesAmount }{ $lastUsedAtText }

    Если вы хотите снова использовать статистику, используйте команду /optin
    .failed = Вы и так уже были удалены из статистики! Если хотите снова записывать количество использований, используйте /optin
    .exception = Что-то пошло не так и не получилось удалить данные. Похоже в базе данных нет записи о Вас, поэтому и удалять нечего! Попробуйте отправить любое голосовое сообщение, чтобы добавить себя в статистику, по кнопке ниже

maintenance =
    .description-inline = На данный момент, бот находится в режиме технических работ и получить реплику пока что нельзя. Это может продлится от нескольких минут до часов
    .description-chat = На данный момент, бот находится в режиме технических работ и команды пока что недоступны. Это может продлится от нескольких минут до часов
    .enabled = Технические работы активированы
    .disabled = Технические работы отключены
    .inline-button = Выполняются тех. работы!

invalidate =
    .success = Главный кеш был успешно инвалидирован!

favorites =
    .header = Выберите реплики, которые вы хотите сделать избранными. Они будут показаны в самом начале списка
    .optout = К сожалению, нельзя добавлять реплики в избранное, если вы были удалены из статистики. Чтобы начать пользоваться всеми преимуществами персонализированной работы, используйте команду /optin

    p.s. Добавление избранных реплик после удаления данных не имеет смысла, так как этот режим предполагает полную анонимность при использовании, что означает отказ от хранения любых данных, связанных с пользователем
    .inlineAnswerFail = Не удалось обработать запрос!
    .inlineAnswerSuccess = Идет обновление избранных реплик

menu =
    .prev = <
    .close = Закрыть
    .next = >
    .outdated = Меню неактуально. Идет синхронизация...
    .failedToUpdate = Похоже, вы попытались обновить старое меню избранных реплик, но Telegram не позволяет обновлять сообщения после 48 часов. Удалите сообщение вручную
    .failedToDelete = Не удалось удалить меню избранных реплик. Возможно, прошло более 48 часов, после чего, Telegram не даёт удалять мне сообщения. Удалите сообщение вручную
    .alreadyPrev = Это и так первая страница
    .alreadyNext = Больше новых страниц нет
    .failedToGetSessionData = Не удалось получить часть данных для работы меню

inline =
    .searchPlaceholder = Для поиска начните вводить текст
    .searchHeader = Поиск: { $query }
    .blocked = Разблокируйте бота, чтобы продолжить
