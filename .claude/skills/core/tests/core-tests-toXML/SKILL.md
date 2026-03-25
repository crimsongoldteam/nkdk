---
name: core-tests-toXML
description: Сгенерировать toXML.test.ts через testExportPropertyToXML из ~/tests/property; не вызывай exportMetadataItemToXML в тестах. См. core-tests-general.
---

Сначала [core-tests-general](../core-tests-general/SKILL.md) — раздел про обёртки `testExportPropertyToXML`.

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

Если `path` и `importMetaUrl` не указывать, эталонный XML из файла не читается: `expectedResult` будет `undefined`, сравнение делай сам (например с XML из `__fixtures__/data.ts` через `importContentFromXML`).

Правила:

- Используй **`testExportPropertyToXML`** из `~/tests/property/exportPropertyToXML` — **не** вызывай в тестах `exportMetadataItemToXML` напрямую; для metadata-item нужен зарегистрированный `PropertyRule.type` с `exportPropertyToXML` (как для `FilterItem` и т.п.).
- Без `path` (и без пары с `importMetaUrl` для локальных `__fixtures__`) `expectedResult` не заполняется — эталон задавай в самом тесте.
- Всегда передавай `importMetaUrl: import.meta.url`, если fixture лежат в локальном `__fixtures__` рядом с тестом.
- Для property внутри элемента формы указывай `itemsTree`.
- Если проверяешь XML без служебных `id` после нумерации, передавай `applyNumberingIds: false`.
- Если fixture в `tests/fixtures`, можно не передавать `importMetaUrl`.
- Рабочий пример: [contextMenu/toXML.test.ts](../../../../../packages/core/metadata/forms/elements/contextMenu/toXML.test.ts).
- Доп. пример с локальными `__fixtures__`: `standardAttributeDescription/toXML.test.ts`.
- Без комментариев в сгенерированном файле.
