# Configuration Root Modules YAML Design

## Цель

Сохранять корневые BSL-модули конфигурации при XML -> YAML -> XML round-trip.
Текущее расхождение: `Ext/ExternalConnectionModule.bsl` удаляется, потому что корневые `Ext/*Module.bsl` не представлены в YAML и не восстанавливаются при `sync`.

## Источники

- `model.xdtobackend_root.res`: у `ConfigurationProperties` есть внешние свойства `ManagedApplicationModule`, `SessionModule`, `ExternalConnectionModule`, `OrdinaryApplicationModule` и optional `ApplicationModule`.
- `/Users/nikita/git/round-trip-source/acc/Ext/ExternalConnectionModule.bsl`.
- `/Users/nikita/git/round-trip-source/acc/Ext/ManagedApplicationModule.bsl`.
- `/Users/nikita/git/round-trip-source/acc/Ext/OrdinaryApplicationModule.bsl`.
- `/Users/nikita/git/round-trip-source/acc/Ext/SessionModule.bsl`.
- UI конфигуратора: "Открыть модуль приложения", "Открыть модуль сеанса", "Открыть модуль внешнего соединения".
- `ru-en-map`: `МодульОбычногоПриложения` -> `OrdinaryApplicationModule`.

## YAML-форма

Корневые модули пишутся отдельными `.bsl` файлами рядом с `Конфигурация.yaml`:

- `МодульПриложения.bsl` -> `Ext/ManagedApplicationModule.bsl`;
- `МодульСеанса.bsl` -> `Ext/SessionModule.bsl`;
- `МодульВнешнегоСоединения.bsl` -> `Ext/ExternalConnectionModule.bsl`;
- `МодульОбычногоПриложения.bsl` -> `Ext/OrdinaryApplicationModule.bsl`.

Содержимое BSL не попадает внутрь `Конфигурация.yaml`.
Файлы должны копироваться без изменения текста и кодировки.

## Default-поведение

Если XML-файла нет, соответствующий YAML-файл не создается.
Если YAML-файла нет и reference-файла нет, экспорт не создает новый XML-файл.
Если YAML-файла нет, но reference-файл есть, экспорт должен сохранить reference-файл только в сценарии сохранения существующего XML без изменения этой части модели.
Если YAML-файл присутствует, XML строится из YAML-файла.

Пустой или почти пустой модуль, содержащий только комментарии, все равно считается содержательным файлом и должен round-trip'иться как есть.

## Архитектура

Добавить в `MetadataConfigurationRules` свойства типа `Module` для четырех корневых модулей.
Это такие же внешние файлы объекта конфигурации, как модули прикладных объектов, но `nkdkPath` лежит в корне YAML-проекта, а `xmlPath` лежит в `Ext/`.

`ApplicationModule` из XDT пока не вводится в YAML-модель: в исследованных XML-выгрузках и ru-en-map нет подтвержденного русского имени для отдельного файла.
Если такой файл появится в fixture или реальной конфигурации, его нужно разобрать отдельным расхождением.

## Проверка

План проверки для будущей реализации:

1. XML -> YAML для `/Users/nikita/git/round-trip-source/acc`: четыре `.bsl` файла появляются в корне YAML-каталога.
2. YAML -> XML с reference: четыре файла восстанавливаются в `Ext/`.
3. Содержимое `ExternalConnectionModule.bsl` сохраняется байт-в-байт, включая BOM, если он был в исходном файле.
4. Полный `round-trip-yaml --diff-index 4` больше не показывает удаление `Ext/ExternalConnectionModule.bsl`.
5. Проверить соседние diff'ы для `ManagedApplicationModule.bsl`, `OrdinaryApplicationModule.bsl`, `SessionModule.bsl`.
