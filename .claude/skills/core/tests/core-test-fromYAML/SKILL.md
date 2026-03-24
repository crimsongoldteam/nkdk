---
name: core-test-fromYAML
description: Сгенерировать fromYAML.test.ts для открытого файла конвертера
---

## Свойство (`PropertyRule`, `importPropertyFromYAML`)

Если тестируется **импорт свойства** через `importPropertyFromYAML` (тип в `rule.type`, как для XML):

1. Используй `testImportPropertyFromYAML` из `~/tests/property/importPropertyFromYAML` как **тонкую обёртку** над `importPropertyFromYAML` (контекст `mockContext` уже внутри helper).
2. Передавай `value` напрямую из `__fixtures__/data.ts` (обычно `*YAML`), без чтения YAML-файлов.
3. Если импорт поддерживает merge/defaults, обязательно передавай `sourceValue` (как в `contextMenu`: для full — `fullContextMenuSource`, для minimal — `minimalContextMenu`).
4. Делай минимум 2 сценария, если есть соответствующие фикстуры: `full` и `minimal`.
5. Рабочий пример: [contextMenu/fromYAML.test.ts](../../../../../packages/core/metadata/forms/elements/contextMenu/fromYAML.test.ts).

```ts
const rule: PropertyRule = { type: "<Type>" }

describe("import <Type> from YAML", () => {
  it("should import full from YAML", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: <fixtureModelYAML>,
      sourceValue: <sourceForMerge?>,
    })

    expect(result).toEqual(<fixtureModel>)
  })

  it("should import minimal from YAML", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: <minimalFixtureYAML>,
      sourceValue: <minimalSource?>,
    })

    expect(result).toEqual(<minimalFixtureModel>)
  })
})
```

---

## Прямой конвертер (`importFooFromYAML` и т.п.)

Если это **не** property-helper, а вызов функции из `fromYAML.ts` с `mockContext` и эталоном из `data.ts`:

1. Прочитай открытый `fromYAML.ts` — найди имя экспортируемой функции и её сигнатуру.
2. Прочитай `__fixtures__/data.ts` рядом — найди пары констант: YAML-эталон (`*YAML`) и ожидаемая модель.
3. Создай тестовый файл рядом с исходником по шаблону:

```ts
describe("import <Type> from YAML", () => {
  it("import full from YAML", () => {
    expect(<importFn>(mockContext, <fixtureModelYAML>)).toEqual(<fixtureModel>)
  })
})
```

Правила:

- Контекст — `mockContext`.
- По одному `it()` на каждую пару констант в `data.ts`.
- Если функция принимает `source` (для merge/defaults) — передай соответствующую фикстуру в `sourceValue`.
- Без комментариев в сгенерированном файле.
