# Тесты `fromXML` / `toXML` / `fromYAML` / `toYAML`

Все 4 файла тестов создаются в каталоге нового объекта метаданных:

- `fromXML.test.ts`
- `toXML.test.ts`
- `fromYAML.test.ts`
- `toYAML.test.ts`

## Шаблоны

### `fromXML.test.ts`

```typescript
import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { fixtureMyObject } from "~/metadata/commonObjects/<objectDir>/__fixtures__/data"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"

const rule: PropertyRule = {
  type: "<PropertyType>",
}

describe("import <PropertyType> from XML", () => {
  it("imports full fixture", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "<XmlRootTag>",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(fixtureMyObject)
  })
})
```

### `toXML.test.ts`

```typescript
import { describe, expect, it } from "vitest"
import { fixtureMyObject } from "~/metadata/commonObjects/<objectDir>/__fixtures__/data"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

describe("export<PropertyType>ToXML", () => {
  it("exports full.xml fixture", () => {
    const rule: PropertyRule = {
      type: "<PropertyType>",
    }
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fixtureMyObject,
      xmlRootTag: "<XmlRootTag>",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })
})
```

### `fromYAML.test.ts`

```typescript
import { describe, expect, it } from "vitest"
import { fixtureMyObject, fixtureMyObjectYAML } from "~/metadata/commonObjects/<objectDir>/__fixtures__/data"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"

const rule: PropertyRule = { type: "<PropertyType>" }

describe("import<PropertyType>FromYAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("imports fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: fixtureMyObjectYAML })
    expect(result).toEqual(fixtureMyObject)
  })
})
```

### `toYAML.test.ts`

```typescript
import { describe, expect, it } from "vitest"
import { fixtureMyObject, fixtureMyObjectYAML } from "~/metadata/commonObjects/<objectDir>/__fixtures__/data"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"

const rule: PropertyRule = {
  type: "<PropertyType>",
  yaml: "<YAMLSynonym>",
}

describe("export<PropertyType>ToYAML", () => {
  it("exports undefined", () => {
    const result = testExportPropertyToYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("exports fixture", () => {
    const result = testExportPropertyToYAML({ rule, value: fixtureMyObject })
    expect(result).toEqual({ "<YAMLSynonym>": fixtureMyObjectYAML })
  })
})
```

## Чеклист перед запуском тестов

1. В `__fixtures__/` есть XML-файлы, используемые в `path`
2. В `__fixtures__/data.ts` есть внутренние и YAML-фикстуры
3. `rule.type` совпадает с зарегистрированным `propertyType`
4. `xmlRootTag` совпадает с корневым XML-тегом фикстуры
5. Пути импорта используют алиас `~/...`
