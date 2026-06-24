# Parent Configurations Reference-Only Design

## Цель

Не считать `Ext/ParentConfigurations.bin` расхождением полного `XML -> YAML -> XML` round-trip, но не добавлять этот файл в YAML-договор.

## Источники

- `model.xdtobackend_root.res`: у `ConfigurationProperties` есть внешнее свойство `ParentConfigurations` типа `ExternalProperty`.
- `ru-en-map`: `РодительскиеКонфигурации` -> `ParentConfigurations`.
- `/Users/nikita/git/round-trip-source/acc/Ext/ParentConfigurations.bin`: UTF-8 с BOM, одна длинная строка без переводов строк, размер 8046302 байта.
- `/Users/nikita/git/clean_cf`: чистая конфигурация без `Ext/ParentConfigurations.bin`.
- Текущий `round-trip-yaml` до исправления показывал удаление `Ext/ParentConfigurations.bin`, потому что файл не представлен в YAML и не восстанавливался после `sync`.

## Принятые решения

`ParentConfigurations.bin` не хранится в YAML-проекте.
Не создаем `РодительскиеКонфигурации.bin`, служебную папку или ключ в `Конфигурация.yaml`.

Файл не разбирается в модельные свойства.
Хотя он текстоподобный, внутри находится большой служебный снимок платформы с идентификаторами и именами родительской конфигурации.
Этот формат не является пользовательским YAML-договором.

Для диагностического `round-trip-yaml` файл считается reference-only.
После `nkdk sync` и до замены активного XML-каталога скрипт копирует `Ext/ParentConfigurations.bin` из reference во временный XML-каталог, если:

- файл есть в активном XML-каталоге;
- `sync` не создал такой файл сам.

Так `ParentConfigurations.bin` не попадает в список расхождений и не маскирует следующие реальные проблемы.

## Поведение по умолчанию

Если `Ext/ParentConfigurations.bin` отсутствует в XML-выгрузке, `round-trip-yaml` ничего не создает.
Если файл есть в reference, диагностический цикл сохраняет его байт-в-байт.

Это правило относится только к диагностическому skill `round-trip-yaml`.
Обычный YAML-проект и основной `nkdk sync` не получают новое свойство и не начинают хранить этот файл.

## Архитектура

Не добавлять свойство `parentConfigurations` в `MetadataConfigurationRules`.
Не использовать `ExternalFile` для `ParentConfigurations.bin`.

Список reference-only файлов живет в `.agents/skills/round-trip-yaml/round-trip.sh`:

```bash
REFERENCE_ONLY_XML_FILES=("Ext/ParentConfigurations.bin")
```

Перед заменой активного XML-каталога скрипт вызывает сохранение этих файлов из reference во временный XML-каталог.
Поведение описано в `.agents/skills/round-trip-yaml/SKILL.md`, чтобы следующие диагностические прогоны не трактовали это как обычный YAML-дефект.

## Проверка

Проверки для принятого решения:

1. `bash -n .agents/skills/round-trip-yaml/round-trip.sh` проходит.
2. `round-trip-yaml --triage --batch-size 1 --start-index 12` пишет `Сохранён reference-only файл: Ext/ParentConfigurations.bin`.
3. После прогона `Ext/ParentConfigurations.bin` отсутствует в `git diff --name-only`.
4. Количество расхождений в `acc` уменьшается с 15 до 14.
5. На месте прежнего 12-го расхождения появляется следующий файл, например `Ext/SessionModule.bsl`.
