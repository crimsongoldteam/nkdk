# TypeDescription YAML Constraints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add strict, rule-driven YAML constraints for `TypeDescription` on catalog attributes, expose those constraints in JSON Schema, and include `x-nkdk-graph.query` hints for project-dependent type families.

**Architecture:** `allowedTypes` lives on `TypeDescription` property rules and uses internal English `TypeDescriptionRules` names. A focused `typeDescription/allowedTypes.ts` helper converts those internal names into Russian YAML JSON Schema branches and reuses the same schema for strict YAML import validation. Catalog attributes get a dedicated collection property type so other owners keep the current broad `TypeDescription` behavior.

**Tech Stack:** TypeScript, TypeBox `TSchema` and `Value.Check`, Vitest, existing metadata orchestration rules, existing graph import and `buildGraph` infrastructure.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/typeDescription/types.ts`
  - Responsibility: export `TypeDescriptionRuleName`, `TypeDescriptionAllowedType`, and `TypeDescriptionAllowedTypes`.
- Create `packages/core/metadata/commonObjects/typeDescription/allowedTypes.ts`
  - Responsibility: convert `allowedTypes` into JSON Schema, define single-only type metadata, graph hints, primitive descriptions, and strict `Value.Check` validation.
- Create `packages/core/metadata/commonObjects/typeDescription/toJSONSchema.test.ts`
  - Responsibility: test strict schema generation, graph hints, primitive descriptions, and the broad fallback when `allowedTypes` is absent.
- Modify `packages/core/metadata/commonObjects/typeDescription/toJSONSchema.ts`
  - Responsibility: delegate to the new helper when `rule.allowedTypes` exists.
- Modify `packages/core/metadata/commonObjects/typeDescription/fromYAML.ts`
  - Responsibility: validate YAML against `allowedTypes` before conversion and import short external data source type forms.
- Modify `packages/core/metadata/commonObjects/typeDescription/toYAML.ts`
  - Responsibility: export external data source table and cube dimension table types back to the short YAML form.
- Modify `packages/core/metadata/commonObjects/typeDescription/fromYAML.test.ts`
  - Responsibility: cover strict import rejection and external data source imports.
- Modify `packages/core/metadata/commonObjects/typeDescription/toYAML.test.ts`
  - Responsibility: cover external data source YAML export.
- Modify `packages/core/metadata/orchestration/property/types.ts`
  - Responsibility: add `allowedTypes?: TypeDescriptionAllowedTypes` to `TypeDescriptionPropertyRule`.
- Modify `packages/core/metadata/orchestration/property/registry.ts`
  - Responsibility: register the new `MetadataCatalogAttributes` property type.
- Modify `packages/core/metadata/commonObjects/metadataAttribute/types.ts`
  - Responsibility: add catalog-attribute type aliases that reuse the existing metadata attribute shape.
- Modify `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
  - Responsibility: add `MetadataCatalogAttributeRules` with a restricted `type` property.
- Modify `packages/core/metadata/commonObjects/metadataAttribute/register.ts`
  - Responsibility: register `MetadataCatalogAttributes` using `MetadataCatalogAttributeRules` and pass the effective item rule into short YAML import.
- Modify `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts`
  - Responsibility: switch catalog `attributes` from `MetadataAttributes` to `MetadataCatalogAttributes`.
- Modify `packages/core/metadata/validation/projectFileSchema.test.ts`
  - Responsibility: validate catalog schema behavior end-to-end and assert documents remain broad.
- Modify `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts`
  - Responsibility: register owning edge kinds for external data source nested type targets.
- Modify `packages/core/metadata/commonObjects/metadataExternalDataSourceTable/types.ts`
  - Responsibility: declare graph child nodes for external data source tables.
- Modify `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/types.ts`
  - Responsibility: declare graph child nodes for external data source cubes.
- Modify `packages/core/metadata/commonObjects/metadataExternalDataSourceDimensionTable/types.ts`
  - Responsibility: declare graph child nodes for cube dimension tables.
- Modify `packages/core/metadata/graphImport/registerTopLevelGraphImports.ts`
  - Responsibility: include top-level graph imports used by `x-nkdk-graph.query` hints.
- Modify `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`
  - Responsibility: prove the graph contains nodes that match the new graph hints.

## Task 1: Type Surface For Allowed Types

**Files:**
- Modify: `packages/core/metadata/commonObjects/typeDescription/types.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Test: `packages/core/metadata/commonObjects/typeDescription/toJSONSchema.test.ts`

- [ ] **Step 1: Write the failing type-level schema test**

Create `packages/core/metadata/commonObjects/typeDescription/toJSONSchema.test.ts`:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { exportTypeDescriptionToJSONSchema } from "./toJSONSchema"

const unrestrictedRule = { type: "TypeDescription" } as const

const restrictedRule = {
  type: "TypeDescription",
  allowedTypes: [
    "string",
    "decimal",
    "date",
    "boolean",
    "ValueStorage",
    "UUID",
    "CatalogRef",
    "CatalogRef.*",
    "DefinedType.*",
  ],
} as const

describe("exportTypeDescriptionToJSONSchema", () => {
  it("keeps broad schema when allowedTypes is absent", () => {
    const schema = exportTypeDescriptionToJSONSchema({
      context: mockContext,
      rule: unrestrictedRule,
      value: undefined,
    })

    expect(schema).toMatchObject({
      anyOf: [
        { type: "string" },
        { type: "array", items: { type: "string" } },
        { type: "object" },
      ],
    })
  })

  it("exports strict primitive descriptions and examples", () => {
    const schema = exportTypeDescriptionToJSONSchema({
      context: mockContext,
      rule: restrictedRule,
      value: undefined,
    })

    const text = JSON.stringify(schema)
    expect(text).toContain("Число(длина, точность)")
    expect(text).toContain("ФиксированнаяСтрока(10)")
    expect(text).toContain("ПоложительноеЧисло(10, 2)")
  })

  it("exports x-nkdk-graph query for concrete catalog references", () => {
    const schema = exportTypeDescriptionToJSONSchema({
      context: mockContext,
      rule: restrictedRule,
      value: undefined,
    }) as {
      anyOf: Array<{ anyOf?: Array<Record<string, unknown>> }>
    }

    const single = schema.anyOf[0]!.anyOf!
    const catalogRef = single.find((item) => item.pattern === "^Справочник\\.[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$")

    expect(catalogRef).toMatchObject({
      "x-nkdk-graph": {
        query: "MATCH (n:MetadataObject {kind: 'MetadataCatalog'}) RETURN n.name ORDER BY n.name",
      },
    })
  })

  it("rejects single-only types inside composite arrays", () => {
    const schema = TypeCompiler.Compile(
      exportTypeDescriptionToJSONSchema({
        context: mockContext,
        rule: restrictedRule,
        value: undefined,
      }),
    )

    expect(schema.Check(["Строка", "Справочник.Контрагенты"])).toBe(true)
    expect(schema.Check(["Строка", "ХранилищеЗначения"])).toBe(false)
    expect(schema.Check(["Строка", "ОпределяемыйТип.ДенежнаяСумма"])).toBe(false)
  })

  it("rejects type id object when allowedTypes is set", () => {
    const schema = TypeCompiler.Compile(
      exportTypeDescriptionToJSONSchema({
        context: mockContext,
        rule: restrictedRule,
        value: undefined,
      }),
    )

    expect(schema.Check({ ИдентификаторТипа: ["8c1e3694-da12-44d5-8b1f-d134b89a1282"] })).toBe(false)
  })
})
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/toJSONSchema.test.ts
```

Expected: FAIL because `allowedTypes` is not part of `TypeDescriptionPropertyRule` and strict schema generation is not implemented.

- [ ] **Step 3: Add allowed type aliases**

Modify `packages/core/metadata/commonObjects/typeDescription/types.ts` immediately after `TypeDescriptionRules`:

```ts
export type TypeDescriptionRuleName = keyof typeof TypeDescriptionRules
export type TypeDescriptionAllowedType = TypeDescriptionRuleName | `${TypeDescriptionRuleName}.*`
export type TypeDescriptionAllowedTypes = readonly TypeDescriptionAllowedType[]
```

- [ ] **Step 4: Add allowedTypes to the property rule**

Modify `packages/core/metadata/orchestration/property/types.ts`.

Add the import near the other `commonObjects` type imports:

```ts
import type { TypeDescriptionAllowedTypes } from "~/metadata/commonObjects/typeDescription/types"
```

Then update `TypeDescriptionPropertyRule`:

```ts
export interface TypeDescriptionPropertyRule extends BasePropertyRule {
  type: "TypeDescription"
  addTypeDescriptionAttributeToXML?: true
  declareTypeNamespaceXML?: boolean
  allowedTypes?: TypeDescriptionAllowedTypes
}
```

- [ ] **Step 5: Run the test again**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/toJSONSchema.test.ts
```

Expected: FAIL because `exportTypeDescriptionToJSONSchema` still returns the broad `TypeDescriptionJSONSchema`.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/typeDescription/types.ts packages/core/metadata/orchestration/property/types.ts packages/core/metadata/commonObjects/typeDescription/toJSONSchema.test.ts
git commit -m "feat: add TypeDescription allowedTypes contract"
```

## Task 2: JSON Schema Builder For Allowed Types

**Files:**
- Create: `packages/core/metadata/commonObjects/typeDescription/allowedTypes.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/toJSONSchema.ts`
- Test: `packages/core/metadata/commonObjects/typeDescription/toJSONSchema.test.ts`

- [ ] **Step 1: Create the allowedTypes helper**

Create `packages/core/metadata/commonObjects/typeDescription/allowedTypes.ts`:

```ts
import { Type, type TSchema } from "@sinclair/typebox"
import { Value } from "@sinclair/typebox/value"
import type {
  TypeDescriptionAllowedType,
  TypeDescriptionAllowedTypes,
  TypeDescriptionRuleName,
} from "./types"

export const METADATA_NAME_YAML_PATTERN = "[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*"

type JsonSchema = Record<string, unknown>

interface TypeDescriptionSchemaVariant {
  schema: JsonSchema
  singleOnly?: true
}

const stringSchema = (schema: JsonSchema): JsonSchema => ({
  type: "string",
  ...schema,
})

const graphHint = (query: string): JsonSchema => ({
  "x-nkdk-graph": { query },
})

const primitiveVariants: Partial<Record<TypeDescriptionRuleName, TypeDescriptionSchemaVariant[]>> = {
  string: [
    {
      schema: stringSchema({
        pattern: "^Строка(?:\\([1-9][0-9]*\\))?$",
        description: "Строка или Строка(длина). Длина — максимальное количество символов.",
        examples: ["Строка", "Строка(10)"],
      }),
    },
    {
      schema: stringSchema({
        pattern: "^ФиксированнаяСтрока\\([1-9][0-9]*\\)$",
        description: "ФиксированнаяСтрока(длина). Длина — точное количество символов.",
        examples: ["ФиксированнаяСтрока(10)"],
      }),
    },
  ],
  decimal: [
    {
      schema: stringSchema({
        pattern: "^Число(?:\\([1-9][0-9]*(?:\\s*,\\s*[0-9]+)?\\))?$",
        description:
          "Число, Число(длина) или Число(длина, точность). Длина — общее количество цифр, точность — количество дробных цифр.",
        examples: ["Число", "Число(10)", "Число(10, 2)"],
      }),
    },
    {
      schema: stringSchema({
        pattern: "^ПоложительноеЧисло(?:\\([1-9][0-9]*(?:\\s*,\\s*[0-9]+)?\\))?$",
        description:
          "ПоложительноеЧисло, ПоложительноеЧисло(длина) или ПоложительноеЧисло(длина, точность). Длина — общее количество цифр, точность — количество дробных цифр.",
        examples: ["ПоложительноеЧисло", "ПоложительноеЧисло(10)", "ПоложительноеЧисло(10, 2)"],
      }),
    },
  ],
  date: [{ schema: stringSchema({ enum: ["Дата", "Время", "ДатаВремя"] }) }],
  boolean: [{ schema: stringSchema({ const: "Булево" }) }],
  ValueStorage: [{ schema: stringSchema({ const: "ХранилищеЗначения" }), singleOnly: true }],
  UUID: [{ schema: stringSchema({ const: "УникальныйИдентификатор" }), singleOnly: true }],
  AnyIBRef: [{ schema: stringSchema({ const: "ЛюбаяСсылка" }) }],
}

const concreteTypeQueries: Partial<Record<TypeDescriptionRuleName, string>> = {
  CatalogRef: "MATCH (n:MetadataObject {kind: 'MetadataCatalog'}) RETURN n.name ORDER BY n.name",
  DocumentRef: "MATCH (n:MetadataObject {kind: 'MetadataDocument'}) RETURN n.name ORDER BY n.name",
  EnumRef: "MATCH (n:MetadataObject {kind: 'MetadataEnumeration'}) RETURN n.name ORDER BY n.name",
  ChartOfCharacteristicTypesRef:
    "MATCH (n:MetadataObject {kind: 'MetadataChartOfCharacteristicTypes'}) RETURN n.name ORDER BY n.name",
  ChartOfAccountsRef: "MATCH (n:MetadataObject {kind: 'MetadataChartOfAccounts'}) RETURN n.name ORDER BY n.name",
  ChartOfCalculationTypesRef:
    "MATCH (n:MetadataObject {kind: 'MetadataChartOfCalculationTypes'}) RETURN n.name ORDER BY n.name",
  BusinessProcessRef: "MATCH (n:MetadataObject {kind: 'MetadataBusinessProcess'}) RETURN n.name ORDER BY n.name",
  BusinessProcessRoutePointRef:
    "MATCH (n:MetadataObject {kind: 'MetadataBusinessProcess'}) RETURN n.name ORDER BY n.name",
  TaskRef: "MATCH (n:MetadataObject {kind: 'MetadataTask'}) RETURN n.name ORDER BY n.name",
  ExchangePlanRef: "MATCH (n:MetadataObject {kind: 'MetadataExchangePlan'}) RETURN n.name ORDER BY n.name",
  DefinedType: "MATCH (n:MetadataObject {kind: 'MetadataDefinedType'}) RETURN n.name ORDER BY n.name",
  Characteristic:
    "MATCH (n:MetadataObject {kind: 'MetadataChartOfCharacteristicTypes'}) RETURN n.name ORDER BY n.name",
  ExternalDataSourceTableRef:
    "MATCH (s:MetadataObject {kind: 'MetadataExternalDataSource'})-[:EXTERNAL_DATA_SOURCE_TABLE]->(t:MetadataExternalDataSourceTable) RETURN s.name, t.name ORDER BY s.name, t.name",
  ExternalDataSourceCubeDimensionTableRef:
    "MATCH (s:MetadataObject {kind: 'MetadataExternalDataSource'})-[:EXTERNAL_DATA_SOURCE_CUBE]->(c:MetadataExternalDataSourceCube)-[:EXTERNAL_DATA_SOURCE_DIMENSION_TABLE]->(t:MetadataExternalDataSourceDimensionTable) RETURN s.name, c.name, t.name ORDER BY s.name, c.name, t.name",
}

const exactEnterpriseNameByType: Partial<Record<TypeDescriptionRuleName, string>> = {
  CatalogRef: "Справочник",
  DocumentRef: "Документ",
  EnumRef: "Перечисление",
  ChartOfCharacteristicTypesRef: "ПланВидовХарактеристик",
  ChartOfAccountsRef: "ПланСчетов",
  ChartOfCalculationTypesRef: "ПланВидовРасчета",
  BusinessProcessRef: "БизнесПроцесс",
  BusinessProcessRoutePointRef: "ТочкаМаршрутаБизнесПроцесса",
  TaskRef: "Задача",
  ExchangePlanRef: "ПланОбмена",
}

const concreteEnterpriseNameByType: Partial<Record<TypeDescriptionRuleName, string>> = {
  ...exactEnterpriseNameByType,
  DefinedType: "ОпределяемыйТип",
  Characteristic: "Характеристика",
}

const singleOnlyConcreteTypes = new Set<TypeDescriptionRuleName>([
  "DefinedType",
  "Characteristic",
  "ExternalDataSourceTableRef",
  "ExternalDataSourceCubeDimensionTableRef",
])

const externalTablePattern = `^ВнешнийИсточникДанных${METADATA_NAME_YAML_PATTERN}\\.Таблица${METADATA_NAME_YAML_PATTERN}$`
const externalCubeDimensionTablePattern =
  `^ВнешнийИсточникДанных${METADATA_NAME_YAML_PATTERN}\\.Куб${METADATA_NAME_YAML_PATTERN}` +
  `\\.ТаблицаИзмерения${METADATA_NAME_YAML_PATTERN}$`

function splitAllowedType(allowedType: TypeDescriptionAllowedType): {
  type: TypeDescriptionRuleName
  concrete: boolean
} {
  if (allowedType.endsWith(".*")) {
    return {
      type: allowedType.slice(0, -2) as TypeDescriptionRuleName,
      concrete: true,
    }
  }

  return {
    type: allowedType as TypeDescriptionRuleName,
    concrete: false,
  }
}

function concreteVariant(type: TypeDescriptionRuleName): TypeDescriptionSchemaVariant | undefined {
  if (type === "ExternalDataSourceTableRef") {
    return {
      schema: stringSchema({
        pattern: externalTablePattern,
        ...graphHint(concreteTypeQueries.ExternalDataSourceTableRef!),
      }),
      singleOnly: true,
    }
  }

  if (type === "ExternalDataSourceCubeDimensionTableRef") {
    return {
      schema: stringSchema({
        pattern: externalCubeDimensionTablePattern,
        ...graphHint(concreteTypeQueries.ExternalDataSourceCubeDimensionTableRef!),
      }),
      singleOnly: true,
    }
  }

  const enterprise = concreteEnterpriseNameByType[type]
  if (enterprise === undefined) return undefined

  return {
    schema: stringSchema({
      pattern: `^${enterprise}\\.${METADATA_NAME_YAML_PATTERN}$`,
      ...(concreteTypeQueries[type] !== undefined ? graphHint(concreteTypeQueries[type]!) : {}),
    }),
    singleOnly: singleOnlyConcreteTypes.has(type) ? true : undefined,
  }
}

function exactVariant(type: TypeDescriptionRuleName): TypeDescriptionSchemaVariant | undefined {
  const primitive = primitiveVariants[type]
  if (primitive !== undefined) return undefined

  const enterprise = exactEnterpriseNameByType[type]
  if (enterprise === undefined) return undefined

  return {
    schema: stringSchema({ const: enterprise }),
  }
}

function variantsForAllowedType(allowedType: TypeDescriptionAllowedType): TypeDescriptionSchemaVariant[] {
  const { type, concrete } = splitAllowedType(allowedType)

  if (!concrete) {
    const primitive = primitiveVariants[type]
    if (primitive !== undefined) return primitive
    const exact = exactVariant(type)
    return exact ? [exact] : []
  }

  const concreteSchema = concreteVariant(type)
  return concreteSchema ? [concreteSchema] : []
}

function anyOfSchema(variants: readonly JsonSchema[], description?: string): JsonSchema {
  if (variants.length === 1) return variants[0]!
  return {
    ...(description !== undefined ? { description } : {}),
    anyOf: variants,
  }
}

export function buildTypeDescriptionJSONSchema(allowedTypes: TypeDescriptionAllowedTypes): TSchema {
  const variants = allowedTypes.flatMap(variantsForAllowedType)
  const singleVariants = variants.map((variant) => variant.schema)
  const compositeVariants = variants
    .filter((variant) => variant.singleOnly !== true)
    .map((variant) => variant.schema)

  const branches: JsonSchema[] = [anyOfSchema(singleVariants, "Одиночный тип")]
  if (compositeVariants.length > 0) {
    branches.push({
      description: "Составной тип",
      type: "array",
      minItems: 1,
      uniqueItems: true,
      items: anyOfSchema(compositeVariants),
    })
  }

  return Type.Unsafe<TSchema>(anyOfSchema(branches))
}

export function assertTypeDescriptionYAMLAllowed(params: {
  value: unknown
  allowedTypes: TypeDescriptionAllowedTypes
}): void {
  const schema = buildTypeDescriptionJSONSchema(params.allowedTypes)
  if (!Value.Check(schema, params.value)) {
    throw new Error("TypeDescription YAML value is not allowed by rule.allowedTypes")
  }
}
```

- [ ] **Step 2: Wire the schema exporter**

Replace `packages/core/metadata/commonObjects/typeDescription/toJSONSchema.ts` with:

```ts
import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { TypeDescriptionJSONSchema } from "./types"
import { buildTypeDescriptionJSONSchema } from "./allowedTypes"

export const exportTypeDescriptionToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  if (rule.type === "TypeDescription" && rule.allowedTypes !== undefined) {
    return buildTypeDescriptionJSONSchema(rule.allowedTypes)
  }

  return TypeDescriptionJSONSchema
}

registerTypeRule("TypeDescription", "exportToJSONSchema", exportTypeDescriptionToJSONSchema)
```

- [ ] **Step 3: Run the schema tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/toJSONSchema.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run type-check for the touched core types**

Run:

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/typeDescription/allowedTypes.ts packages/core/metadata/commonObjects/typeDescription/toJSONSchema.ts packages/core/metadata/commonObjects/typeDescription/toJSONSchema.test.ts
git commit -m "feat: generate constrained TypeDescription schema"
```

## Task 3: Strict YAML Import With Allowed Types

**Files:**
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromYAML.test.ts`

- [ ] **Step 1: Add failing strict import tests**

Append to `packages/core/metadata/commonObjects/typeDescription/fromYAML.test.ts`:

```ts
const restrictedCatalogAttributeRule = {
  type: "TypeDescription",
  allowedTypes: [
    "string",
    "decimal",
    "date",
    "boolean",
    "ValueStorage",
    "UUID",
    "CatalogRef",
    "CatalogRef.*",
    "DefinedType.*",
  ],
} as const

describe("importTypeDescriptionFromYAML with allowedTypes", () => {
  it("imports allowed primitive and catalog reference values", () => {
    expect(
      importTypeDescriptionFromYAML(mockContext, restrictedCatalogAttributeRule, [
        "Строка(10)",
        "Справочник",
        "Справочник.Контрагенты",
      ]),
    ).toEqual({
      type: ["string", "CatalogRef", "CatalogRef.Контрагенты"],
      stringQualifiers: { length: 10, allowedLength: "Variable" },
    })
  })

  it("rejects unknown type strings", () => {
    expect(() =>
      importTypeDescriptionFromYAML(mockContext, restrictedCatalogAttributeRule, "НесуществующийТип"),
    ).toThrow("TypeDescription YAML value is not allowed by rule.allowedTypes")
  })

  it("rejects single-only values inside composite arrays", () => {
    expect(() =>
      importTypeDescriptionFromYAML(mockContext, restrictedCatalogAttributeRule, [
        "Строка",
        "ХранилищеЗначения",
      ]),
    ).toThrow("TypeDescription YAML value is not allowed by rule.allowedTypes")
  })

  it("rejects type id object when allowedTypes is set", () => {
    expect(() =>
      importTypeDescriptionFromYAML(mockContext, restrictedCatalogAttributeRule, {
        ИдентификаторТипа: ["8c1e3694-da12-44d5-8b1f-d134b89a1282"],
      }),
    ).toThrow("TypeDescription YAML value is not allowed by rule.allowedTypes")
  })

  it("rejects invalid primitive parameter syntax", () => {
    expect(() =>
      importTypeDescriptionFromYAML(mockContext, restrictedCatalogAttributeRule, "Число(abc, 2)"),
    ).toThrow("TypeDescription YAML value is not allowed by rule.allowedTypes")
  })
})
```

- [ ] **Step 2: Run the strict import tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/fromYAML.test.ts
```

Expected: FAIL because `fromYAML.ts` does not validate `rule.allowedTypes`.

- [ ] **Step 3: Validate against allowedTypes before parsing**

Modify `packages/core/metadata/commonObjects/typeDescription/fromYAML.ts`.

Replace the wrong `PropertyRule` import:

```ts
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
```

with:

```ts
import type { PropertyRule } from "~/metadata/orchestration/property/types"
```

Add the helper import:

```ts
import { assertTypeDescriptionYAMLAllowed } from "./allowedTypes"
```

Add this block immediately after the `value === undefined` guard:

```ts
  if (rule?.type === "TypeDescription" && rule.allowedTypes !== undefined) {
    assertTypeDescriptionYAMLAllowed({ value, allowedTypes: rule.allowedTypes })
  }
```

Rename the second parameter from `_rule` to `rule`:

```ts
export const importTypeDescriptionFromYAML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: TypeDescriptionYAML | undefined
): TypeDescription | undefined => {
```

- [ ] **Step 4: Run the strict import tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/fromYAML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run schema tests to ensure import and schema stay aligned**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/toJSONSchema.test.ts metadata/commonObjects/typeDescription/fromYAML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/typeDescription/fromYAML.ts packages/core/metadata/commonObjects/typeDescription/fromYAML.test.ts
git commit -m "feat: validate TypeDescription YAML by allowedTypes"
```

## Task 4: External Data Source Short YAML Forms

**Files:**
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/toYAML.test.ts`

- [ ] **Step 1: Add failing import tests for external data source forms**

Append to `packages/core/metadata/commonObjects/typeDescription/fromYAML.test.ts`:

```ts
const externalDataSourceRule = {
  type: "TypeDescription",
  allowedTypes: [
    "ExternalDataSourceTableRef.*",
    "ExternalDataSourceCubeDimensionTableRef.*",
  ],
} as const

describe("external data source TypeDescription YAML import", () => {
  it("imports external data source table short form", () => {
    expect(
      importTypeDescriptionFromYAML(
        mockContext,
        externalDataSourceRule,
        "ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства",
      ),
    ).toEqual({
      type: ["ExternalDataSourceTableRef.ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства"],
    })
  })

  it("imports external data source cube dimension table short form", () => {
    expect(
      importTypeDescriptionFromYAML(
        mockContext,
        externalDataSourceRule,
        "ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства",
      ),
    ).toEqual({
      type: [
        "ExternalDataSourceCubeDimensionTableRef.ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства",
      ],
    })
  })
})
```

- [ ] **Step 2: Add failing export tests for external data source forms**

Append to `packages/core/metadata/commonObjects/typeDescription/toYAML.test.ts`:

```ts
describe("external data source TypeDescription YAML export", () => {
  it("exports external data source table short form", () => {
    expect(
      exportTypeDescriptionToYAML(mockContext, mockRule, {
        type: ["ExternalDataSourceTableRef.ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства"],
      }),
    ).toBe("ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства")
  })

  it("exports external data source cube dimension table short form", () => {
    expect(
      exportTypeDescriptionToYAML(mockContext, mockRule, {
        type: [
          "ExternalDataSourceCubeDimensionTableRef.ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства",
        ],
      }),
    ).toBe("ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства")
  })
})
```

If `toYAML.test.ts` does not already import `mockContext` and `mockRule`, add:

```ts
import { mockContext, mockRule } from "~/tests/mockContext"
```

- [ ] **Step 3: Run the external form tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/fromYAML.test.ts metadata/commonObjects/typeDescription/toYAML.test.ts
```

Expected: FAIL because external short forms are still kept as raw unknown strings or exported with the enterprise base prefix.

- [ ] **Step 4: Add external parsing to fromYAML**

In `packages/core/metadata/commonObjects/typeDescription/fromYAML.ts`, add these helpers above `getStringQualifiers`:

```ts
const metadataName = "[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*"
const externalDataSourceTablePattern = new RegExp(`^ВнешнийИсточникДанных${metadataName}\\.Таблица${metadataName}$`)
const externalDataSourceCubeDimensionTablePattern = new RegExp(
  `^ВнешнийИсточникДанных${metadataName}\\.Куб${metadataName}\\.ТаблицаИзмерения${metadataName}$`,
)

const getExternalDataSourceTypeFromYAML = (type: string): string | undefined => {
  if (externalDataSourceTablePattern.test(type)) {
    return `ExternalDataSourceTableRef.${type}`
  }

  if (externalDataSourceCubeDimensionTablePattern.test(type)) {
    return `ExternalDataSourceCubeDimensionTableRef.${type}`
  }

  return undefined
}
```

Then add this block before `const systemEnumerationType = getSystemEnumerationTypeFromYAML(type)`:

```ts
    const externalDataSourceType = getExternalDataSourceTypeFromYAML(type)
    if (externalDataSourceType !== undefined) {
      types.push(externalDataSourceType)
      continue
    }
```

- [ ] **Step 5: Add external short export to toYAML**

In `packages/core/metadata/commonObjects/typeDescription/toYAML.ts`, add this block immediately after `const rule = getTypeDescriptionRule(baseType)` and before the `if (!rule)` block:

```ts
  if (
    detailType !== undefined &&
    (baseType === "ExternalDataSourceTableRef" || baseType === "ExternalDataSourceCubeDimensionTableRef")
  ) {
    return detailType
  }
```

- [ ] **Step 6: Run the external form tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/fromYAML.test.ts metadata/commonObjects/typeDescription/toYAML.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/commonObjects/typeDescription/fromYAML.ts packages/core/metadata/commonObjects/typeDescription/toYAML.ts packages/core/metadata/commonObjects/typeDescription/fromYAML.test.ts packages/core/metadata/commonObjects/typeDescription/toYAML.test.ts
git commit -m "feat: support external data source TypeDescription YAML"
```

## Task 5: Catalog Attribute Rules And Collection Registration

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/register.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts`
- Test: `packages/core/metadata/validation/projectFileSchema.test.ts`

- [ ] **Step 1: Add failing catalog schema validation tests**

Modify imports in `packages/core/metadata/validation/projectFileSchema.test.ts`:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { validateFile } from "./validateFile"
```

Append these tests:

```ts
  it("validates catalog attribute TypeDescription with catalog-specific restrictions", () => {
    const schema = TypeCompiler.Compile(
      exportJSONSchemaForProjectFile({
        context,
        filePath: "Справочник/Товары/Свойства.yaml",
      }),
    )

    expect(
      validateFile({
        filePath: "Справочник/Товары/Свойства.yaml",
        schema,
        text: [
          "Реквизиты:",
          "  Контрагент:",
          "    Тип:",
          "      - Справочник",
          "      - Справочник.Контрагенты",
        ].join("\n"),
      }),
    ).toEqual([])

    expect(
      validateFile({
        filePath: "Справочник/Товары/Свойства.yaml",
        schema,
        text: ["Реквизиты:", "  Неверный:", "    Тип: НесуществующийТип"].join("\n"),
      }),
    ).not.toEqual([])

    expect(
      validateFile({
        filePath: "Справочник/Товары/Свойства.yaml",
        schema,
        text: ["Реквизиты:", "  Таблица:", "    Тип:", "      - Строка", "      - ХранилищеЗначения"].join("\n"),
      }),
    ).not.toEqual([])
  })

  it("keeps document attribute TypeDescription broad in the first version", () => {
    const schema = TypeCompiler.Compile(
      exportJSONSchemaForProjectFile({
        context,
        filePath: "Документ/Заказ/Свойства.yaml",
      }),
    )

    expect(
      validateFile({
        filePath: "Документ/Заказ/Свойства.yaml",
        schema,
        text: ["Реквизиты:", "  ПокаШирокий:", "    Тип: НесуществующийТип"].join("\n"),
      }),
    ).toEqual([])
  })
```

- [ ] **Step 2: Run catalog schema tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectFileSchema.test.ts
```

Expected: FAIL because catalog attributes still use the broad `MetadataAttributes` collection.

- [ ] **Step 3: Add catalog attribute type aliases**

Append to `packages/core/metadata/commonObjects/metadataAttribute/types.ts` after `MetadataDocumentAttributesYAML`:

```ts
export type MetadataCatalogAttribute = MetadataAttribute
export type MetadataCatalogAttributes = MetadataAttributes
export type MetadataCatalogAttributesXML = MetadataAttributesXML
export type MetadataCatalogAttributesYAML = MetadataAttributesYAML
```

- [ ] **Step 4: Register MetadataCatalogAttributes in the property registry**

In `packages/core/metadata/orchestration/property/registry.ts`, extend the existing metadata attribute imports from `metadataAttribute/types` with:

```ts
  MetadataCatalogAttributes,
  MetadataCatalogAttributesYAML,
```

Add to `PropertyTypeRegistry` near `MetadataAttributes`:

```ts
  MetadataCatalogAttributes: {
    item: MetadataCatalogAttributes
    yaml: MetadataCatalogAttributesYAML
  }
```

Add to `PropertyRuleTypeKeys` near `MetadataAttributes`:

```ts
  MetadataCatalogAttributes: "MetadataCatalogAttributes",
```

- [ ] **Step 5: Add MetadataCatalogAttributeRules**

Modify `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`.

Add this constant before `export const MetadataAttributeRules`:

```ts
export const CATALOG_ATTRIBUTE_ALLOWED_TYPES = [
  "string",
  "decimal",
  "date",
  "boolean",
  "ValueStorage",
  "UUID",
  "CatalogRef",
  "CatalogRef.*",
  "DocumentRef",
  "DocumentRef.*",
  "EnumRef",
  "EnumRef.*",
  "ChartOfCharacteristicTypesRef",
  "ChartOfCharacteristicTypesRef.*",
  "ChartOfAccountsRef",
  "ChartOfAccountsRef.*",
  "ChartOfCalculationTypesRef",
  "ChartOfCalculationTypesRef.*",
  "BusinessProcessRef",
  "BusinessProcessRef.*",
  "BusinessProcessRoutePointRef",
  "BusinessProcessRoutePointRef.*",
  "TaskRef",
  "TaskRef.*",
  "ExchangePlanRef",
  "ExchangePlanRef.*",
  "AnyIBRef",
  "DefinedType.*",
  "Characteristic.*",
  "ExternalDataSourceTableRef.*",
  "ExternalDataSourceCubeDimensionTableRef.*",
] as const
```

Add this rule after `MetadataAttributeRules`:

```ts
export const MetadataCatalogAttributeRules = {
  itemType: "MetadataAttribute",
  properties: {
    ...commonAttributeProperties,
    type: {
      ...commonAttributeProperties.type,
      allowedTypes: CATALOG_ATTRIBUTE_ALLOWED_TYPES,
    },
    ...fillProperties,
    use: {
      yaml: "Использование",
      xml: "Use",
      type: "SystemEnumeration",
      typeSE: "AttributeUse",
      defaultValueXML: "ForItem",
      implicitValueYAML: "ForItem",
      preserveFromReferenceXML: true,
      xmlParents: ["Properties"],
      order: 26,
    },
    binaryDataStorageLocationUse: {
      yaml: "ИспользованиеХраненияВХранилищеДвоичныхДанных",
      xml: "BinaryDataStorageLocationUse",
      type: "SystemEnumeration",
      typeSE: "BinaryDataStorageLocationUse",
      xmlParents: ["Properties"],
      order: 30,
    },
    ...binaryDataStorageLocationUseFieldProperty,
  },
} as const satisfies MetadataItemRule
```

- [ ] **Step 6: Register the catalog collection with the catalog item rule**

Modify `packages/core/metadata/commonObjects/metadataAttribute/register.ts`.

Update imports from `./rules`:

```ts
import {
  MetadataAttributeRules,
  MetadataCatalogAttributeRules,
  MetadataDocumentAttributeRules,
  MetadataTabularSectionAttributeRules,
} from "./rules"
```

Update the `importMetadataAttributeFromYAML` signature:

```ts
const importMetadataAttributeFromYAML = (
  context: ConfigurationContext,
  itemRule: typeof MetadataAttributeRules,
  yaml: MetadataAttributeYAML | TypeDescriptionYAML,
  name: string,
) => {
```

Inside the short YAML branch, pass the effective type rule:

```ts
    const typeRule = itemRule.properties.type
    const type = importTypeDescriptionFromYAML(context, typeRule, yaml)
```

Inside the object YAML branch, pass `itemRule`:

```ts
    rule: itemRule,
```

Set `itemType` from the effective rule:

```ts
      itemType: itemRule.itemType,
```

Replace `importMetadataAttributesFromYAML` with a factory:

```ts
const createImportMetadataAttributesFromYAML =
  (itemRule: typeof MetadataAttributeRules) =>
  (
    context: ConfigurationContext,
    _rule: PropertyRule | undefined,
    data: MetadataAttributesYAML | undefined,
  ): MetadataAttributes | undefined => {
    if (!data) return undefined

    const results = Object.entries(data).map(([name, value]) => {
      return importMetadataAttributeFromYAML(context, itemRule, value as MetadataAttributeYAML, name)
    })

    return results.length > 0 ? (results as MetadataAttributes) : undefined
  }
```

Register the catalog collection before the generic `MetadataAttributes` registration:

```ts
registerMetadataItemCollectionRule({
  propertyType: "MetadataCatalogAttributes",
  itemRule: MetadataCatalogAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  fromYAML: createImportMetadataAttributesFromYAML(MetadataCatalogAttributeRules),
  graphChild: { idFrom: "name", edgeKind: "ATTRIBUTE", edgeYaml: "Реквизит", nodeSegment: "Реквизит" },
})
```

Update the three existing registrations to use the factory:

```ts
fromYAML: createImportMetadataAttributesFromYAML(MetadataAttributeRules),
```

```ts
fromYAML: createImportMetadataAttributesFromYAML(MetadataTabularSectionAttributeRules),
```

```ts
fromYAML: createImportMetadataAttributesFromYAML(MetadataDocumentAttributeRules),
```

- [ ] **Step 7: Switch catalog rules to the catalog collection**

Modify `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts`:

```ts
    attributes: {
      yaml: "Реквизиты",
      type: "MetadataCatalogAttributes",
      xmlParents: ["ChildObjects"],
      xml: "Attribute",
    },
```

- [ ] **Step 8: Run catalog schema tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectFileSchema.test.ts
```

Expected: PASS.

- [ ] **Step 9: Run metadata attribute and catalog tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/toJSONSchema.test.ts metadata/commonObjects/typeDescription/fromYAML.test.ts metadata/appliedObjects/metadataCatalog/fromYAML.test.ts metadata/appliedObjects/metadataCatalog/toYAML.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataAttribute/types.ts packages/core/metadata/commonObjects/metadataAttribute/rules.ts packages/core/metadata/commonObjects/metadataAttribute/register.ts packages/core/metadata/orchestration/property/registry.ts packages/core/metadata/appliedObjects/metadataCatalog/rules.ts packages/core/metadata/validation/projectFileSchema.test.ts
git commit -m "feat: constrain catalog attribute TypeDescription"
```

## Task 6: Graph Coverage For x-nkdk-graph Hints

**Files:**
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts`
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceTable/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceDimensionTable/types.ts`
- Modify: `packages/core/metadata/graphImport/registerTopLevelGraphImports.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`

- [ ] **Step 1: Add failing graph tests**

Append to `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`:

```ts
describe("buildGraph (TypeDescription graph hint coverage)", () => {
  it("creates graph nodes for defined types used by x-nkdk-graph hints", async () => {
    const result = await buildGraph(
      new Map([
        ["ОпределяемыйТип/ДенежнаяСумма/Свойства.yaml", "Синоним: Денежная сумма\n"],
      ]),
      ctx,
    )

    const nodes = result.flatMap((file) => file.nodes)
    expect(nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "DefinedType.ДенежнаяСумма",
          label: "MetadataObject",
          props: expect.objectContaining({ kind: "MetadataDefinedType", name: "ДенежнаяСумма" }),
        }),
      ]),
    )
  })

  it("creates graph nodes for external data source table type hints", async () => {
    const result = await buildGraph(
      new Map([
        [
          "ВнешнийИсточникДанных/ВсеСвойства/Свойства.yaml",
          [
            "Синоним: Все свойства",
            "Таблицы:",
            "  ВсеСвойства:",
            "    Синоним: Все свойства",
            "Кубы:",
            "  Продажи:",
            "    Синоним: Продажи",
            "    ТаблицыИзмерений:",
            "      Номенклатура:",
            "        Синоним: Номенклатура",
          ].join("\n"),
        ],
      ]),
      ctx,
    )

    const edges = result.flatMap((file) => file.edges)
    expect(edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "ExternalDataSource.ВсеСвойства",
          tgt: "ExternalDataSource.ВсеСвойства.Table.ВсеСвойства",
          kind: "EXTERNAL_DATA_SOURCE_TABLE",
        }),
        expect.objectContaining({
          src: "ExternalDataSource.ВсеСвойства.Cube.Продажи",
          tgt: "ExternalDataSource.ВсеСвойства.Cube.Продажи.DimensionTable.Номенклатура",
          kind: "EXTERNAL_DATA_SOURCE_DIMENSION_TABLE",
        }),
      ]),
    )
  })
})
```

- [ ] **Step 2: Run graph tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/buildGraph.test.ts
```

Expected: FAIL because `DefinedType` and external data source paths are not yet covered by top-level graph import/graphChild registration.

- [ ] **Step 3: Register graph edge kinds**

Modify `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts` and add these entries near other owning child-object kinds:

```ts
  ["EXTERNAL_DATA_SOURCE_TABLE", { yaml: "ТаблицаВнешнегоИсточникаДанных", owning: true }],
  ["EXTERNAL_DATA_SOURCE_CUBE", { yaml: "КубВнешнегоИсточникаДанных", owning: true }],
  ["EXTERNAL_DATA_SOURCE_DIMENSION_TABLE", { yaml: "ТаблицаИзмеренияКубаВнешнегоИсточникаДанных", owning: true }],
```

- [ ] **Step 4: Add graphChild registrations for external data source nested collections**

Modify `packages/core/metadata/commonObjects/metadataExternalDataSourceTable/types.ts`:

```ts
registerMetadataItemCollectionRule({
  propertyType: "MetadataExternalDataSourceTables",
  itemRule: MetadataExternalDataSourceTableCollectionRules,
  xmlElement: "Table",
  keyField: "name",
  graphChild: {
    idFrom: "name",
    edgeKind: "EXTERNAL_DATA_SOURCE_TABLE",
    edgeYaml: "ТаблицаВнешнегоИсточникаДанных",
    nodeSegment: "Table",
  },
})
```

Modify `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/types.ts`:

```ts
registerMetadataItemCollectionRule({
  propertyType: "MetadataExternalDataSourceCubes",
  itemRule: MetadataExternalDataSourceCubeCollectionRules,
  xmlElement: "Cube",
  keyField: "name",
  graphChild: {
    idFrom: "name",
    edgeKind: "EXTERNAL_DATA_SOURCE_CUBE",
    edgeYaml: "КубВнешнегоИсточникаДанных",
    nodeSegment: "Cube",
  },
})
```

Modify `packages/core/metadata/commonObjects/metadataExternalDataSourceDimensionTable/types.ts`:

```ts
registerMetadataItemCollectionRule({
  propertyType: "MetadataExternalDataSourceDimensionTables",
  itemRule: MetadataExternalDataSourceDimensionTableCollectionRules,
  xmlElement: "DimensionTable",
  keyField: "name",
  graphChild: {
    idFrom: "name",
    edgeKind: "EXTERNAL_DATA_SOURCE_DIMENSION_TABLE",
    edgeYaml: "ТаблицаИзмеренияКубаВнешнегоИсточникаДанных",
    nodeSegment: "DimensionTable",
  },
})
```

- [ ] **Step 5: Add top-level graph imports used by graph hints**

Modify `packages/core/metadata/graphImport/registerTopLevelGraphImports.ts`.

Add imports:

```ts
import { MetadataBusinessProcessRules } from "~/metadata/appliedObjects/metadataBusinessProcess/rules"
import { MetadataChartOfAccountsRules } from "~/metadata/appliedObjects/metadataChartOfAccounts/rules"
import { MetadataChartOfCalculationTypesRules } from "~/metadata/appliedObjects/metadataChartOfCalculationTypes/rules"
import { MetadataChartOfCharacteristicTypesRules } from "~/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules"
import { MetadataDefinedTypeRules } from "~/metadata/appliedObjects/metadataDefinedType/rules"
import { MetadataExternalDataSourceRules } from "~/metadata/appliedObjects/metadataExternalDataSource/rules"
import { MetadataTaskRules } from "~/metadata/appliedObjects/metadataTask/rules"
```

Add specs to `topLevelGraphImportSpecs`:

```ts
  {
    kind: "definedType",
    dir: "ОпределяемыйТип",
    rule: MetadataDefinedTypeRules,
  },
  {
    kind: "chartOfCharacteristicTypes",
    dir: "ПланВидовХарактеристик",
    rule: MetadataChartOfCharacteristicTypesRules,
  },
  {
    kind: "chartOfAccounts",
    dir: "ПланСчетов",
    rule: MetadataChartOfAccountsRules,
  },
  {
    kind: "chartOfCalculationTypes",
    dir: "ПланВидовРасчета",
    rule: MetadataChartOfCalculationTypesRules,
  },
  {
    kind: "businessProcess",
    dir: "БизнесПроцесс",
    rule: MetadataBusinessProcessRules,
  },
  {
    kind: "task",
    dir: "Задача",
    rule: MetadataTaskRules,
  },
  {
    kind: "externalDataSource",
    dir: "ВнешнийИсточникДанных",
    rule: MetadataExternalDataSourceRules,
  },
```

- [ ] **Step 6: Run graph tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/buildGraph.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts packages/core/metadata/commonObjects/metadataExternalDataSourceTable/types.ts packages/core/metadata/commonObjects/metadataExternalDataSourceCube/types.ts packages/core/metadata/commonObjects/metadataExternalDataSourceDimensionTable/types.ts packages/core/metadata/graphImport/registerTopLevelGraphImports.ts packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts
git commit -m "feat: expose graph targets for TypeDescription hints"
```

## Task 7: End-To-End Verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run focused test suite**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/toJSONSchema.test.ts metadata/commonObjects/typeDescription/fromYAML.test.ts metadata/commonObjects/typeDescription/toYAML.test.ts metadata/validation/projectFileSchema.test.ts metadata/orchestration/buildGraph/buildGraph.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run core type-check**

Run:

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: PASS.

- [ ] **Step 3: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: all package test suites pass.

- [ ] **Step 4: Inspect the final diff**

Run:

```bash
git diff --stat
git diff --check
```

Expected: `git diff --check` prints no output.

- [ ] **Step 5: Commit final fixes if the verification steps required edits**

Use this only if Step 1, 2, 3, or 4 required additional code changes:

```bash
git add packages/core/metadata
git commit -m "fix: align TypeDescription constraints with project checks"
```

## Self-Review

- Spec coverage: the plan covers internal-English `allowedTypes`, strict schema, strict `fromYAML`, single-only type behavior, primitive descriptions/examples, `x-nkdk-graph.query`, short external data source YAML forms, catalog-only attribute rules, document broad fallback, graph hint coverage, and final `pnpm test`.
- Empty-marker scan: the plan contains no deferred implementation markers or undefined implementation steps.
- Type consistency: `TypeDescriptionAllowedTypes`, `MetadataCatalogAttributeRules`, `MetadataCatalogAttributes`, `x-nkdk-graph`, and `EXTERNAL_DATA_SOURCE_*` names are used consistently across tasks.
