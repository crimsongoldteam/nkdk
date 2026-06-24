# Тест-блоки reproducer'а

Добавляй **по одному** `it(...)` блоку в существующие `fromXML.test.ts` и `toXML.test.ts` целевого модуля. `describe` и `rule` уже есть в файле — не дублируй.

Если в файле используется общий `rule` снаружи `describe` — переиспользуй его. Если `rule` объявлен внутри `it` — объяви локально в новом `it` тоже.

## `fromXML.test.ts` — блок импорта

```typescript
import { <slug> } from "./__fixtures__/<slug>"

// ... внутри существующего describe:
it("import <slug>", () => {
  const result = testImportPropertyFromXML({
    rule,
    path: "<slug>.xml",
    xmlRootTag: "<XmlRootTag>",
    importMetaUrl: import.meta.url,
  })

  expect(result).toEqual(<slug>)
})
```

Что ловит: `fromXML` должен превратить `<slug>.xml` в `<slug>` (ожидаемая форма). Пока правило сломано — `toEqual` падает.

## `toXML.test.ts` — блок экспорта

```typescript
import { <slug> } from "./__fixtures__/<slug>"

// ... внутри существующего describe:
it("export <slug>", () => {
  const { result, expectedResult } = testExportPropertyToXML({
    rule,
    value: <slug>,
    xmlRootTag: "<XmlRootTag>",
    path: "<slug>.xml",
    importMetaUrl: import.meta.url,
  })

  expect(result).toEqual(expectedResult)
})
```

Что ловит: сериализация `<slug>` обратно в XML должна посимвольно совпасть с `<slug>.xml`. Пока правило сломано — `toEqual` падает.

## Подсказки

- `xmlRootTag` берётся из существующих тестов модуля (скопируй как есть).
- Если в модуле уже используется паттерн с раздельным `const rule = {...}` снаружи `describe` — не плоди второй, переиспользуй.
- Не трогай существующие `it(...)` блоки и round-trip блоки — только добавляй новые.
- Имена `it` — английские с camelCase-slug'ом (`import isFolderParentSwap`), чтобы совпадать с именем файла и экспорта.
