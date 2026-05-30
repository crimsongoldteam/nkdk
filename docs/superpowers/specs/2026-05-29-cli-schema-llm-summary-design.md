# YAML-сводки для `nkdk schema`

## Цель

Сделать `nkdk schema <target>` компактной YAML-сводкой для LLM.
Сводки нужны, чтобы быстро понять доступные поля, обязательные поля, смысл конкретного поля и найти поле по части строки без ручного `jq`/`rg` по огромной JSON Schema.

## Интерфейс CLI

Базовая команда возвращает полную YAML-сводку всех top-level полей:

```bash
nkdk schema <target> [--project <yaml-dir>]
```

`<target>` принимает имя схемы (`InputField`, `UsualGroup`, `MetadataCatalogAttribute`) или путь к YAML-файлу проекта.
`--project` работает как сейчас: задаёт корень YAML-проекта для относительного пути.

Точная JSON Schema остаётся доступна отдельным режимом:

```bash
nkdk schema <target> --json-schema [--inline] [--project <yaml-dir>]
```

`--inline` допустим только вместе с `--json-schema`.

Новые возможности добавляются ключами той же команды:

```bash
nkdk schema InputField
nkdk schema InputField --keys
nkdk schema InputField --keys "путь|вид"
nkdk schema InputField --required
nkdk schema InputField --required --keys
nkdk schema UsualGroup --search "путь|вид"
nkdk schema UsualGroup --search "путь|вид" --keys
nkdk schema UsualGroup --search ПутьКДанным --exact
nkdk schema UsualGroup --search ПутьКДанным --exact --keys
```

## Семантика ключей

`--keys [terms]` ограничивает вывод только именами ключей и допустим вместе с `--required` и `--search`.
Вывод `--keys` всегда plain text: одно имя ключа на строку, без YAML-обёртки.
Без другого режима он сам выбирает режим списка всех полей.
Если передан `terms`, команда фильтрует имена полей по частям строки.

`--required` выбирает обязательные поля схемы и выводит их в той же YAML-структуре, что и полная сводка.
С `--keys` выводит только их имена.

`--search <terms>` ищет поля схемы по частям строк.
Поиск смотрит в имя поля, описание, `const`, enum-значения, `pattern`, `$ref` и примеры.
Результат всегда остаётся на уровне полей схемы, а не произвольных вложенных узлов JSON Schema.
Без `--keys` выводит найденные поля в той же YAML-структуре, что и полная сводка.
С `--keys` выводит только имена найденных полей.

`--exact` меняет `--search` на точечный режим: запрос должен точно совпасть с именем одного top-level поля, а вывод становится подробной LLM-сводкой этого поля.
Подробная сводка использует ту же YAML-структуру, но содержит ровно одно поле.
С `--keys` точечный режим выводит только найденное имя поля.
`--exact` допустим только вместе с `--search`.

`terms` делится по символу `|`, пробелы вокруг терминов отбрасываются, пустые термины игнорируются.
Поиск выполняется как вхождение части строки без учёта регистра.
Так как `|` в shell имеет служебный смысл, в примерах фильтры пишутся в кавычках: `"путь|вид"`.

Режимы `--json-schema`, `--required` и `--search` взаимоисключающие.
`--keys` и `--exact` не считаются отдельными режимами, а только уточняют форму или точность выдачи.

## Формат вывода

Полная сводка и `--search` используют одинаковый YAML-формат через `yaml.stringify`.
`--keys` выводит plain text.
Цель формата - компактный контекст для LLM, а не JSON Schema-совместимость.
Все YAML-сводки, кроме `--keys`, возвращают одну структуру верхнего уровня: `fields`.
Вывод не дублирует имя схемы, запрос и режим команды, потому что они уже есть в самой команде.
Пустые свойства карточки не печатаются: `enum: []`, `patterns: []`, `refs: []`, `description: null`, `examples: []` и `const: null` опускаются.

Пример полной сводки:

```yaml
fields:
  - key: Вид
    required: true
    type:
      - string
    const: ПолеВвода
  - key: ПутьКДанным
    required: false
    type:
      - string
```

Пример `--search --exact`:

```yaml
fields:
  - key: ПутьКДанным
    required: false
    type:
      - string
```

Пример `--search`:

```yaml
fields:
  - key: Вид
    required: true
    type:
      - string
    const: ПолеВвода
  - key: ПутьКДанным
    required: false
    type:
      - string
```

Пример `--search --keys`:

```text
Вид
ПутьКДанным
```

## Архитектура

Точную JSON Schema продолжает строить core через существующие `exportJSONSchemaForSchemaName` и `exportJSONSchemaForProjectFile`.
Новая логика живёт рядом с `packages/core/metadata/validation/`, например в `schemaSummary.ts`, и принимает уже построенную JSON Schema.

Core отвечает за:

- разрешение target в JSON Schema через существующие функции;
- извлечение top-level `properties` и `required`;
- нормализацию JSON Schema-конструкций в короткие LLM-сводки;
- поиск по строковым фрагментам свойства;
- точечное извлечение подробной сводки свойства;
- приведение всех YAML-режимов, кроме `--keys`, к единой структуре `fields`;
- удаление пустых свойств карточки перед выводом.

CLI отвечает только за:

- разбор ключей `commander`;
- проверку несовместимых сочетаний;
- вызов core helper;
- печать YAML-сводки, `--keys` как plain text или точной JSON Schema в режиме `--json-schema`.

Это сохраняет `schema` тонкой оболочкой и не добавляет предметную логику в CLI.

## Поток данных

1. CLI разбирает `<target>`, `--project` и ключи.
2. Если указан `--json-schema`, поведение совпадает с текущим `printJSONSchema`; `--inline` работает только здесь.
3. Иначе CLI запрашивает compact JSON Schema в режиме external refs.
4. Core строит список свойств из top-level `properties`.
5. Выбранный режим фильтрует список: все поля, required, search или exact search.
6. `--keys` при необходимости преобразует результат к plain text списку ключей.
7. CLI печатает результат в stdout.

## Ошибки

Сохраняются текущие ошибки выбора схемы: неизвестное имя, неподдержанный YAML-путь, файл вне `--project`, не `.yaml`.

Дополнительные ошибки:

- несколько основных режимов одновременно, например `--required --search` или `--json-schema --search`;
- `--inline` без `--json-schema`;
- `--json-schema` вместе с `--keys`;
- `--search` без непустого запроса;
- `--exact` без `--search`;
- `--search --exact` для отсутствующего поля.

`--keys "путь|вид"` без совпадений не ошибка: команда печатает пустой stdout.
`--search "путь|вид"` без совпадений тоже не ошибка: команда печатает пустой список совпадений.

## Обновление внешнего навыка

После реализации нужно обновить `/Users/nikita/git/new_config_add_item_test/.agents/skills/config-add-item/SKILL.md`.
Навык должен использовать новые срезы как основной путь:

- `nkdk schema "<file>" --required --keys --project "<yaml-project-dir>"` для обязательных полей;
- `nkdk schema "<schema>" --keys "термин|термин"` для поиска известных ключей;
- `nkdk schema "<schema>" --search "термин|термин" --keys` для широкого поиска полей;
- `nkdk schema "<schema>" --search "<field>" --exact` для точечной подсказки.

`nkdk schema "<schema>" --json-schema` остаётся запасным точным источником, когда YAML-сводки недостаточно.

## Тестирование

Core-тесты:

- `--keys`-эквивалент возвращает top-level ключи `InputField`;
- полный YAML-режим без ключей возвращает top-level поля `InputField`;
- фильтр `путь|вид` ищет по частям строки без учёта регистра;
- `required` возвращает `Вид` для `InputField`;
- `search` ищет по ключам и по строкам внутри свойства;
- `search` с `exact` возвращает точную сводку для `ПутьКДанным`;
- полный YAML-режим, `required` и `search` возвращают одинаковую структуру `fields`;
- пустые свойства карточки не попадают в YAML;
- `--keys` возвращает plain text без YAML-обёртки.

CLI-тесты:

- `schema <target>` без ключей печатает YAML-сводку;
- `schema <target> --json-schema` печатает прежний JSON;
- `--required` и `--search` печатают YAML;
- `--keys` печатает plain text;
- `--keys` сочетается с `--required` и `--search`;
- `--inline` без `--json-schema` даёт понятную ошибку и не пишет stdout;
- `--exact` без `--search` даёт понятную ошибку и не пишет stdout;
- несовместимые режимы дают понятную ошибку и не пишут stdout.

## Вне границ

- Отдельные команды `schema-keys`, `schema-required`, `schema-prop`, `schema-search`, `schema-template`.
- Отдельный ключ `--prop`.
- Ключ `--template`.
- Машинный флаг `--json` для LLM-срезов.
- Полная поддержка JSONPath, jq или JMESPath внутри CLI.
- Изменение самих JSON Schema и правил metadata.
