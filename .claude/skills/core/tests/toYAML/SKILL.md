---
description: Сгенерировать toYAML.test.ts для открытого файла конвертера
---

1. Прочитай открытый `toYAML.ts` — найди имя экспортируемой функции и её сигнатуру.
2. Прочитай `__fixtures__/data.ts` рядом — найди пары констант: модель и YAML-эталон (`*YAML`).
3. Создай тестовый файл рядом с исходником по шаблону:

```ts
import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { <fixtureModel>, <fixtureModelYAML> } from "./__fixtures__/data"
import { <exportFn> } from "./toYAML"

describe("export <Type> to YAML", () => {
  it("export full to YAML", () => {
    expect(<exportFn>(mockContext, <fixtureModel>)).toEqual(<fixtureModelYAML>)
  })
})
```

Правила:
- Контекст — `mockContext`.
- По одному `it()` на каждую пару констант в `data.ts`.
- Без комментариев в сгенерированном файле.
