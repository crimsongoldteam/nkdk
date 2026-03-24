---
name: core-tests-toXML
description: Сгенерировать toXML.test.ts (или toDcsXML.test.ts) для открытого файла конвертера
---

1. Прочитай открытый `toXML.ts` / `toDcsXML.ts` — найди имя экспортируемой функции и её сигнатуру.
2. Прочитай `__fixtures__/data.ts` рядом — найди константы-эталоны (исходная модель).
3. Посмотри какие XML-файлы есть в `__fixtures__/` — по одному `it()` на каждый файл.
4. Создай тестовый файл рядом с исходником по шаблону (как в готовом тесте):

```ts
const rule: PropertyRule = {
  type: "<PropertyType>",
}

describe("export <PropertyType> to XML", () => {
  it("should export full to XML", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: <fixtureConst>,
      xmlRootTag: "<RootTag>",
      path: "<fullFixturePath>",
      importMetaUrl: import.meta.url,
      itemsTree: <itemsTree>,
    })

    expect(result).toEqual(expectedResult)
  })
})
```

Правила:

- Используй helper `testExportPropertyToXML`.
- Передавай `importMetaUrl: import.meta.url`.
- Для property внутри элемента формы указывай `itemsTree`.
- Рабочий пример: [contextMenu/toXML.test.ts](../../../../../packages/core/metadata/forms/elements/contextMenu/toXML.test.ts).
- Без комментариев в сгенерированном файле.
