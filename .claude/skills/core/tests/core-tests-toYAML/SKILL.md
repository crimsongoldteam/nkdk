---
name: core-tests-toYAML
description: Сгенерировать toYAML.test.ts — через testExportPropertyToYAML из ~/tests/property; не вызывай exportMetadataItemToYAML в тестах. Прямой exportFooToYAML по шаблону. См. core-tests-general.
---

**Когда открывать:** тест экспорта в YAML. Сначала [core-tests-general](./../core-tests-general/SKILL.md) — в т.ч. раздел про эталоны в `data.ts` (`Required`, `Omit`, YAML и `defaultValueYAML`).

---

## Свойство (`PropertyRule`, `testExportPropertyToYAML`)

Если тестируется **свойство** через `exportPropertyToYAML`:

1. В `PropertyRule` укажи `yaml` (ключ в выходном объекте).
2. Используй `testExportPropertyToYAML` из `~/tests/property/exportPropertyToYAML`.
3. Минимальный кейс: `value: undefined` → `expect(result).toBeUndefined()`.
4. Полный кейс: `expect(result).toEqual({ <YamlKey>: <fixtureYAML> })`.
5. Пример: [contextMenu/toYAML.test.ts](../../../../../packages/core/metadata/forms/elements/contextMenu/toYAML.test.ts).

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

## Прямой конвертер (`exportFooToYAML`)

Если в `toYAML.ts` своя функция с `mockContext` и эталонами в `data.ts` — см. прежний шаблон: `expect(<exportFn>(mockContext, <fixtureModel>)).toEqual(<fixtureModelYAML>)`.

---

## MetadataItemRule (через property, не `exportMetadataItemToYAML`)

Если экспорт идёт через `exportMetadataItemToYAML` в коде, **в тесте** используй **`testExportPropertyToYAML`** с `PropertyRule { type: "<Type>", yaml: "<YamlKey>" }`, зарегистрированным для `exportPropertyToYAML`:

```ts
const rule: PropertyRule = { type: "<Type>", yaml: "<YamlKey>" }

const result = testExportPropertyToYAML({
  rule,
  value: <fixtureModel>,
})

expect(result).toEqual({ <YamlKey>: <fixtureYAML> })
```

**Не** вызывай `exportMetadataItemToYAML` в тестах напрямую ([core-tests-general](../core-tests-general/SKILL.md)). Эталон `*YAML` в `__fixtures__/data.ts`. Парный скилл: [core-test-fromYAML](../core-test-fromYAML/SKILL.md).

Без комментариев в сгенерированном файле.
