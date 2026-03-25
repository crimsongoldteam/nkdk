---
name: metadataItem-rules
description: Работа с построителем объектов через rules (rules.ts)
---

# Когда использовать этот skill

Используй этот skill, когда нужно добавить/изменить metadataItem, который описывается через `rules.ts` (особенно для элементов форм), и понять:
- где лежат файлы;
- как вывести типы из rule-объекта;
- когда можно обойтись без отдельных `fromXML.ts`/`toXML.ts`/`fromYAML.ts`/`toYAML.ts`;
- где смотреть реестр типов свойств и настройки property rule.

# Где лежат файлы

Для элемента формы обычно используются:
- `packages/core/metadata/forms/elements/<element>/rules.ts`
- `packages/core/metadata/forms/elements/<element>/types.ts`

Пример:
- `packages/core/metadata/forms/elements/chartField/rules.ts`
- `packages/core/metadata/forms/elements/chartField/types.ts`

# Как строится rules.ts (на примере chartField)

В `rules.ts` описывается один константный rule-объект и его регистрация:

1. Импортируются типы/хелперы:
   - `ElementRule`
   - `PropertyRule` (часто только для ре-экспорта)
   - `registerElementRule(...)`

2. Объявляется `ChartFieldRules` с `satisfies ElementRule`:
   - `itemType` - тип metadata item (`"ChartField"`)
   - `enterpriseField` - корневое поле для enterprise-экспорта
   - `enterpriseFieldType` - enterprise-тип поля
   - `properties` - карта свойств и их правил

3. Каждое свойство в `properties` описывается через rule:
   - `type` (например, `"boolean"`, `"number"`, `"DataPath"`, `"Events"`)
   - `yaml` (русский ключ в YAML)
   - флаги направления (`toYAML`, `fromYAML`, `toEnterprise` и т.п.)
   - дополнительные настройки типа (например, `defaultType` у `DataPath`, `items` у `Events`)

4. Правило регистрируется:
   - `registerElementRule("ChartField", ChartFieldRules)`

Часто общие свойства добавляются через spread (например, `...formFieldCommonProperties`).

# Как строятся типы в types.ts

Для простых случаев типы выводятся из rule-объекта автоматически.

**Внутренняя metadata-модель** — выбор между двумя обёртками над общей структурой свойств (`packages/core/metadata/orchestration/metadataItem/element.ts`):

- **`MetadataTypeByRule<typeof SomeRules>`** — добавляет к полям из правил опциональное поле `uuid?`. Используй для metadataItem **без** идентификатора элемента формы: прикладные объекты метаданных (`MetadataCatalog`, `MetadataCommand`), общие объекты (`MetadataAttribute`, `StandardAttributeDescription`), DCS-структуры, **`DynamicList`** и т.п.

**Фикстуры full в тестах:** для эталонной модели со всеми свойствами в `__fixtures__/data.ts` используй `satisfies Required<…>` с соответствующим типом (например `satisfies Required<DynamicList>`) — см. скилл `core-tests-general`.
- **`FormTypeByRule<typeof SomeRules>`** — добавляет опциональное поле `id?`. Используй для **элементов формы** (узлы на форме: `ChartField`, `InputField`, `Table`, …), где в модели фигурирует id элемента.

Примеры:

- `MetadataTypeByRule<typeof MetadataCatalogRules>` — внутренняя модель справочника
- `FormTypeByRule<typeof ChartFieldRules>` — внутренняя модель поля диаграммы на форме

Дополнительно:

- `YAMLTypeByRule<typeof ChartFieldRules>` -> YAML-тип
- `EnterpriseType<typeof ChartFieldRules>` -> enterprise-тип

На примере `chartField/types.ts`:
- `ChartField`
- `ChartFieldPartialYAML`
- `ChartFieldEnterprise`

Отдельные ручные интерфейсы обычно не нужны, если структура полностью выражается через `properties` в `rules.ts`.

# Когда не нужны отдельные from/to файлы

Если поведение элемента укладывается в стандартные property/type rules, достаточно:
- `rules.ts`
- `types.ts`

И использовать стандартный оркестрационный пайплайн.

Для свойств:
- `importPropertyFromXML` -> `packages/core/metadata/orchestration/property/fromXML.ts`
- `exportPropertyToXML` -> `packages/core/metadata/orchestration/property/toXML.ts`
- `importPropertyFromYAML` -> `packages/core/metadata/orchestration/property/fromYAML.ts`
- `exportPropertyToYAML` -> `packages/core/metadata/orchestration/property/toYAML.ts`

Для элементов:
- `importElementFromXML` -> `packages/core/metadata/orchestration/formElement/fromXML.ts`
- `exportElementToXML` -> `packages/core/metadata/orchestration/formElement/toXML.ts`
- `importElementFromYAML` -> `packages/core/metadata/orchestration/formElement/fromYAML.ts`
- `exportElementToYAML` -> `packages/core/metadata/orchestration/formElement/toYAML.ts`

Отдельные `fromXML.ts`/`toXML.ts`/`fromYAML.ts`/`toYAML.ts` для конкретного элемента **крайне желательно не создавать**. Они допустимы только как исключение, если стандартного поведения rule-системы действительно недостаточно.

# Где лежат отдельные правила типов (registry)

Реестр типов свойств находится в:
- `packages/core/metadata/orchestration/property/registry.ts`

Ключевая точка:
- `PropertyTypeRegistry` - словарь всех поддерживаемых `type`, где для каждого типа задаются представления:
  - `item`
  - `yaml`
  - `enterprise` (если применимо)

Именно значения `type` в `rules.ts` должны соответствовать ключам этого реестра.

# Настройки каждого property rule

Базовые поля правила свойства описаны в:
- `packages/core/metadata/orchestration/property/types.ts`
- интерфейс `BasePropertyRule`

Основные настройки:
- `required`
- `runtimeOnly`
- `order`
- `yaml`
- `toYAML` / `fromYAML`
- `toPartialYAML`
- `defaultValueYAML`
- `xml`
- `toXML` / `fromXML`
- `xmlParents`
- `defaultValueXML`
- `toEnterprise` / `fromEnterprise`
- `defaultValue`
- `tag`
- `useAsShortValueYAML`
- `forReferenceOnly`

**`xml`:** не указывай, если имя XML-элемента совпадает с **дефолтом** — `capitalize(ключ)` (реализация: `packages/core/metadata/orchestration/property/fromXML.ts`, `toXML.ts`). Ключ свойства в `properties` обычно в camelCase с **строчной** первой буквой; по умолчанию в XML используется то же имя с **заглавной** первой буквой (например, `minValue` → `MinValue`). Указывай `xml` только когда тег в XML другой (например, `dcsset:filter`, другое имя в PascalCase и т.п.).

Плюс есть специализированные rule-интерфейсы (`EventsPropertyRule`, `DataPathPropertyRule`, `TypeDescriptionPropertyRule` и др.) для типов, которым нужны дополнительные поля.

# Быстрый чеклист при добавлении нового элемента

1. Создай `rules.ts` рядом с элементом и опиши `...Rules` с `satisfies ElementRule`.
2. Добавь регистрацию через `registerElementRule("<ItemType>", ...Rules)`.
3. Создай `types.ts` и выведи типы: для metadata-модели — `MetadataTypeByRule` или `FormTypeByRule` в зависимости от контекста (см. раздел «Как строятся типы в types.ts»); плюс YAML/enterprise через `YAMLTypeByRule` / `EnterpriseType` где нужно.
4. Убедись, что `type` каждого свойства существует в `PropertyTypeRegistry`.
5. Если хватает стандартного пайплайна, отдельные `fromXML.ts`/`toXML.ts`/`fromYAML.ts`/`toYAML.ts` **крайне желательно не создавать**.
