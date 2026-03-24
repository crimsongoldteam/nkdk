---
description: Сгенерировать toYAML.test.ts для открытого файла конвертера
---

## Свойство (`PropertyRule`, `exportPropertyToYAML`)

Если тестируется **экспорт свойства** через `exportPropertyToYAML`:

1. В `PropertyRule` обязательно укажи `yaml` (ключ в выходном объекте), например `yaml: "КонтекстноеМеню"`.
2. Используй `testExportPropertyToYAML` из `~/tests/property/exportPropertyToYAML` как **тонкую обёртку** над `exportPropertyToYAML` (контекст `mockContext` уже внутри helper).
3. Добавляй minimal-кейс с `value: undefined` и проверкой `expect(result).toBeUndefined()`.
4. Для заполненного значения проверяй именно объект верхнего уровня с YAML-ключом: `expect(result).toEqual({ <YamlKey>: <fixtureYAML> })`.
5. Рабочий пример: [contextMenu/toYAML.test.ts](../../../../../packages/core/metadata/forms/elements/contextMenu/toYAML.test.ts).

```ts
const rule: PropertyRule = {
  type: "<Type>",
  yaml: "<YamlKey>",
}

describe("export <Type> to YAML", () => {
  it("should export minimal", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should export full to YAML", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: <fixtureModel>,
    })

    expect(result).toEqual({ <YamlKey>: <fixtureModelYAML> })
  })
})
```

---

## Прямой конвертер (`exportFooToYAML` и т.п.)

Если это **не** property-helper, а вызов функции из `toYAML.ts` с `mockContext` и эталоном из `data.ts`:

1. Прочитай открытый `toYAML.ts` — найди имя экспортируемой функции и её сигнатуру.
2. Прочитай `__fixtures__/data.ts` рядом — найди пары констант: модель и YAML-эталон (`*YAML`).
3. Создай тестовый файл рядом с исходником по шаблону:

```ts
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
