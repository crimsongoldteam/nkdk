---
name: core-tests-fromXML
description: Сгенерировать fromXML.test.ts (или fromDcsXML.test.ts) для открытого файла конвертера
---

Цель: быстро собрать `fromXML.test.ts`/`fromDcsXML.test.ts` по фикстурам рядом с конвертером.

1. Прочитай открытый `fromXML.ts` / `fromDcsXML.ts` и определи тип свойства (`rule.type`).
2. Прочитай `./__fixtures__/data.ts` и найди эталоны для `expect(...)`.
3. Проверь `./__fixtures__/*.xml`: на каждый XML-файл должен быть отдельный `it()`.
4. Сгенерируй тест рядом с конвертером по шаблону ниже. Рабочий пример: [contextMenu/fromXML.test.ts](../../../../../packages/core/metadata/forms/elements/contextMenu/fromXML.test.ts).

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

Уточнения:

- Используй `testImportPropertyFromXML` (контекст внутри helper уже корректный).
- `xmlRootTag` берется из корневого тега соответствующего XML-фикстура.
- Имена тестов делай по сценарию (`full`, `minimal`, и т.д.), а не только `full`.
- Без лишних импортов и без комментариев в тесте.
