---
name: core-types-plain-objects
description: Описывает, как добавлять типы для простых объектов в packages/core/metadata/commonObjects без правил оркестрации (без registerTypeRule/MetadataItemRule), включая model/YAML/XML, TypeBox-схему и нейминг. Используй, когда пользователь просит "добавить только types.ts по фикстуре" или "описать типы без rules".
---

# Core Types Plain Objects

Используй этот скилл, когда нужно создать или обновить только `types.ts` для объекта, который **не регистрируется** в оркестрации и не требует `rules.ts`.

## Когда применять

- Есть задача уровня: "добавь типы model/yaml/xml по фикстуре".
- Нет требований добавлять `fromXML.ts`, `toXML.ts`, `fromYAML.ts`, `toYAML.ts`, `registry.ts`.
- Тип используется как вложенный контракт данных, а не как самостоятельное правило реестра.

## Рекомендуемый нейминг

Для объектов без правил используй термин **Plain Object Type** и следующие имена:

- Базовое имя сущности: `Xxx` (например `StandartBeginningDate`).
- Внутренняя модель: `Xxx`.
- YAML-тип: `XxxYAML`.
- XML-тип: `XxxXML`.
- TypeBox-схема YAML: `XxxJSONSchema`.

Для enum-полей:

- Если есть системное перечисление `SomethingFromYAML`, строить union через `Type.Literal` по `Object.keys(...)`.
- Не использовать `Type.Unsafe`, если можно собрать конкретный union литералов.

## Обязательный шаблон для types.ts

1. Импортировать `Static` и `Type` из `@sinclair/typebox`.
2. Описать **model interface** (camelCase-ключи).
3. Описать **YAML JSONSchema** через `Type.Object`.
4. Получить `XxxYAML` как `Static<typeof XxxJSONSchema>`.
5. Описать **XML interface** по структуре XML-фикстуры (точные XML-ключи).

## Практические правила

- YAML-ключи: в стиле проекта (обычно русские PascalCase-ключи).
- XML-ключи: строковые литералы с namespace, например `"v8:variant"`.
- Для даты/времени в YAML использовать `Type.String({ pattern: ... })`, если нужен формат проекта (например `ДД.ММ.ГГГГ ЧЧ:ММ:СС`).
- Для системных перечислений в runtime-конвертерах использовать только актуальные функции (`importSystemEnumerationFromYAML`, `exportSystemEnumerationToYAML`), не использовать `*Deprecated`.
- Не добавлять лишние runtime-конвертеры в `types.ts`.
- Держать файл коротким и декларативным.

## Мини-чеклист перед завершением

- Есть `Xxx`, `XxxJSONSchema`, `XxxYAML`, `XxxXML`.
- Enum-поля в YAML-схеме собраны через `Type.Literal` union.
- Опциональность полей совпадает с фикстурой.
- Линтер/TS по измененному файлу без ошибок.
