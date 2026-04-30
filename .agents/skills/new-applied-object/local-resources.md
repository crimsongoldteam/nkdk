# Локальные ресурсы для скилла new-applied-object

Приватные пути и настройки конкретной машины. Без них Deep Scan неполный — XSD, MCP `bsl-platform` и карта ru↔en должны быть доступны одновременно.

## 1. XSD-каталог платформы 1С

Распакованные `.xsd*_root.res` файлы из ресурсов платформы.

- **Путь:** `/Users/nikita/git/1c_res/`
- **Проверка:** `ls /Users/nikita/git/1c_res/*.xsd*_root.res | head` должно вернуть файлы вида `mdclass.xsdmd_root.res`, `bsl.xsdbsl_root.res` и т.п.
- **Использование:** `grep -l '<xs:complexType name="<Container>"' /Users/nikita/git/1c_res/*.xsd*_root.res` — поиск типа по имени контейнера. Затем `wc -l` + `Read` найденного файла для извлечения `<xs:sequence>` свойств и `<xs:extension base="..."/>`.

Если каталог отсутствует — распакуй ресурсы платформы и положи `.res` файлы по этому пути (или укажи актуальный путь здесь).

## 2. MCP-сервер `bsl-platform`

Подключён в `~/.claude.json` через JAR `mcp-bsl-context`.

- **Конфигурация (`~/.claude.json`):**
  ```json
  "bsl-platform": {
    "type": "stdio",
    "command": "/opt/homebrew/opt/openjdk@17/bin/java",
    "args": [
      "-DLOG_FILE=/Users/nikita/.cache/mcp-bsl/server.log",
      "-jar",
      "/Users/nikita/tools/mcp-bsl-context.jar",
      "--platform-path",
      "/opt/1cv8/8.3.27.1989"
    ]
  }
  ```
- **Платформа 1С:** `/opt/1cv8/8.3.27.1989` (актуальная установленная версия).
- **JAR:** `/Users/nikita/tools/mcp-bsl-context.jar`.
- **Java:** `/opt/homebrew/opt/openjdk@17/bin/java`.
- **Доступные инструменты после старта Claude Code:**
  - `mcp__bsl-platform__search` — поиск по русскому имени, `type: "type"` для типов платформы.
  - `mcp__bsl-platform__getMembers` — список свойств/методов типа.
  - `mcp__bsl-platform__getMember` — детали одного свойства/метода.
  - `mcp__bsl-platform__info` — общая информация о типе.
  - `mcp__bsl-platform__getConstructors` — конструкторы типа.

Если инструменты недоступны — перезапусти Claude Code; проверь, что путь к платформе и JAR-файлу актуален.

## 3. Карта ru↔en (`ru-en-map.json`)

~10 000 пар «русское имя → английский синоним», сгенерированных из DEBUG-логов `TocParser` MCP-сервера. Через публичный API MCP английские имена не отдаются.

- **Путь:** `/Users/nikita/.cache/mcp-bsl/ru-en-map.json`
- **Размер:** ~10 091 строк (sanity-check: `wc -l`).
- **Использование:** для каждого русского имени свойства, полученного из `getMembers`, прочитать карту и взять английский синоним. Эти синонимы — кандидаты на TS-ключи в `types.ts` и YAML-ключи в `rules.ts`.
- **Регенерация:** включить DEBUG-логи в MCP-сервере, прогнать парсинг TOC, скриптом извлечь пары из `server.log` в JSON. Конкретный скрипт регенерации хранится отдельно (см. историю команд / README mcp-bsl-context).

## Чек-лист готовности

Перед запуском скилла убедись:

- [ ] `ls /Users/nikita/git/1c_res/*.xsd*_root.res` возвращает 100+ файлов.
- [ ] В Claude Code инструменты `mcp__bsl-platform__*` отвечают (например, `mcp__bsl-platform__info` по любому известному типу).
- [ ] `wc -l /Users/nikita/.cache/mcp-bsl/ru-en-map.json` возвращает ≥ 10 000 строк.

Если хотя бы один пункт не выполнен — скилл прервётся на старте.
