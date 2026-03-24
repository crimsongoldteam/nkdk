---
description: Сгенерировать fromYAML.test.ts для открытого файла конвертера
---

1. Прочитай открытый `fromYAML.ts` — найди имя экспортируемой функции и её сигнатуру.
2. Прочитай `__fixtures__/data.ts` рядом — найди пары констант: YAML-эталон (`*YAML`) и ожидаемая модель.
3. Создай тестовый файл рядом с исходником по шаблону:

```ts
import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { <fixtureModel>, <fixtureModelYAML> } from "./__fixtures__/data"
import { <importFn> } from "./fromYAML"

describe("import <Type> from YAML", () => {
  it("import full from YAML", () => {
    expect(<importFn>(mockContext, <fixtureModelYAML>)).toEqual(<fixtureModel>)
  })
})
```

Правила:
- Контекст — `mockContext`.
- По одному `it()` на каждую пару констант в `data.ts`.
- Если функция принимает `source` (для merge/defaults) — передай соответствующую фикстуру.
- Без комментариев в сгенерированном файле.
