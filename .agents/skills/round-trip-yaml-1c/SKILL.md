---
name: round-trip-yaml-1c
description: Диагностирует XML -> YAML -> XML без reference и проверяет загрузку результата в файловую базу 1С через ibcmd.
---

# round-trip-yaml-1c — проверка XML без reference через 1С

Перед диагностикой обязательно прочитай:

1. `.agents/knowledge/metadata/INDEX.md`
2. `.agents/knowledge/metadata/sources-of-truth.md`
3. `.agents/knowledge/metadata/round-trip-cycle.md`
4. `.agents/knowledge/metadata/yaml-contract.md`

## Что делает skill

Skill запускает цепочку:

```text
XML -> модель -> YAML -> модель -> XML без reference -> загрузка XML в 1С
```

Он нужен, чтобы понять, принимает ли 1С XML, сгенерированный из YAML без опоры на исходную XML-выгрузку. При ошибке skill показывает контекст, временные каталоги и журнал, после чего останавливается.

## Жёсткие инварианты

- **Только диагностика.** Skill не исправляет код, не создаёт тесты, фикстуры, планы исправления, коммиты и PR.
- **Чистое рабочее дерево `nkdk`.** Если `git status` не чистый — стоп, попроси пользователя сохранить или откатить правки.
- **Не менять XML-репо.** Активный XML-каталог не заменяется результатом генерации без reference.
- **Временный YAML-каталог очищается перед прогоном и остаётся после него.**
- **Временный XML-каталог без reference очищается перед прогоном и остаётся после него.**
- **`nkdk.sync_to_xml` вызывается без reference.**
- **Только файловая база 1С.** Клиент-серверные базы и `config.yml` автономного сервера не входят в первую версию.
- **Пустые логин и пароль не передаются в `ibcmd`.**
- **Не запускать полный `pnpm test`.** Это диагностический skill.

## Настройки `.env`

Скрипт читает `.env` из корня `nkdk`.

Обязательные настройки:

```env
NKDK_XML_REPO=/home/codexwsl/round-trip
NKDK_XML_DIR=/home/codexwsl/round-trip/all
NKDK_1C_DATA=/home/codexwsl/temp-base
NKDK_1C_DB_PATH=/home/codexwsl/temp-base
```

Опциональные настройки:

```env
NKDK_ROUND_TRIP_YAML_DIR=/tmp/round-trip-yaml-1c
NKDK_1C_IBCMD=ibcmd
NKDK_1C_USER=
NKDK_1C_PASSWORD=
```

Если `NKDK_1C_USER` и `NKDK_1C_PASSWORD` пустые, параметры `--user` и `--password` не добавляются.

## Запуск

Вызови из корня `nkdk`:

```bash
./skills/round-trip-yaml-1c/round-trip.sh
```

Скрипт:

1. читает `.env`;
2. проверяет чистоту рабочего дерева `nkdk`;
3. проверяет `NKDK_XML_REPO`, `NKDK_XML_DIR`, `NKDK_1C_DATA`, `NKDK_1C_DB_PATH`;
4. находит локальный MCP helper `.agents/tools/mcp/call.mjs`;
5. проверяет доступность `ibcmd`;
6. очищает временный YAML-каталог;
7. очищает временный XML-каталог;
8. вызывает `nkdk.import_from_xml` через настоящий MCP stdio server;
9. вызывает `nkdk.sync_to_xml` через настоящий MCP stdio server;
10. запускает `ibcmd infobase create --data <data> --db-path <db-path> --import <tmp-xml-dir> --apply --force`;
11. при ошибке печатает диагностический блок и останавливается.

## Формат ответа после ошибки

После ошибки сформируй краткий ответ:

```text
XML-каталог: <ACTIVE_XML_DIR>
YAML-каталог: <YAML_DIR>
XML без reference: <TMP_XML_DIR>
Команда: <IBCMD_COMMAND или команда nkdk>
Категория: ошибка import / ошибка sync / ошибка загрузки 1С / неизвестно
Описание: <что видно по журналу>
Журнал:
<релевантный фрагмент>
Сомнения: <если причина неочевидна>
```

Не начинай исправления без отдельного запроса пользователя.

## Успешный результат

Если скрипт пишет:

```text
=== Загрузка в 1С прошла успешно ===
```

сообщи пользователю, какие каталоги были проверены, и остановись.

## Тупиковые ситуации

Остановись и спроси пользователя, если:

- файловая база отсутствует или не открывается через `ibcmd`;
- `nkdk.import_from_xml` или `nkdk.sync_to_xml` падают по причине, не связанной с текущей диагностикой;
- журнал `ibcmd` содержит несколько независимых ошибок и краткая классификация будет вводить в заблуждение.

## Политика коммитов

Skill сам не коммитит, не пушит и не создаёт PR.
