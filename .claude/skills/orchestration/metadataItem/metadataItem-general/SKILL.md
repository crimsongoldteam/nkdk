---
name: metadataItem-general
description: Работа с metadataItem в packages/core/metadata/orchestration
---

Используй этот скилл, когда нужно добавить или изменить `metadataItem` в оркестрации (`packages/core/metadata/orchestration/**`) и не потерять согласованность типов/правил.

## Что проверить перед изменениями

1. Найди существующий `rules.ts` похожего объекта (форма, common object, applied object).
2. Убедись, что типы объекта (`types.ts`) уже описаны для metadata/yaml (и enterprise, если нужно).
3. Проверь, есть ли используемые типы свойств в `PropertyTypeRegistry` (`packages/core/metadata/orchestration/property/registry.ts`).

## Базовый workflow для нового metadataItem

1. Создай/обнови `rules.ts` рядом с объектом:
   - `itemType` должен совпадать с ключом в `MetadataItemTypeRegistry`.
   - правило должно быть `as const satisfies MetadataItemRule`.
   - у свойств не дублируй `xml`, если имя XML-тега совпадает с дефолтом `capitalize(ключ)` (ключ в camelCase со строчной первой буквой → в XML та же строка с прописной первой буквой); см. skill `metadataItem-rules`.
2. Добавь тип в `MetadataItemTypeRegistry`:
   - файл: `packages/core/metadata/orchestration/metadataItem/registry.ts`;
   - укажи минимум `metadata` и `yaml`;
   - добавь `enterprise` и/или `yamlTyped`, если тип реально поддерживает эти представления.
3. Подключи side-effect импорты конвертеров в индекс соответствующего домена:
   - формы: `packages/core/metadata/forms/index.ts`;
   - прикладные объекты: `packages/core/metadata/appliedObjects/index.ts`;
   - элементы формы: `packages/core/metadata/forms/elements/index.ts`.
4. Для элементов формы проверь регистрацию element-правила:
   - `registerElementRule(...)` в `rules.ts`;
   - при необходимости `registerElementAsType(...)` для property-type привязки.
5. Добавь/обнови тесты `fromXML`, `toXML`, `fromYAML`, `toYAML` по fixture-паттерну проекта (в `__fixtures__/data.ts` для сценария **full** используй `satisfies Required<ИмяТипаМодели>` — см. `core-tests-general`).

## Частые ошибки

1. `itemType` есть в `rules.ts`, но отсутствует в `metadataItem/registry.ts`.
2. Конвертеры есть, но не импортированы через индекс (`forms/index.ts` или `appliedObjects/index.ts`) и не выполняются side-effect регистрации.
3. Для element-типа добавлен `rules.ts`, но не подключен в `forms/elements/index.ts`.
4. Тип зарегистрирован без `enterprise`, хотя объект экспортируется в enterprise-формат.

## Критерий готовности

- Новый `metadataItem` типобезопасно проходит путь XML/YAML (и enterprise, если применимо).
- Все необходимые side-effect импорты на месте.
- Тесты на конвертацию для нового объекта проходят.
