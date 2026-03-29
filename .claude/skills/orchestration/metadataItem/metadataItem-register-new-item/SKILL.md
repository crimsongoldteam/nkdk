---
name: metadataItem-register-new-item
description: Как создать новый metadataItem с rules.ts — регистрация, шаблоны, тесты
---

Используй этот скилл при добавлении любого нового `metadataItem`: объекта метаданных, подтипа, вложенного элемента и т.п.

## Что нужно запросить у пользователя

Перед началом работы запроси:

1. **Эталонный XML** — файл `__fixtures__/full.xml` с заполненными полями
2. **Файл ресурсов (.res)** — схема с `objectType`-описаниями всех свойств и типов
3. **Названия полей и YAML-синонимы** — список вида:
   ```
   # ИмяОбъекта1C (ObjectNameInternal)
   Свойства:
   РусскийКлюч (EnglishKey)
   ...
   ```

Если у объекта есть подтипы, которых **ещё нет в системе** (проверь по `registry.ts`), запроси те же три источника для каждого из них.

## Правило: full.xml — источник истины

> **Нельзя изменять `full.xml`.** Весь генерируемый код (rules.ts, types.ts, data.ts, fromXML/toXML) должен соответствовать этому файлу.
> Если экспортер не воспроизводит атрибуты из оригинального XML (например, `xsi:type`, `xmlns="..."`), нужно убрать их из `full.xml`, а не добавлять в экспортер.
> Один раз установив формат фикстуры, не менять его под код — менять код под фикстуру.

> **Важно про `xmlns="..."`:** элементы с дефолтным namespace при парсинге получают `{ "#text": value, "_xmlns": "..." }` вместо простого значения — это ломает boolean/SystemEnumeration импортеры. Решение — убрать `xmlns` из `full.xml`.

## Обязательные точки регистрации

1. **Реестр metadataItem** — `packages/core/metadata/orchestration/metadataItem/registry.ts`
   - добавь новый ключ в `MetadataItemTypeRegistry`:
     - `metadata: <Type>`
     - `yaml: <TypeYAML>`
     - опционально `enterprise: <TypeEnterprise>`
     - опционально `yamlTyped: <TypeTypedYAML>`

2. **Реестр property** — `packages/core/metadata/orchestration/property/registry.ts`
   - добавь новый ключ в `PropertyTypeRegistry` и `PropertyRuleTypeKeys`

3. **Side-effect подключение** (иначе регистрация не сработает при использовании пакета):
   - для прикладных объектов: `packages/core/metadata/appliedObjects/index.ts`
   - для форм: `packages/core/metadata/forms/index.ts`
   - для элементов формы: `packages/core/metadata/forms/elements/index.ts`

## Для element metadataItem (дополнительно)

1. В `rules.ts` элемента вызови `registerElementRule(itemType, rules)`.
2. Если элемент участвует как значение свойства через property-type, добавь `registerElementAsType(...)`.
3. Убедись, что `rules.ts` элемента импортируется в `packages/core/metadata/forms/elements/index.ts`.

## Расположение файлов

```
<module>/
├── <objectName>/
│   ├── rules.ts
│   ├── types.ts
│   ├── fromXML.test.ts
│   ├── toXML.test.ts
│   ├── fromYAML.test.ts
│   ├── toYAML.test.ts
│   └── __fixtures__/
│       ├── full.xml        ← источник истины, не менять
│       └── data.ts
└── <objectName><SubType>/  ← каждый подтип — отдельная директория (только rules.ts + types.ts)
```

В `index.ts` — сначала подтипы, затем главный объект:
```typescript
import "./<objectName><SubType>/types"
import "./<objectName>/types"
```

## Шаблон rules.ts

```typescript
import { MetadataItemRule } from "~/metadata/orchestration"

export const <ObjectName>Rules = {
  itemType: "<ObjectName>",
  properties: {
    <tsKey>: {
      type: "<propertyType>",     // string | boolean | I8nText | TypeDescription | SystemEnumeration | <OtherItemType>
      xml: "<prefix:xmlTag>",     // только если отличается от capitalize(tsKey)
      yaml: "<РусскийКлюч>",
      order: 1,
      // typeSE: "<EnumName>",    // только для SystemEnumeration
    },
  },
} as const satisfies MetadataItemRule
```

Не указывай `xml`, если XML-тег совпадает с `capitalize(tsKey)`.

## Шаблон types.ts

### Одиночный объект

```typescript
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { <ObjectName>Rules } from "./rules"
// Для главного объекта — импорты подтипов:
// import "../<objectName><SubType>/types"

export type <ObjectName> = MetadataTypeByRule<typeof <ObjectName>Rules>
export type <ObjectName>YAML = YAMLTypeByRule<typeof <ObjectName>Rules>

registerMetadataItemRule({ propertyType: "<ObjectName>", itemRule: <ObjectName>Rules })
```

### Коллекция (массив однотипных элементов)

Используй `registerMetadataItemCollectionRule`, если свойство в XML — это повторяющиеся теги одного типа (без обёрточного элемента), а в YAML — массив.

```typescript
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration"
import { <ObjectName>Rules } from "./rules"

export type <ObjectName>Item = MetadataTypeByRule<typeof <ObjectName>Rules>
export type <ObjectName>ItemYAML = YAMLTypeByRule<typeof <ObjectName>Rules>

export type <ObjectName> = <ObjectName>Item[]
export type <ObjectName>YAML = <ObjectName>ItemYAML[]

registerMetadataItemCollectionRule({
  propertyType: "<ObjectName>",
  itemRule: <ObjectName>Rules,
  xmlElement: "<prefix:xmlTag>",  // тег повторяющегося элемента в XML
  yamlAsArray: true,
})
```

Если стандартный механизм коллекции не справляется (например, двойная вложенность тегов), не создавай кастомные fromXML/toXML самостоятельно — сначала опиши проблему пользователю.

## Шаблоны тестов

```typescript
// fromXML.test.ts
import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { full<ObjectName> } from "./__fixtures__/data"
import "./types"

describe("import <ObjectName> from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule: { type: "<ObjectName>" },
      path: "full.xml",
      xmlRootTag: "<RootXmlTag>",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(full<ObjectName>)
  })
})
```

```typescript
// toXML.test.ts — ОБЯЗАТЕЛЬНО использовать importContentFromXML для сравнения
import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { importContentFromXML } from "~/xml/import/importer"
import { full<ObjectName> } from "./__fixtures__/data"
import "./types"

describe("export <ObjectName> to XML", () => {
  it("exports full.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: { type: "<ObjectName>" },
      value: full<ObjectName>,
      xmlRootTag: "<RootXmlTag>",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(importContentFromXML(result)).toEqual(importContentFromXML(expectedResult!))
  })
})
```

`fromYAML.test.ts` — `value: full<ObjectName>YAML`. `toYAML.test.ts` — `rule: { type: "<ObjectName>", yaml: "<РусскийКлюч>" }`.

## Шаблон __fixtures__/data.ts

```typescript
import type { <ObjectName>, <ObjectName>YAML } from "../types"

export const full<ObjectName>: <ObjectName> = {
  itemType: "<ObjectName>",
  // поля строго из full.xml
}

export const full<ObjectName>YAML: <ObjectName>YAML = {
  // YAML-ключи (русские) со значениями
}
```

## Когда задавать вопросы пользователю

**При выборе типа свойства** — если стандартный тип не подходит однозначно, остановись и опиши проблему:
- Какой тип кажется ближайшим
- Почему он не подходит (например: тип зарегистрирован, но его имporter не обрабатывает нужный формат; или нет подходящего типа в реестре)
- Какие альтернативы есть

Не подбирай тип самостоятельно методом проб — спроси.

**При необходимости создать кастомные fromXML/toXML** — не создавай их без явного согласования с пользователем. Перед созданием:
- Объясни, почему стандартный механизм (`registerMetadataItemRule` + `rules.ts`) не справляется
- Предложи варианты (например: изменить `full.xml`, добавить обработку в существующий тип, создать кастомный обработчик)
- Жди решения пользователя

Кастомные функции импорта/экспорта — крайнее средство. По умолчанию стремись обойтись без них.

## Алгоритм работы

1. Получить от пользователя: XML, .res, поля+синонимы (для главного объекта и всех новых подтипов)
2. Зафиксировать `full.xml` — больше не менять
3. Для каждого нового подтипа создать директорию с `rules.ts` + `types.ts`
4. Создать главный `rules.ts` + `types.ts`, импортировав подтипы
5. Обновить реестры (`metadataItem/registry.ts`, `property/registry.ts`) и `index.ts`
6. Создать `__fixtures__/data.ts` — внутренняя модель строго из `full.xml`
7. Создать 4 тестовых файла
8. Запустить `pnpm type-check` и тесты; если что-то не сходится — менять код, не фикстуру

## Минимальный checklist перед PR

1. `itemType` совпадает во всех местах (`types.ts`, `rules.ts`, `registry.ts`).
2. Есть импорты конвертеров `fromXML/fromYAML/toXML/toYAML` в нужном index-файле.
3. Для `enterprise`-экспорта тип содержит `enterprise` в `MetadataItemTypeRegistry`.
4. Добавлены тесты конвертеров на fixture-данных.

## Как понять, что забыта регистрация

- Ошибки вида `Unknown element type: ...` в runtime.
- Тип не выводится через `ToYAML`/`ToMetadata`/`ToEnterprise`.
- Конвертеры не вызываются, хотя файлы существуют.
