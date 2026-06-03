# round-trip-yaml-1c skill design

## Цель

Добавить отдельный Codex skill `round-trip-yaml-1c` для диагностики полной цепочки:

```text
XML -> модель -> YAML -> модель -> XML без reference -> загрузка XML в 1С
```

Скилл нужен, чтобы проверять, может ли XML, сгенерированный из YAML без опоры на исходный XML, загрузиться в файловую базу 1С через автономный сервер. При ошибке skill выводит контекст и журнал загрузки, после чего пользователь выбирает, какую ошибку разбирать.

## Не-цели

- Не исправлять код автоматически.
- Не создавать ветки, фикстуры, тесты, планы исправления, коммиты и PR.
- Не изменять существующие XML-фикстуры.
- Не запускать полный `pnpm test`.
- Не подменять XML-репозиторий результатом экспорта без reference.
- Не поддерживать клиент-серверные базы 1С в первой версии.
- Не использовать `config.yml` автономного сервера в первой версии.

## Расположение

Новый skill живёт отдельно от `round-trip-yaml`:

```text
.agents/skills/round-trip-yaml-1c/
  SKILL.md
  round-trip.sh
```

`round-trip-yaml` остаётся инструментом XML diff-диагностики с `--reference`. Новый skill проверяет другой вопрос: валидность XML без reference для загрузки в 1С.

## Сценарий

Скрипт `.agents/skills/round-trip-yaml-1c/round-trip.sh` запускается из корня `nkdk`:

```bash
./.agents/skills/round-trip-yaml-1c/round-trip.sh
```

Для тестовой проверки используется:

```env
NKDK_XML_DIR=/home/nikita/git/round-trip/all
NKDK_1C_DATA=/home/nikita/git/temp-base
NKDK_1C_DB_PATH=/home/nikita/git/temp-base
NKDK_1C_USER=
NKDK_1C_PASSWORD=
```

Если `NKDK_1C_USER` и `NKDK_1C_PASSWORD` пустые, скрипт не передаёт параметры `--user` и `--password`.

## Настройки `.env`

Скрипт читает настройки из `.env` корня `nkdk`.

Обязательные настройки metadata-цикла:

```env
NKDK_XML_REPO=/home/nikita/git/round-trip
NKDK_XML_DIR=/home/nikita/git/round-trip/all
```

Опциональная настройка YAML-каталога:

```env
NKDK_ROUND_TRIP_YAML_DIR=/tmp/round-trip-yaml-1c
```

Настройки автономного сервера 1С для файловой базы:

```env
NKDK_1C_IBCMD=ibcmd
NKDK_1C_DATA=/home/nikita/git/temp-base
NKDK_1C_DB_PATH=/home/nikita/git/temp-base
NKDK_1C_USER=
NKDK_1C_PASSWORD=
```

`NKDK_1C_IBCMD` по умолчанию равен `ibcmd`.

## Поведение `round-trip.sh`

Перед запуском скрипт проверяет:

- рабочее дерево `nkdk` чистое;
- `NKDK_XML_REPO` является git-репозиторием;
- `NKDK_XML_DIR` существует;
- команда `nkdk` доступна;
- команда `ibcmd` доступна;
- `NKDK_1C_DATA` и `NKDK_1C_DB_PATH` заданы и существуют.

Для выбранного XML-каталога скрипт:

1. определяет активный XML-каталог;
2. очищает временный YAML-каталог;
3. очищает временный XML-каталог без reference;
4. запускает `nkdk import <xml-dir> <yaml-dir>`;
5. запускает `nkdk sync <yaml-dir> <tmp-xml-dir>` без `--reference`;
6. запускает полную загрузку XML в файловую базу 1С через `ibcmd`;
7. при успехе сообщает, что загрузка прошла;
8. при ошибке выводит команду, каталоги и журнал ошибки.

В отличие от `round-trip-yaml`, скрипт не заменяет активный XML-каталог результатом генерации. Диагностическим результатом являются временный YAML-каталог, временный XML-каталог и вывод `ibcmd`.

## Команда загрузки 1С

Для полной загрузки конфигурации из XML используется `ibcmd infobase config import`.

Базовая команда для файловой базы без пользователя и пароля:

```bash
"$NKDK_1C_IBCMD" infobase config import \
  --data="$NKDK_1C_DATA" \
  --db-path="$NKDK_1C_DB_PATH" \
  "$TMP_XML_DIR"
```

Если заданы `NKDK_1C_USER` и `NKDK_1C_PASSWORD`, скрипт добавляет:

```bash
--user="$NKDK_1C_USER" --password="$NKDK_1C_PASSWORD"
```

Формат XML не передаётся отдельным параметром: автономный сервер поддерживает иерархический формат и автоматически определяет формат загружаемой выгрузки.

## Протокол вывода

При каждом запуске скрипт печатает:

```text
ACTIVE_XML_DIR: <absolute xml dir>
YAML_DIR: <absolute yaml dir>
TMP_XML_DIR: <absolute generated xml dir>
IBCMD_COMMAND: <sanitized command>
```

При успешной загрузке:

```text
=== Загрузка в 1С прошла успешно ===
```

При ошибке `nkdk import`, `nkdk sync` или `ibcmd`:

```text
=== Ошибка загрузки в 1С ===
ACTIVE_XML_DIR: <absolute xml dir>
YAML_DIR: <absolute yaml dir>
TMP_XML_DIR: <absolute generated xml dir>
COMMAND: <command>
EXIT_CODE: <code>
LOG:
<stdout/stderr>
```

В выводе команды пароль маскируется, если он задан.

## Формат ответа AI

После ошибки AI отвечает кратко:

```text
XML-каталог: <ACTIVE_XML_DIR>
YAML-каталог: <YAML_DIR>
XML без reference: <TMP_XML_DIR>
Команда: <IBCMD_COMMAND>
Категория: ошибка import / ошибка sync / ошибка загрузки 1С / неизвестно
Описание: <что видно по журналу>
Журнал:
<релевантный фрагмент>
Сомнения: <если причина неочевидна>
```

AI не начинает исправления без отдельного запроса пользователя.

## Обработка ошибок

Если `nkdk`-репозиторий не чистый, skill останавливается и просит пользователя сохранить или откатить правки. Он не запускает `git stash`, `git restore` или `git clean`.

Если `nkdk import` или `nkdk sync` падают, загрузка в 1С не запускается.

Если `ibcmd` падает, skill сохраняет временный YAML и XML без reference, показывает ошибку и останавливается.

Если файловая база отсутствует или не является рабочей базой автономного сервера, skill показывает ошибку окружения. Создание базы не входит в первую версию.

## Критерии готовности

- Есть `.agents/skills/round-trip-yaml-1c/SKILL.md`.
- Есть `.agents/skills/round-trip-yaml-1c/round-trip.sh`.
- `round-trip.sh --help` описывает назначение, `.env` и ограничения.
- Скрипт запускает `nkdk sync` без `--reference`.
- Скрипт не изменяет активный XML-каталог.
- Скрипт запускает `ibcmd infobase config import` для файловой базы.
- Пустые `NKDK_1C_USER` и `NKDK_1C_PASSWORD` не передаются в команду.
- Ошибка загрузки в 1С выводится с каталогами и релевантным журналом.
- Skill явно запрещает автоисправления и ждёт выбора пользователя.
