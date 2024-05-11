# Deko Voice Bot

Бот для отправки реплик [deko](https://liquipedia.net/counterstrike/Deko) от лица пользователя через [Inline Query](https://core.telegram.org/bots/features#inline-requests)

Бот позволяет просматривать весь список реплик, доступных в базе данных, а также искать нужные с помощью текстового запроса

> [!NOTE]
> Ссылка на "боевого" бота: <https://t.me/dekoquotes_bot>

## Используемые технологии

- Бот построен на [Deno](https://deno.com/) с использованием [TypeScript](https://www.typescriptlang.org/)
- В качестве библиотеки для взаимодействия с Telegram Bot API используется [grammY](https://github.com/grammyjs/grammY/)
- Бот и база данных работают на хостинге [Railway](https://railway.app/)
- Данные ~~хранятся в [MongoDB Atlas](https://www.mongodb.com/atlas/database/) и~~ управляются с помощью [официального драйвера](https://www.npmjs.com/package/mongodb)
  > Базу данных пришлось перенести с кластера Atlas ввиду многочисленных ошибок, связанных с обрывом соединения с БД, из-за чего бот падал в самое неподходящее время суток. База данных теперь находится в том же месте, что и бот
  > Ссылка на "боевого" бота: <https://t.me/dekoquotes_bot>
- Строки сообщений и другого текста бота находятся в [Fluent](https://projectfluent.org/) формате и обрабатываются с помощью плагина [grammy-i18n](https://grammy.dev/plugins/i18n/)
- Менюшки работают через плагин [grammy_menu](https://deno.land/x/grammy_menu) и интерактивные диалоги через плагин [grammy_conversations](https://deno.land/x/grammy_conversations)

## Как работает бот

### Post-milestone 2.0

В новом обновлении теперь существует возможность совмещения работы из pre-milestone 2.0 эры и сохранение войсов как `file_id`, так как добавление реплик теперь возможно через диалоги с ботом

Благодаря тому, что реплика может быть отправлена перед отправкой данных в БД, таким образом можно удостовериться, что реплика была сконвертирована корректно, и затем уже получить `file_id` без необходимости отправлять их в сторонние чаты/каналы (так как чат с ботом это отличное место для такого)

Не смотря на это, функциональность работы с внешними ссылками для реплик никуда не делась и она будет по-прежнему актуальна. Если нужно добавить реплику, которая находится в удаленном хранилище, можно использовать команду `/newremotevoices`

> [!NOTE]
> Стоит заметить, что добавление реплик через URL и через файл слегка отличаются
>
> Реплика в удаленном хранилище должна уже быть заранее конвертирована в .ogg OPUS формат, так как не смотря на то, что бот может вполне скачивать реплики и конвертировать их как при отправке файла в личные сообщения, есть все же риск некорректной работы ввиду возможного получения битого, невалидного или скомпрометированного файла....даже если этой командой будет пользоваться один человек и это админ
>
> _Robust security is a must - not an option_

### Pre-milestone 2.0 (Deprecated)

> [!WARNING]
> В данной секции описана работа бота до обновления с добавлением реплик через личные сообщения

В документации Telegram Bot API описана возможность отправки голосовых сообщений с помощью Inline двумя способами:

- Передача `file_id` голосового сообщения _(что немного неудобно, так как надо войсы хостить в закрытом канале и получать у каждого его ID)_
- Передача ссылки на .ogg файл в удаленном хранилище _(что уже более удобный вариант)_

Таким образом, реплики бота находятся на Google Drive, откуда потом получаются ссылки на каждую реплику и в дальнейшем бот скачивает файл с репликой и отправляет в Telegram

> [!TIP]
> Далее, Telegram кеширует голосовое сообщение и позволяет отправлять без необходимости повторного скачивания с Google Drive

Также у бота предусмотрено кеширование данных о репликах. Это позволяет получать необходимые реплики без необходимости частого обращения к базе данных напрямую

## Как использовать исходники бота у себя

> [!TIP]
> tl;dr скачайте исходники, настройте базу данных, заполните необходимые переменные в `.env` и запустите удобным образом

Подробная инструкция по полной настройке бота теперь находится [здесь](https://github.com/SecondThundeR/deko-voice-bot/wiki/%D0%A1%D0%BA%D0%B0%D1%87%D0%B8%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5,-%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B9%D0%BA%D0%B0-%D0%B8-%D0%B7%D0%B0%D0%BF%D1%83%D1%81%D0%BA-%D0%B1%D0%BE%D1%82%D0%B0)

### Добавление новых реплик

Реплики в боте можно добавлять с помощью команд `/newvoices` или `/newremotevoices`

Если использовать реплики через URL, то необходимо, чтобы они были заранее сконвертированы (см. сноску в разделе [выше](#post-milestone-20))

## Как контрибьютить

А зачем? Ну ладно, если так хочется, то флоу очень прост: Форк -> Новая ветка от develop -> Пулл реквест

И желательно, использовать названия для коммитов из ["Соглашений о коммитах"](https://www.conventionalcommits.org/ru/v1.0.0/), иначе коммиты будут смержены в один общий

## Лицензия

Бот распространяется по лицензии MIT. Больше деталей в файле [LICENSE](/LICENSE)
