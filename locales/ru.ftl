### Русская локализация Telegram-бота.
### Сообщения отправляются с parse_mode=HTML. Все внешние строковые значения
### должны быть экранированы в коде до передачи в Fluent.
### NUMBER(..., useGrouping: 0) сохраняет числовой тип без разделителей разрядов.

general-unknown-error = Неизвестная ошибка
commands-updated = Команды обновлены

# $botUsername (String) — имя бота с символом @.
start-message = Чтобы отправить фразу дЕко (или декО?) или найти ту самую нужную, введите в любом другом чате мою юзерку { $botUsername } или нажмите кнопку ниже.
start-button = Начать использование
start-command-description = Получить информацию о боте

privacy-message = Информация о политике приватности бота доступна по <a href="https://github.com/SecondThundeR/deko-voice-bot/blob/main/PRIVACY_POLICY.md">ссылке</a>.
privacy-command-description = Получить информацию о политике приватности

# Все переменные ниже имеют тип Number.
stats-message =
    Всего пользователей бота: { NUMBER($allUsedUsers, useGrouping: 0) } (без аналитики: { NUMBER($allIgnoredUsers, useGrouping: 0) })
    Всего активных пользователей за месяц: { NUMBER($allMAUUsers, useGrouping: 0) }
    Всего пользователей, которые не использовали бота больше месяца: { NUMBER($allInactiveUsers, useGrouping: 0) }
    Всего отправленных реплик: { NUMBER($allUsedVoices, useGrouping: 0) }

stats-command-description = Получить общую статистику использования бота

# $mostUsedUsers, $lastUsedUsers и $mostUsedVoices — готовые локализованные списки.
full-stats-message =
    Всего пользователей бота: { NUMBER($allUsedUsers, useGrouping: 0) } (без аналитики: { NUMBER($allIgnoredUsers, useGrouping: 0) })
    Всего активных пользователей за месяц: { NUMBER($allMAUUsers, useGrouping: 0) }
    Всего пользователей, которые не использовали бота больше месяца: { NUMBER($allInactiveUsers, useGrouping: 0) }
    Всего отправленных реплик: { NUMBER($allUsedVoices, useGrouping: 0) }

    Топ-5 активных пользователей:
    { $mostUsedUsers }

    Топ-5 недавних пользователей:
    { $lastUsedUsers }

    Топ-5 популярных реплик:
    { $mostUsedVoices }

full-stats-command-description = Получить полную статистику использования бота
stats-no-data = Нет информации

# $userName (String) — экранированное имя или @username пользователя.
# $lastUsedAt (String) — локализованные дата и время по Москве.
stats-user-line-with-date =
    - { $userName }: { $usesAmount ->
        [one] { NUMBER($usesAmount, useGrouping: 0) } раз
        [few] { NUMBER($usesAmount, useGrouping: 0) } раза
       *[other] { NUMBER($usesAmount, useGrouping: 0) } раз
    } ({ $lastUsedAt })

# $userName (String) — экранированное имя или @username пользователя.
stats-user-line =
    - { $userName }: { $usesAmount ->
        [one] { NUMBER($usesAmount, useGrouping: 0) } раз
        [few] { NUMBER($usesAmount, useGrouping: 0) } раза
       *[other] { NUMBER($usesAmount, useGrouping: 0) } раз
    }

# $voiceTitle (String) — экранированное название реплики.
stats-voice-line =
    - { $voiceTitle }: { $usesAmount ->
        [one] { NUMBER($usesAmount, useGrouping: 0) } раз
        [few] { NUMBER($usesAmount, useGrouping: 0) } раза
       *[other] { NUMBER($usesAmount, useGrouping: 0) } раз
    }

my-data-not-found =
    Ваши данные были удалены из статистики или вы ни разу не отправляли реплики через бота.
    Чтобы участвовать в статистике, используйте команду /optin.

my-data-header =
    Для полной прозрачности ниже приведена вся информация, которая хранится о вас:

my-data-user-id = - Ваш Telegram ID: <code>{ NUMBER($userId, useGrouping: 0) }</code>
my-data-full-name = - Ваше полное имя в Telegram: { $fullName }
my-data-username = - Ваше имя пользователя в Telegram: @{ $username }
my-data-uses-amount = - Количество отправленных вами реплик: { NUMBER($usesAmount, useGrouping: 0) }

# $lastUsedAt (String) — локализованные дата и время по Москве.
my-data-last-used-at = - Время последней отправки реплики (по Москве): { $lastUsedAt }

my-data-footer =
    Эти данные используются для анализа динамики использования. Это помогает оценить охват бота и составить список самых активных пользователей.
    Если вы хотите удалить свои данные из статистики и прекратить их сбор, используйте команду /optout.

my-data-command-description = Получить мои данные об использовании бота

opt-in-restored = Отлично, вы снова участвуете в статистике! Чтобы получить данные личной статистики, используйте /mydata.
opt-in-new-user = Теперь вы участвуете в статистике! Чтобы получить данные личной статистики, используйте /mydata.
opt-in-already-enabled = Вы уже участвуете в статистике! Если хотите удалить свои данные из неё, используйте /optout.
opt-in-command-description = Добавить свои данные в статистику

opt-out-success-header =
    Вы исключены из сбора статистики. Ниже приведена вся информация, которая хранилась о вас до этого момента:

opt-out-success-footer =
    Если вы захотите снова участвовать в статистике, используйте команду /optin.

opt-out-failed =
    Не удалось удалить данные: они уже были удалены из статистики или вы ещё ни разу не отправляли реплики через бота.
    Чтобы участвовать в статистике, используйте команду /optin.

opt-out-command-description = Удалить свои данные из статистики

maintenance-command-description = Перевести бота в режим технических работ
maintenance-inline-unavailable = Сейчас бот находится в режиме технических работ, поэтому получить реплику пока нельзя. Это может занять от нескольких минут до пары часов.
maintenance-chat-unavailable = Сейчас бот находится в режиме технических работ, поэтому команды пока недоступны. Это может занять от нескольких минут до пары часов.
maintenance-enabled = Режим технических работ включён
maintenance-disabled = Режим технических работ отключён
maintenance-inline-button = Выполняются технические работы!

favorites-header = Выберите реплики, которые хотите добавить в избранное. Они будут показаны в начале списка.
favorites-no-data = Нет реплик, которые можно добавить в избранное.
favorites-new-user = Чтобы добавлять реплики в избранное, включите сбор статистики с помощью команды /optin или хотя бы один раз отправьте реплику через бота. После этого избранное станет доступно.
favorites-opted-out = К сожалению, добавлять реплики в избранное нельзя, если ваши данные исключены из статистики. Чтобы снова пользоваться персонализированными функциями, используйте команду /optin.

    P. S. После удаления данных добавление избранных реплик не имеет смысла: этот режим предполагает полную анонимность и отказ от хранения любых связанных с пользователем данных.

favorites-update-failed = Не удалось обработать запрос!
favorites-update-started = Избранные реплики обновляются
favorites-command-description = Управлять списком избранных реплик

menu-previous-button = <
menu-close-button = Закрыть
menu-back-button = Назад
menu-next-button = >
menu-outdated = Меню устарело. Выполняется синхронизация…
menu-update-too-old = Похоже, вы попытались обновить старое меню избранных реплик, но Telegram не позволяет изменять сообщения старше 48 часов. Удалите сообщение вручную.
menu-delete-too-old = Не удалось удалить меню избранных реплик. Возможно, сообщение было отправлено больше 48 часов назад и Telegram больше не позволяет боту удалить его. Удалите сообщение вручную.
menu-already-first-page = Это и так первая страница
menu-no-next-page = Больше страниц нет

inline-bot-blocked = Разблокируйте бота, чтобы продолжить

conversation-cancelled = Действие отменено!
conversation-add-cancelled = Добавление отменено!

# $voices (String) — экранированный многострочный список названий реплик.
conversation-add-results =
    Добавленные реплики:
    { $voices }

conversation-update-cancelled = Обновление отменено!

new-voices-command-description = Добавить новые реплики из файлов
new-voices-ffmpeg-unavailable = FFmpeg недоступен в системе, на которой работает бот. Добавление реплик из файлов невозможно.
new-voices-audio-hint = Отправьте реплику в формате .mp3 или в любой момент напишите /cancel для отмены.
new-voices-audio-path-empty = Похоже, мне не удалось получить путь к этому файлу на серверах Telegram.
new-voices-audio-fetch-failed = Похоже, мне не удалось получить данные отправленного вами файла.
new-voices-id-hint = Отлично! Введите ID реплики (обычно он выглядит как <code>some_voice_id</code>).
new-voices-id-too-long = ID реплики не должен превышать 64 символа. Введите другой ID, чтобы продолжить.
new-voices-id-not-unique = Реплика с таким ID уже существует. Придумайте для неё другой ID.
new-voices-title-hint = Как называется реплика?

# $errorMessage (String) — экранированное сообщение FFmpeg.
new-voices-conversion-failed = Что-то пошло не так во время конвертации реплики. Детали ошибки: { $errorMessage }

new-voices-added = Новая реплика «{ $title }» добавлена!
new-voices-add-failed = Реплика «{ $title }» была сконвертирована, но добавить её в базу данных не удалось.
new-voices-updated = Реплика «{ $title }» обновлена!

donate-amount-too-small = Количество звёзд должно быть не меньше 1.
donate-custom-amount-question = Введите желаемую сумму в звёздах (например, 250) или в любой момент напишите /cancel для отмены.
donate-custom-amount-invalid = Некорректная сумма. Запустите /donate ещё раз.
donate-inline-button = Поддержать бота
donate-message = Привет! Спасибо за желание поддержать этот проект. Бот был создан как личный проект ради интереса. В нём нет рекламы, и он всегда будет работать бесплатно. Несмотря на это, вы можете поддержать меня и бота, отправив звёзды. Большое спасибо за то, что пользуетесь ботом!
donate-invoice-label = Пожертвование
donate-invoice-title = Добровольное пожертвование
donate-invoice-description = Поддержка проекта на { NUMBER($amount, useGrouping: 0) } ⭐. Спасибо!
donate-success = Большое спасибо за пожертвование в размере { NUMBER($amount, useGrouping: 0) } ⭐!
donate-error =
    Не удалось создать запрос на пожертвование. Попробуйте ещё раз.
    <blockquote>Если вы указывали произвольную сумму, попробуйте выбрать другое значение.</blockquote>

donate-command-description = Поддержать бота, отправив звёзды
donate-25-button = 25 ⭐
donate-50-button = 50 ⭐
donate-100-button = 100 ⭐
donate-200-button = 200 ⭐
donate-custom-button = Другая сумма

refund-command-description = Отменить пожертвование по его идентификатору
refund-id-required = Укажите ID платежа для возврата. Например: <code>/refund &lt;charge_id&gt;</code>
refund-not-found = Платёж с указанным ID не найден
refund-in-progress = Возврат платежа с указанным ID уже выполняется
refund-already-completed = Платёж с указанным ID уже возвращён
refund-success = Пользователю { NUMBER($userId, useGrouping: 0) } успешно возвращено { NUMBER($amount, useGrouping: 0) } ⭐
refund-user-notice = Ваше пожертвование в размере { NUMBER($amount, useGrouping: 0) } ⭐ возвращено на баланс
refund-error = Не удалось выполнить возврат. Ошибка: { $errorMessage }

voice-id-hint = Введите новый ID реплики (обычно он выглядит как <code>some_voice_id</code>) или в любой момент напишите /cancel для отмены.
voice-id-too-long = ID реплики не должен превышать 64 символа
voice-id-not-unique = Реплика с таким ID уже существует
voice-id-updated = Отлично! У реплики «{ $voiceTitle }» идентификатор «{ $oldVoiceId }» заменён на «{ $voiceId }».
voice-id-update-failed = Что-то пошло не так при обновлении ID.

voice-title-hint = Введите новое название реплики или в любой момент напишите /cancel для отмены.
voice-title-updated = Отлично! Реплика «{ $oldVoiceTitle }» теперь называется «{ $voiceTitle }».
voice-title-update-failed = Что-то пошло не так при обновлении названия.

voice-command-description = Выбрать реплику для изменения

voices-command-description = Получить меню со списком всех реплик
voices-select-button = Выбрать реплику
voices-menu-header = Выберите реплику, которую хотите изменить или удалить.
voices-item-menu-header = Выберите действие для этой реплики.
voices-item-menu-hint = Чтобы изменить отдельную реплику, выберите её с помощью кнопки ниже.
voices-update-id-button = Обновить ID
voices-update-file-button = Обновить файл
voices-update-title-button = Обновить название
voices-delete-button = Удалить
voices-delete-success = Реплика «{ $voiceTitle }» успешно удалена!
voices-delete-failed = Что-то пошло не так, и реплика «{ $voiceTitle }» не была удалена.
voices-unknown = Неизвестная реплика
voices-no-data = У меня пока нет реплик. Добавьте их с помощью команды /newvoices.

export-command-description = Экспортировать зашифрованную резервную копию
export-completed =
    Зашифрованная резервная копия базы данных.
    SHA-256: <code>{ $sha256 }</code>
export-unknown-error = Не удалось экспортировать данные. Код операции: <code>{ $operationId }</code>

import-command-description = Восстановить базу из зашифрованной копии
import-awaiting-file =
    Отправьте файл <code>.dump.enc</code> размером не более { NUMBER($maxSizeMb, useGrouping: 0) } МБ в течение { NUMBER($ttlMinutes, useGrouping: 0) } мин.
    Для отмены используйте /cancel.
import-invalid-file-type = Ожидается зашифрованный файл с расширением <code>.dump.enc</code>. Запустите /import ещё раз.
import-file-too-large = Размер файла превышает лимит { NUMBER($maxSizeMb, useGrouping: 0) } МБ. Запустите /import ещё раз.
import-validating = Загружаю и проверяю резервную копию…
import-validation-failed = Файл не прошёл проверку. База данных не изменена. Запустите /import ещё раз.
import-confirmation =
    Резервная копия проверена.
    Размер: { $sizeMb } МБ
    SHA-256: <code>{ $sha256 }</code>

    Восстановление полностью заменит текущие данные. Перед началом бот отправит аварийную копию текущей базы.
import-confirm-button = Восстановить
import-cancel-button = Отмена
import-session-expired = Сессия импорта истекла или уже завершена
import-cancelled = Импорт отменён. Временные файлы удалены.
import-preparing = Останавливаю обработку запросов и создаю аварийную копию…
import-emergency-backup =
    Аварийная копия базы перед импортом.
    SHA-256: <code>{ $sha256 }</code>
import-completed = Данные успешно импортированы!
import-error = Импорт не выполнен. Код операции: <code>{ $operationId }</code>. Если аварийная копия уже была отправлена, сохраните её до выяснения причины.
