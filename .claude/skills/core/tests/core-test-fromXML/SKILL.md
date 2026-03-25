---
name: core-test-fromXML
description: Сгенерировать fromXML.test.ts или fromDcsXML.test.ts — только через testImportPropertyFromXML из ~/tests/property; не вызывай importMetadataItemFromXML в тестах. См. core-tests-general.
---

**Когда открывать:** тест импорта из XML, открыт `fromXML.ts` / `fromDcsXML.ts`, или только `rules.ts` с `MetadataItemRule`. Сначала [core-tests-general](./../core-tests-general/SKILL.md).

---

## A. Свойство (`PropertyRule`, `testImportPropertyFromXML`)

Если тип в `rule.type` зарегистрирован и есть фикстура с **корневым тегом** под `xmlRootTag`:

1. Прочитай `fromXML.ts` / `fromDcsXML.ts` и `rule.type`.
2. `__fixtures__/data.ts` — эталон модели; `__fixtures__/*.xml` — по одному `it()` на файл.
3. Шаблон:

```ts
const rule: PropertyRule = {
  type: "<Type>",
}

describe("import <Type> from XML", () => {
  it("should import <fixture name> from XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "<fixture>.xml",
      xmlRootTag: "<RootTag>",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(<fixtureConst>)
  })
})
```

Используй **`testImportPropertyFromXML`** из `~/tests/property/importPropertyFromXML` — **не** вызывай в тестах `importMetadataItemFromXML` напрямую ([core-tests-general](../core-tests-general/SKILL.md)). Пример: [contextMenu/fromXML.test.ts](../../../../../packages/core/metadata/forms/elements/contextMenu/fromXML.test.ts).

---

## B. MetadataItemRule без отдельного `fromXML.ts`

Объект описан только `...Rules`, но тест всё равно через **property**: зарегистрируй в `PropertyTypeRegistry` тип-обёртку (union или конкретная ветка) с `registerTypeRule(..., "importFromXML", …)` и проверяй импорт через **`testImportPropertyFromXML`** с `PropertyRule { type: "<Type>" }`, `path`, `xmlRootTag`, `importMetaUrl` — эталон в `data.ts`. Пример: [filterItem/fromXML.test.ts](../../../../../packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts) (`type: "FilterItem"`).

Если для сценария ещё нет зарегистрированного `type` для `importFromXML` — **сначала** добавь регистрацию, **затем** генерируй тест по разделу A.

Парный скилл экспорта: [core-tests-toXML](../core-tests-toXML/SKILL.md).

Без лишних импортов и без комментариев в сгенерированном тесте.
