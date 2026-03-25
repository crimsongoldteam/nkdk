---
name: core-test-fromYAML
description: Сгенерировать fromYAML.test.ts — через testImportPropertyFromYAML из ~/tests/property; не вызывай importMetadataItemFromYAML в тестах. Прямой importFooFromYAML по шаблону. См. core-tests-general.
---

**Когда открывать:** тест импорта из YAML. Сначала [core-tests-general](./../core-tests-general/SKILL.md) — в т.ч. раздел про эталоны в `data.ts` (`Required`, `Omit`, YAML и `defaultValueYAML`).

---

## Свойство (`PropertyRule`, `testImportPropertyFromYAML`)

Если **импорт свойства** через `importPropertyFromYAML`:

1. `testImportPropertyFromYAML` из `~/tests/property/importPropertyFromYAML`.
2. `value` из `__fixtures__/data.ts` (обычно `*YAML`).
3. При merge/defaults передай `sourceValue` (см. contextMenu).
4. Пример: [contextMenu/fromYAML.test.ts](../../../../../packages/core/metadata/forms/elements/contextMenu/fromYAML.test.ts).

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
})
```

---

## Прямой конвертер (`importFooFromYAML`)

Если своя функция в `fromYAML.ts`: `expect(<importFn>(mockContext, <fixtureYAML>)).toEqual(<fixtureModel>)`.

---

## MetadataItemRule (через property, не `importMetadataItemFromYAML`)

Если в `rules.ts` только `MetadataItemRule`, **в тесте всё равно** используй **`testImportPropertyFromYAML`** с `PropertyRule { type: "<Type>" }`, зарегистрированным в `PropertyTypeRegistry` для `importPropertyFromYAML` (при необходимости сначала добавь `registerTypeRule`).

```ts
const rule: PropertyRule = { type: "<Type>" }

const result = testImportPropertyFromYAML({
  rule,
  value: <fixtureYAML>,
})

expect(result).toEqual(<fixtureModel>)
```

**Не** вызывай `importMetadataItemFromYAML` в тестах напрямую ([core-tests-general](../core-tests-general/SKILL.md)). Парный скилл: [core-tests-toYAML](../core-tests-toYAML/SKILL.md).

Без комментариев в сгенерированном файле.
