---
description: Сгенерировать fromXML.test.ts (или fromDcsXML.test.ts) для открытого файла конвертера
---

1. Прочитай открытый `fromXML.ts` / `fromDcsXML.ts` — найди имя экспортируемой функции импорта и XML-тип, который она принимает.
2. Прочитай `__fixtures__/data.ts` рядом — найди константы-эталоны (ожидаемый результат).
3. Посмотри какие XML-файлы есть в `__fixtures__/` — по одному `it()` на каждый файл.
4. Создай тестовый файл рядом с исходником по шаблону:

```ts
import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFixture } from "~/tests/readFixtureXML"
import { <fixtureConst> } from "./__fixtures__/data"
import { <importFn> } from "./fromXML"
import type { <XmlType> } from "./types"

describe("import <Type> from XML", () => {
  it("import full from XML", () => {
    const parsed = readAndParseXMLFixture<{ <RootTag>: <XmlType> }>(import.meta.url, "<fixture>.xml")
    expect(<importFn>(mockContextFromXML(), parsed.<RootTag>)).toEqual(<fixtureConst>)
  })
})
```

Правила:

- Контекст — `mockContextFromXML()`, не `mockContext`.
- Корневой тег берётся из самого XML-файла — прочитай его.
- XML-тип импортируй из `./types`, если он там определён, или из `./fromXML` если объявлен inline.
- Без комментариев в сгенерированном файле.
