---
description: Сгенерировать toXML.test.ts (или toDcsXML.test.ts) для открытого файла конвертера
---

1. Прочитай открытый `toXML.ts` / `toDcsXML.ts` — найди имя экспортируемой функции и её сигнатуру.
2. Прочитай `__fixtures__/data.ts` рядом — найди константы-эталоны (исходная модель).
3. Посмотри какие XML-файлы есть в `__fixtures__/` — по одному `it()` на каждый файл.
4. Создай тестовый файл рядом с исходником по шаблону:

```ts
import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
import { <fixtureConst> } from "./__fixtures__/data"
import { <exportFn> } from "./toXML"

describe("export <Type> to XML", () => {
  it("export full to XML", () => {
    const exported = <exportFn>(mockContext, <fixtureConst>)
    const xml = xmlExport({ <RootTag>: exported }, false)
    expect(importContentFromXML(xml)).toEqual(
      importContentFromXML(readXMLFixtureAsString(import.meta.url, "<fixture>.xml"))
    )
  })
})
```

Правила:
- Контекст — `mockContext`.
- Сравнение всегда через `importContentFromXML` с обеих сторон, не через строки.
- Корневой тег берётся из самого XML-файла — прочитай его.
- Без комментариев в сгенерированном файле.
