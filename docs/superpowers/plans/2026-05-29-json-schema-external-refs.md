# JSON Schema External Refs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `nkdk schema` return compact JSON Schema for LLM use, with external `nkdk://schema/<Name>` refs and separate lookup by schema name.

**Architecture:** Keep concrete schema knowledge outside the universal orchestration core. Add a small generic JSON Schema ref registry in `orchestration`, then register project-specific named schemas and property refs from `metadata/validation/schemaRegistry.ts`. CLI stays thin: it chooses file-path mode or schema-name mode, passes `inline` vs default `externalRefs`, and prints JSON.

**Tech Stack:** TypeScript, TypeBox JSON Schema, Vitest, Commander CLI, existing metadata rule framework.

---

## File Structure

- Create `packages/core/metadata/orchestration/jsonSchemaRefs.ts`
  - Generic registry and helpers: schema URI creation, property-ref registration, named-schema registration, ref collection, `externalRefs`/`inline` context.
  - This file must not import concrete applied objects or form element rules.

- Modify `packages/core/metadata/context/types.ts`
  - Add `exportToJSONSchema?: JSONSchemaExportContext` to `ConfigurationContext`.

- Modify `packages/core/metadata/orchestration/property/fn.ts`
  - Reuse the context type; no new concrete dependency.

- Modify `packages/core/metadata/orchestration/property/toJSONSchema.ts`
  - In `externalRefs` mode, check the generic registry before calling the existing type-specific exporter.

- Modify `packages/core/metadata/orchestration/formElement/toJSONSchema.ts`
  - Add an exporter for a form element rule with YAML discriminator `Вид`.

- Modify `packages/core/metadata/forms/commonObjects/childItems/treeYAML.ts`
  - Export the existing child-item type sets so JSON Schema can reuse the same allowed element lists as YAML import.

- Create `packages/core/metadata/validation/schemaRegistry.ts`
  - Concrete named schemas: root metadata schemas, form schema, common child schemas, individual form element schemas.
  - Concrete property refs: attributes, tabular sections, commands, form attributes, form columns, parameters, child elements.

- Modify `packages/core/metadata/validation/projectFileSchema.ts`
  - Change path resolution to resolve a root schema name, then export through the unified registry.
  - Add `exportJSONSchemaForSchemaName`.

- Modify `packages/core/index.ts`
  - Export the new public core helpers and types.

- Modify `packages/cli/src/commands/schema.ts`
  - Support two syntaxes: `schema <file> --project <dir>` and `schema <name>`.
  - Add `--inline`.

- Modify `packages/cli/src/cli.ts`
  - Update command argument/description/options.

- Modify `/Users/nikita/git/new_config_add_item_test/.agents/skills/config-add-item/SKILL.md`
  - Document `$ref` lookup via `nkdk schema <name>`.

## Implementation Preconditions

- Before changing files under `packages/core/metadata/**`, read `.agents/knowledge/metadata/INDEX.md`.
- Before changing files under `packages/core/metadata/orchestration/**`, read `.agents/architecture-orchestration.md`.
- Do not modify XML fixtures for this feature.

---

### Task 1: Generic JSON Schema Ref Infrastructure

**Files:**
- Create: `packages/core/metadata/orchestration/jsonSchemaRefs.ts`
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/orchestration/property/toJSONSchema.ts`
- Test: `packages/core/metadata/orchestration/jsonSchemaRefs.test.ts`

- [ ] **Step 1: Write failing tests for generic ref helpers**

Create `packages/core/metadata/orchestration/jsonSchemaRefs.test.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { afterEach, describe, expect, it } from "vitest"
import {
  attachCollectedSchemaRefs,
  clearJSONSchemaRefRegistries,
  createJSONSchemaExportContext,
  createSchemaRef,
  exportPropertyExternalRefSchema,
  recordOfSchemaRef,
  registerJSONSchemaPropertyRef,
} from "./jsonSchemaRefs"

const baseContext = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("jsonSchemaRefs", () => {
  afterEach(() => {
    clearJSONSchemaRefRegistries()
  })

  it("creates stable nkdk schema refs", () => {
    expect(createSchemaRef("InputField")).toBe("nkdk://schema/InputField")
  })

  it("returns a property ref only in externalRefs mode and collects the ref", () => {
    registerJSONSchemaPropertyRef("MetadataAttributes", () => recordOfSchemaRef("MetadataAttribute"))

    const inlineContext = createJSONSchemaExportContext(baseContext, "inline")
    expect(
      exportPropertyExternalRefSchema({
        context: inlineContext,
        rule: { type: "MetadataAttributes" },
      })
    ).toBeUndefined()

    const refContext = createJSONSchemaExportContext(baseContext, "externalRefs")
    expect(
      exportPropertyExternalRefSchema({
        context: refContext,
        rule: { type: "MetadataAttributes" },
      })
    ).toEqual({
      type: "object",
      additionalProperties: { $ref: "nkdk://schema/MetadataAttribute" },
    })

    expect(attachCollectedSchemaRefs(refContext, Type.Object({}))).toMatchObject({
      "x-nkdk-schemaRefs": ["nkdk://schema/MetadataAttribute"],
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/jsonSchemaRefs.test.ts --no-isolate
```

Expected: FAIL with module-not-found for `./jsonSchemaRefs`.

- [ ] **Step 3: Add JSON Schema context types**

Modify `packages/core/metadata/context/types.ts`.

Add near other context type declarations:

```ts
export type JSONSchemaExportMode = "externalRefs" | "inline"

export interface JSONSchemaExportContext {
  mode: JSONSchemaExportMode
  refs: Set<string>
}
```

Add this field to `ConfigurationContext`:

```ts
export interface ConfigurationContext {
  testMode?: boolean
  defaultLanguage: string
  version: string
  context?: object
  allElements?: FormElementsYAML
  enterprise?: EnterpriseContext

  exportToYAML?: FormExportToYAMLContext
  importFromYAML?: FormimportFromYAMLContext
  exportToXML?: ToXMLConfigurationContext
  exportToJSONSchema?: JSONSchemaExportContext
  /** Экземпляр графа, передаётся снаружи (из extension/CLI). Не синглтон. */
  graph?: GraphBuilder
}
```

- [ ] **Step 4: Implement generic ref registry**

Create `packages/core/metadata/orchestration/jsonSchemaRefs.ts`:

```ts
import { type TSchema } from "@sinclair/typebox"
import type { ConfigurationContext, JSONSchemaExportMode } from "~/metadata/context/types"
import type { PropertyRuleType } from "./property/registry"
import type { PropertyRule } from "./property/types"

export const JSON_SCHEMA_REF_PREFIX = "nkdk://schema/"

type PropertyRefFactory = (params: { context: ConfigurationContext; rule: PropertyRule }) => TSchema | undefined

const propertyRefFactories = new Map<PropertyRuleType, PropertyRefFactory>()

export function clearJSONSchemaRefRegistries(): void {
  propertyRefFactories.clear()
}

export function createSchemaRef(name: string): string {
  return `${JSON_SCHEMA_REF_PREFIX}${name}`
}

export function schemaRef(name: string): TSchema {
  return { $ref: createSchemaRef(name) } as TSchema
}

export function recordOfSchemaRef(name: string): TSchema {
  return {
    type: "object",
    additionalProperties: schemaRef(name),
  } as TSchema
}

export function recordOfOneOfSchemaRefs(names: readonly string[]): TSchema {
  return {
    type: "object",
    additionalProperties: {
      oneOf: names.map((name) => schemaRef(name)),
    },
  } as TSchema
}

export function registerJSONSchemaPropertyRef(type: PropertyRuleType, factory: PropertyRefFactory): void {
  propertyRefFactories.set(type, factory)
}

export function createJSONSchemaExportContext(
  context: ConfigurationContext,
  mode: JSONSchemaExportMode
): ConfigurationContext {
  return {
    ...context,
    exportToJSONSchema: {
      mode,
      refs: new Set<string>(),
    },
  }
}

export function exportPropertyExternalRefSchema(params: {
  context: ConfigurationContext
  rule: PropertyRule
}): TSchema | undefined {
  const { context, rule } = params
  if (context.exportToJSONSchema?.mode !== "externalRefs") return undefined

  const factory = propertyRefFactories.get(rule.type)
  if (!factory) return undefined

  const schema = factory(params)
  if (schema) collectSchemaRefs(context, schema)
  return schema
}

export function attachCollectedSchemaRefs(context: ConfigurationContext, schema: TSchema): TSchema {
  const refs = context.exportToJSONSchema?.refs
  if (!refs || refs.size === 0) return schema

  return {
    ...schema,
    "x-nkdk-schemaRefs": [...refs].sort(),
  } as TSchema
}

function collectSchemaRefs(context: ConfigurationContext, schema: unknown): void {
  const refs = context.exportToJSONSchema?.refs
  if (!refs) return

  for (const ref of findSchemaRefs(schema)) {
    refs.add(ref)
  }
}

function findSchemaRefs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => findSchemaRefs(item))
  }

  if (value === null || typeof value !== "object") return []

  const record = value as Record<string, unknown>
  const ownRef = typeof record["$ref"] === "string" && record["$ref"].startsWith(JSON_SCHEMA_REF_PREFIX)
    ? [record["$ref"]]
    : []

  return [...ownRef, ...Object.values(record).flatMap((item) => findSchemaRefs(item))]
}
```

- [ ] **Step 5: Make property JSON Schema export use refs before inline exporters**

Modify `packages/core/metadata/orchestration/property/toJSONSchema.ts`.

Add import:

```ts
import { exportPropertyExternalRefSchema } from "../jsonSchemaRefs"
```

In `exportPropertyToJSONSchema`, add this block before `getTypeRule`:

```ts
  const externalRefSchema = exportPropertyExternalRefSchema({
    context,
    rule,
  })
  if (externalRefSchema !== undefined) return externalRefSchema
```

The beginning of the function should become:

```ts
export const exportPropertyToJSONSchema = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
}): TSchema | undefined => {
  const { context, rule, value } = params

  const externalRefSchema = exportPropertyExternalRefSchema({
    context,
    rule,
  })
  if (externalRefSchema !== undefined) return externalRefSchema

  const typeExportFn = rule.type ? getTypeRule(rule.type, "exportToJSONSchema") : undefined
```

- [ ] **Step 6: Run generic ref tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/jsonSchemaRefs.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/context/types.ts packages/core/metadata/orchestration/jsonSchemaRefs.ts packages/core/metadata/orchestration/jsonSchemaRefs.test.ts packages/core/metadata/orchestration/property/toJSONSchema.ts
git commit -m "feat: :sparkles: добавить основу внешних JSON Schema refs"
```

---

### Task 2: Element Schema Support

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/childItems/treeYAML.ts`
- Modify: `packages/core/metadata/orchestration/formElement/toJSONSchema.ts`
- Test: `packages/core/metadata/orchestration/formElement/toJSONSchema.test.ts`

- [ ] **Step 1: Write failing tests for form element schemas**

Create `packages/core/metadata/orchestration/formElement/toJSONSchema.test.ts`:

```ts
import "~/metadata/forms/elements/inputField/rules"
import "~/metadata/forms/elements/table/rules"
import { describe, expect, it } from "vitest"
import { getChildItemTypesByPropertyType } from "~/metadata/forms/commonObjects/childItems/treeYAML"
import { getElementRule } from "./ruleFactory"
import { exportElementRuleToJSONSchema } from "./toJSONSchema"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("form element JSON Schema", () => {
  it("exports a tree node schema with Вид discriminator", () => {
    const schema = exportElementRuleToJSONSchema({
      context,
      rule: getElementRule("InputField"),
      yamlKind: "ПолеВвода",
    })

    expect(schema).toMatchObject({
      type: "object",
      additionalProperties: false,
      properties: expect.objectContaining({
        Вид: { const: "ПолеВвода" },
        ПутьКДанным: expect.any(Object),
      }),
      required: expect.arrayContaining(["Вид"]),
    })
  })

  it("exposes child item type sets used by tree YAML", () => {
    expect(getChildItemTypesByPropertyType("GroupChildItems")).toContain("InputField")
    expect(getChildItemTypesByPropertyType("TableChildItems")).toContain("TableInputField")
    expect(getChildItemTypesByPropertyType("PagesChildItems")).toEqual(["Page"])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/formElement/toJSONSchema.test.ts --no-isolate
```

Expected: FAIL because `getChildItemTypesByPropertyType` and `exportElementRuleToJSONSchema` are not exported.

- [ ] **Step 3: Export child item type sets from tree YAML**

Modify `packages/core/metadata/forms/commonObjects/childItems/treeYAML.ts`.

Change:

```ts
type ChildItemsTreePropertyType = (typeof childItemsTreePropertyTypes)[number]
```

to:

```ts
export type ChildItemsTreePropertyType = (typeof childItemsTreePropertyTypes)[number]
```

Add after `childItemTypesByPropertyType`:

```ts
export const getChildItemTypesByPropertyType = (
  propertyType: ChildItemsTreePropertyType
): readonly CollectableElementType[] => {
  return childItemTypesByPropertyType[propertyType]
}
```

- [ ] **Step 4: Add form element rule schema exporter**

Modify `packages/core/metadata/orchestration/formElement/toJSONSchema.ts`.

Add import:

```ts
import { ElementRule } from "./types"
```

Replace the first import line if needed so the file starts with:

```ts
import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { exportPropertiesToJSONSchema } from "../property/toJSONSchema"
import { getElementRule } from "./ruleFactory"
import { ElementRule } from "./types"
```

Add this function before `exportElementToJSONSchema`:

```ts
export const exportElementRuleToJSONSchema = (params: {
  context: ConfigurationContext
  rule: ElementRule
  yamlKind: string
}): TSchema => {
  const { context, rule, yamlKind } = params
  const properties = exportPropertiesToJSONSchema({
    context,
    rule,
  })

  return Type.Object(
    {
      Вид: Type.Literal(yamlKind),
      ...properties,
    },
    {
      additionalProperties: false,
    }
  )
}
```

Keep existing `exportElementToJSONSchema` unchanged for callers that already pass a concrete element value.

- [ ] **Step 5: Run form element schema tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/formElement/toJSONSchema.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/forms/commonObjects/childItems/treeYAML.ts packages/core/metadata/orchestration/formElement/toJSONSchema.ts packages/core/metadata/orchestration/formElement/toJSONSchema.test.ts
git commit -m "feat: :sparkles: добавить схемы видов элементов формы"
```

---

### Task 3: Concrete Schema Registry

**Files:**
- Create: `packages/core/metadata/validation/schemaRegistry.ts`
- Test: `packages/core/metadata/validation/schemaRegistry.test.ts`

- [ ] **Step 1: Write failing registry tests**

Create `packages/core/metadata/validation/schemaRegistry.test.ts`:

```ts
import "~/metadata/appliedObjects"
import { describe, expect, it } from "vitest"
import { exportJSONSchemaForSchemaName, listJSONSchemaNames } from "./schemaRegistry"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("schemaRegistry", () => {
  it("exports a compact named metadata attribute schema", () => {
    const schema = exportJSONSchemaForSchemaName({
      context,
      name: "MetadataAttribute",
    })

    expect(schema).toMatchObject({
      "x-nkdk-schemaRefs": expect.any(Array),
    })
    expect(JSON.stringify(schema)).toContain("\"Тип\"")
    expect(JSON.stringify(schema)).not.toContain("MetadataCatalog")
  })

  it("exports a compact InputField schema with Вид discriminator", () => {
    const schema = exportJSONSchemaForSchemaName({
      context,
      name: "InputField",
    })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Вид: { const: "ПолеВвода" },
      }),
      required: expect.arrayContaining(["Вид"]),
    })
  })

  it("keeps nested child items as refs", () => {
    const schema = exportJSONSchemaForSchemaName({
      context,
      name: "UsualGroup",
    })

    expect(JSON.stringify(schema)).toContain("nkdk://schema/InputField")
    expect(JSON.stringify(schema)).not.toContain("\"ПутьКДанным\"")
  })

  it("supports inline mode for named schemas", () => {
    const schema = exportJSONSchemaForSchemaName({
      context,
      name: "UsualGroup",
      mode: "inline",
    })

    expect(JSON.stringify(schema)).not.toContain("nkdk://schema/InputField")
  })

  it("rejects unknown schema names with available-name hint", () => {
    expect(() =>
      exportJSONSchemaForSchemaName({
        context,
        name: "UnknownSchema",
      })
    ).toThrow(/Неизвестная JSON Schema "UnknownSchema"/)
  })

  it("lists registered schema names", () => {
    expect(listJSONSchemaNames()).toEqual(expect.arrayContaining(["MetadataAttribute", "InputField", "Table"]))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/schemaRegistry.test.ts --no-isolate
```

Expected: FAIL because `./schemaRegistry` does not exist.

- [ ] **Step 3: Create concrete schema registry**

Create `packages/core/metadata/validation/schemaRegistry.ts`:

```ts
import "~/metadata/appliedObjects"
import "~/metadata/forms"
import { type TSchema } from "@sinclair/typebox"
import { MetadataAccumulationRegisterRules } from "~/metadata/appliedObjects/metadataAccumulationRegister/rules"
import { exportMetadataCatalogToJSONSchema } from "~/metadata/appliedObjects/metadataCatalog/toJSONSchema"
import { MetadataDataProcessorRules } from "~/metadata/appliedObjects/metadataDataProcessor/rules"
import { exportMetadataDocumentToJSONSchema } from "~/metadata/appliedObjects/metadataDocument/toJSONSchema"
import { MetadataDocumentJournalRules } from "~/metadata/appliedObjects/metadataDocumentJournal/rules"
import { exportMetadataEnumerationToJSONSchema } from "~/metadata/appliedObjects/metadataEnumeration/toJSONSchema"
import { MetadataExchangePlanRules } from "~/metadata/appliedObjects/metadataExchangePlan/rules"
import { MetadataHTTPServiceRules } from "~/metadata/appliedObjects/metadataHTTPService/rules"
import { MetadataInformationRegisterRules } from "~/metadata/appliedObjects/metadataInformationRegister/rules"
import { MetadataCommandRules } from "~/metadata/appliedObjects/metadataCommand/rules"
import {
  MetadataAttributeRules,
  MetadataTabularSectionAttributeRules,
} from "~/metadata/commonObjects/metadataAttribute/rules"
import { MetadataTabularSectionRules } from "~/metadata/commonObjects/metadataTabularSection/rules"
import type { ConfigurationContext, JSONSchemaExportMode } from "~/metadata/context/types"
import { createEmptyClientApplicationForm } from "~/metadata/forms/clientApplicationForm/createEmpty"
import { exportClientApplicationFormToJSONSchema } from "~/metadata/forms/clientApplicationForm/toJSONSchema"
import { CollectableElementTypeToYAML, type CollectableElementType } from "~/metadata/orchestration/formElement/types"
import { getElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { exportElementRuleToJSONSchema } from "~/metadata/orchestration/formElement/toJSONSchema"
import { getChildItemTypesByPropertyType } from "~/metadata/forms/commonObjects/childItems/treeYAML"
import { FormAttributeColumnRules, FormAttributeRules } from "~/metadata/forms/commonObjects/formAttribute/rules"
import { FormCommandRules } from "~/metadata/forms/commonObjects/formCommand/rules"
import { FormParameterJSONSchema } from "~/metadata/forms/commonObjects/formParameter/types"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import {
  attachCollectedSchemaRefs,
  createJSONSchemaExportContext,
  recordOfOneOfSchemaRefs,
  recordOfSchemaRef,
  registerJSONSchemaPropertyRef,
} from "~/metadata/orchestration/jsonSchemaRefs"

export class ProjectFileSchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProjectFileSchemaError"
  }
}

type SchemaExporter = (context: ConfigurationContext) => TSchema

const schemaExporters = new Map<string, SchemaExporter>()
let schemaRegistryReady = false

export function listJSONSchemaNames(): string[] {
  ensureJSONSchemaRegistry()
  return [...schemaExporters.keys()].sort()
}

export function exportJSONSchemaForSchemaName(params: {
  context: ConfigurationContext
  name: string
  mode?: JSONSchemaExportMode
}): TSchema {
  const { context, name } = params
  const mode = params.mode ?? "externalRefs"
  ensureJSONSchemaRegistry()

  const exporter = schemaExporters.get(name)
  if (!exporter) {
    throw new ProjectFileSchemaError(
      `Неизвестная JSON Schema "${name}". Доступные имена: ${listJSONSchemaNames().join(", ")}`
    )
  }

  const schemaContext = createJSONSchemaExportContext(context, mode)
  const schema = exporter(schemaContext)
  return mode === "externalRefs" ? attachCollectedSchemaRefs(schemaContext, schema) : schema
}

export function ensureJSONSchemaRegistry(): void {
  if (schemaRegistryReady) return
  schemaRegistryReady = true

  registerNamedSchemas()
  registerPropertyRefs()
}

function registerNamedSchemas(): void {
  schemaExporters.set("MetadataCatalog", (context) => exportMetadataCatalogToJSONSchema({ context }))
  schemaExporters.set("MetadataDocument", (context) => exportMetadataDocumentToJSONSchema({ context }))
  schemaExporters.set("MetadataEnumeration", (context) => exportMetadataEnumerationToJSONSchema({ context }))
  schemaExporters.set("MetadataDataProcessor", (context) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataDataProcessorRules })
  )
  schemaExporters.set("MetadataDocumentJournal", (context) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataDocumentJournalRules })
  )
  schemaExporters.set("MetadataHTTPService", (context) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataHTTPServiceRules })
  )
  schemaExporters.set("MetadataInformationRegister", (context) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataInformationRegisterRules })
  )
  schemaExporters.set("MetadataAccumulationRegister", (context) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataAccumulationRegisterRules })
  )
  schemaExporters.set("MetadataExchangePlan", (context) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataExchangePlanRules })
  )
  schemaExporters.set("ClientApplicationForm", (context) =>
    exportClientApplicationFormToJSONSchema({ context, value: createEmptyClientApplicationForm() })
  )

  schemaExporters.set("MetadataAttribute", (context) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataAttributeRules })
  )
  schemaExporters.set("MetadataTabularSectionAttribute", (context) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataTabularSectionAttributeRules })
  )
  schemaExporters.set("MetadataTabularSection", (context) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataTabularSectionRules })
  )
  schemaExporters.set("MetadataCommand", (context) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataCommandRules })
  )
  schemaExporters.set("FormAttribute", (context) => exportMetadataItemToJSONSchema({ context, rule: FormAttributeRules }))
  schemaExporters.set("FormAttributeColumn", (context) =>
    exportMetadataItemToJSONSchema({ context, rule: FormAttributeColumnRules })
  )
  schemaExporters.set("FormCommand", (context) => exportMetadataItemToJSONSchema({ context, rule: FormCommandRules }))
  schemaExporters.set("FormParameter", () => FormParameterJSONSchema)

  for (const [itemType, yamlKind] of Object.entries(CollectableElementTypeToYAML)) {
    const elementType = itemType as CollectableElementType
    schemaExporters.set(elementType, (context) =>
      exportElementRuleToJSONSchema({
        context,
        rule: getElementRule(elementType),
        yamlKind,
      })
    )
  }
}

function registerPropertyRefs(): void {
  const attributeTypes = [
    "MetadataCatalogAttributes",
    "MetadataDocumentAttributes",
    "MetadataAttributes",
    "MetadataRegisterAttributes",
    "MetadataReportAttributes",
    "MetadataTaskAddressingAttributes",
  ] as const
  for (const type of attributeTypes) {
    registerJSONSchemaPropertyRef(type, () => recordOfSchemaRef("MetadataAttribute"))
  }

  registerJSONSchemaPropertyRef("MetadataTabularSectionAttributes", () =>
    recordOfSchemaRef("MetadataTabularSectionAttribute")
  )

  const tabularSectionTypes = [
    "MetadataTabularSections",
    "MetadataDocumentTabularSections",
    "MetadataTaskTabularSections",
    "MetadataBusinessProcessTabularSections",
    "MetadataDataProcessorTabularSections",
    "MetadataReportTabularSections",
    "MetadataExchangePlanTabularSections",
    "MetadataChartOfAccountsTabularSections",
    "MetadataChartOfCalculationTypesTabularSections",
    "MetadataChartOfCharacteristicTypesTabularSections",
  ] as const
  for (const type of tabularSectionTypes) {
    registerJSONSchemaPropertyRef(type, () => recordOfSchemaRef("MetadataTabularSection"))
  }

  registerJSONSchemaPropertyRef("MetadataCommands", () => recordOfSchemaRef("MetadataCommand"))
  registerJSONSchemaPropertyRef("FormAttributes", () => recordOfSchemaRef("FormAttribute"))
  registerJSONSchemaPropertyRef("FormAttributeColumns", () => recordOfSchemaRef("FormAttributeColumn"))
  registerJSONSchemaPropertyRef("FormCommands", () => recordOfSchemaRef("FormCommand"))
  registerJSONSchemaPropertyRef("FormParameters", () => recordOfSchemaRef("FormParameter"))

  const childItemTypes = ["GroupChildItems", "CommandBarChildItems", "TableChildItems", "PagesChildItems"] as const
  for (const type of childItemTypes) {
    registerJSONSchemaPropertyRef(type, () => recordOfOneOfSchemaRefs(getChildItemTypesByPropertyType(type)))
  }
}
```

- [ ] **Step 4: Run TypeScript check for registry imports**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS. The rule names in Step 3 match the current exports, including `MetadataTabularSectionRules` from `packages/core/metadata/commonObjects/metadataTabularSection/rules.ts`.

- [ ] **Step 5: Run registry tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/schemaRegistry.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/validation/schemaRegistry.ts packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "feat: :sparkles: добавить реестр JSON Schema"
```

---

### Task 4: Core Project File Schema API

**Files:**
- Modify: `packages/core/metadata/validation/projectFileSchema.ts`
- Modify: `packages/core/metadata/validation/projectFileSchema.test.ts`
- Modify: `packages/core/index.ts`

- [ ] **Step 1: Update tests for compact default and inline mode**

Modify `packages/core/metadata/validation/projectFileSchema.test.ts`.

Add imports:

```ts
import { exportJSONSchemaForSchemaName } from "./projectFileSchema"
```

Change the first catalog test to assert refs by default:

```ts
  it("exports compact catalog schema for absolute properties path by default", () => {
    const projectDir = createProject()
    const filePath = join(projectDir, "Справочник", "Товары", "Свойства.yaml")

    const schema = exportJSONSchemaForProjectFile({ context, filePath })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Реквизиты: {
          type: "object",
          additionalProperties: { $ref: "nkdk://schema/MetadataAttribute" },
        },
      }),
      "x-nkdk-schemaRefs": expect.arrayContaining(["nkdk://schema/MetadataAttribute"]),
    })
  })
```

Add a new inline test:

```ts
  it("exports inline catalog schema when requested", () => {
    const schema = exportJSONSchemaForProjectFile({
      context,
      filePath: "Справочник/Товары/Свойства.yaml",
      mode: "inline",
    })

    expect(JSON.stringify(schema)).not.toContain("nkdk://schema/MetadataAttribute")
    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Синоним: expect.any(Object),
      }),
    })
  })
```

Add schema-name tests:

```ts
  it("exports schema by name", () => {
    const schema = exportJSONSchemaForSchemaName({
      context,
      name: "InputField",
    })

    expect(schema).toMatchObject({
      properties: expect.objectContaining({
        Вид: { const: "ПолеВвода" },
      }),
    })
  })

  it("rejects unknown schema names", () => {
    expect(() =>
      exportJSONSchemaForSchemaName({
        context,
        name: "UnknownSchema",
      })
    ).toThrow(/Неизвестная JSON Schema "UnknownSchema"/)
  })
```

Change the two validation tests that compile schema for `validateFile` so they request inline mode:

```ts
      exportJSONSchemaForProjectFile({
        context,
        filePath: "Справочник/Товары/Свойства.yaml",
        mode: "inline",
      })
```

and:

```ts
      exportJSONSchemaForProjectFile({
        context,
        filePath: "Документ/Заказ/Свойства.yaml",
        mode: "inline",
      })
```

- [ ] **Step 2: Run project file schema tests to verify failures**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectFileSchema.test.ts --no-isolate
```

Expected: FAIL because `mode` and `exportJSONSchemaForSchemaName` are not implemented in `projectFileSchema.ts`.

- [ ] **Step 3: Replace path-to-exporter map with path-to-schema-name map**

Modify `packages/core/metadata/validation/projectFileSchema.ts`.

Remove concrete schema exporter imports from this file except `ConfigurationContext` and path helpers. Import from `schemaRegistry` instead:

```ts
import type { TSchema } from "@sinclair/typebox"
import { isAbsolute, relative, resolve, sep } from "path"
import type { ConfigurationContext, JSONSchemaExportMode } from "~/metadata/context/types"
import {
  exportJSONSchemaForSchemaName as exportRegisteredJSONSchemaForSchemaName,
  ProjectFileSchemaError,
} from "./schemaRegistry"

export { ProjectFileSchemaError } from "./schemaRegistry"
```

Update params:

```ts
export interface ExportJSONSchemaForProjectFileParams {
  context: ConfigurationContext
  filePath: string
  projectDir?: string
  mode?: JSONSchemaExportMode
}

export interface ExportJSONSchemaForSchemaNameParams {
  context: ConfigurationContext
  name: string
  mode?: JSONSchemaExportMode
}
```

Replace `metadataSchemaByDir` with:

```ts
const metadataSchemaNameByDir = {
  Справочник: "MetadataCatalog",
  Документ: "MetadataDocument",
  Перечисление: "MetadataEnumeration",
  Обработка: "MetadataDataProcessor",
  ЖурналДокументов: "MetadataDocumentJournal",
  HTTPСервис: "MetadataHTTPService",
  РегистрСведений: "MetadataInformationRegister",
  РегистрНакопления: "MetadataAccumulationRegister",
  ПланОбмена: "MetadataExchangePlan",
} satisfies Record<string, string>
```

Replace `exportJSONSchemaForProjectFile` with:

```ts
export function exportJSONSchemaForProjectFile(params: ExportJSONSchemaForProjectFileParams): TSchema {
  const { context } = params
  const normalized = normalizeProjectPath(params)
  const parts = normalized.split("/")

  if (!normalized.toLowerCase().endsWith(".yaml")) {
    throw new ProjectFileSchemaError("JSON Schema поддерживается только для .yaml файлов")
  }

  const schemaName = findProjectFileSchemaName(parts)
  if (!schemaName) {
    throw new ProjectFileSchemaError(expectedPatterns)
  }

  return exportRegisteredJSONSchemaForSchemaName({
    context,
    name: schemaName,
    mode: params.mode,
  })
}

export function exportJSONSchemaForSchemaName(params: ExportJSONSchemaForSchemaNameParams): TSchema {
  return exportRegisteredJSONSchemaForSchemaName(params)
}
```

Add:

```ts
function findProjectFileSchemaName(parts: string[]): string | undefined {
  if (isFormPath(parts)) return "ClientApplicationForm"

  const propertiesMatch = findPropertiesPath(parts)
  if (propertiesMatch) return propertiesMatch.schemaName

  return undefined
}
```

Change `findPropertiesPath` to:

```ts
function findPropertiesPath(parts: string[]): { schemaName: string } | undefined {
  if (parts.length < 3 || parts[parts.length - 1] !== "Свойства.yaml") return undefined

  const objectDir = parts[parts.length - 3]
  if (!objectDir || !hasMetadataSchema(objectDir)) return undefined

  return { schemaName: metadataSchemaNameByDir[objectDir] }
}
```

Change `hasMetadataSchema` to:

```ts
function hasMetadataSchema(dir: string): dir is keyof typeof metadataSchemaNameByDir {
  return Object.prototype.hasOwnProperty.call(metadataSchemaNameByDir, dir)
}
```

- [ ] **Step 4: Export public API from core index**

Modify `packages/core/index.ts`.

Replace the existing project schema export block with:

```ts
export {
  exportJSONSchemaForProjectFile,
  exportJSONSchemaForSchemaName,
  ProjectFileSchemaError,
  type ExportJSONSchemaForProjectFileParams,
  type ExportJSONSchemaForSchemaNameParams,
} from "./metadata/validation/projectFileSchema"
```

- [ ] **Step 5: Run core validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectFileSchema.test.ts metadata/validation/schemaRegistry.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/validation/projectFileSchema.ts packages/core/metadata/validation/projectFileSchema.test.ts packages/core/index.ts
git commit -m "feat: :sparkles: выбирать JSON Schema через реестр"
```

---

### Task 5: CLI Syntax

**Files:**
- Modify: `packages/cli/src/commands/schema.ts`
- Modify: `packages/cli/src/commands/schema.test.ts`
- Modify: `packages/cli/src/cli.ts`

- [ ] **Step 1: Write CLI tests for file/name syntax and inline mode**

Modify `packages/cli/src/commands/schema.test.ts`.

Replace the current tests with:

```ts
import { afterEach, describe, expect, it, vi } from "vitest"
import { printJSONSchema } from "./schema"

describe("schema command", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("prints compact JSON schema for a project file", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printJSONSchema("Справочник/Товары/Свойства.yaml", {})

    expect(stdout).toHaveBeenCalledOnce()
    const text = String(stdout.mock.calls[0]?.[0])
    const schema = JSON.parse(text)
    expect(text).toContain("\n  ")
    expect(schema.properties.Реквизиты.additionalProperties).toEqual({ $ref: "nkdk://schema/MetadataAttribute" })
  })

  it("prints compact JSON schema by schema name", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printJSONSchema("InputField", {})

    const schema = JSON.parse(String(stdout.mock.calls[0]?.[0]))
    expect(schema.properties.Вид).toEqual({ const: "ПолеВвода" })
  })

  it("prints inline JSON schema when requested", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printJSONSchema("Справочник/Товары/Свойства.yaml", { inline: true })

    const text = String(stdout.mock.calls[0]?.[0])
    expect(text).not.toContain("nkdk://schema/MetadataAttribute")
    expect(JSON.parse(text).properties).toHaveProperty("Реквизиты")
  })

  it("resolves relative file from explicit project", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printJSONSchema("Документ/Заказ/Свойства.yaml", { project: process.cwd() })

    const schema = JSON.parse(String(stdout.mock.calls[0]?.[0]))
    expect(schema.properties).toHaveProperty("СтандартныеРеквизиты")
  })

  it("does not write stdout when schema lookup fails", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await expect(printJSONSchema("UnknownSchema", {})).rejects.toThrow(/Неизвестная JSON Schema/)

    expect(stdout).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run CLI tests to verify failures**

Run:

```bash
pnpm --filter @nakidka/cli exec vitest run src/commands/schema.test.ts --no-isolate
```

Expected: FAIL because `printJSONSchema("InputField")` still treats `InputField` as a file path, and `inline` is not supported.

- [ ] **Step 3: Update CLI command implementation**

Modify `packages/cli/src/commands/schema.ts`:

```ts
import { exportJSONSchemaForProjectFile, exportJSONSchemaForSchemaName } from "@nakidka/core"

export interface SchemaCommandOptions {
  project?: string
  inline?: boolean
}

export const printJSONSchema = async (target: string, options: SchemaCommandOptions): Promise<void> => {
  const context = {
    defaultLanguage: "ru",
    version: "2.20",
  } as const
  const mode = options.inline === true ? "inline" : "externalRefs"

  const schema = options.project || target.toLowerCase().endsWith(".yaml")
    ? exportJSONSchemaForProjectFile({
        context,
        filePath: target,
        projectDir: options.project,
        mode,
      })
    : exportJSONSchemaForSchemaName({
        context,
        name: target,
        mode,
      })

  process.stdout.write(`${JSON.stringify(schema, null, 2)}\n`)
}
```

- [ ] **Step 4: Update Commander registration**

Modify the `schema` command in `packages/cli/src/cli.ts`:

```ts
program
  .command("schema")
  .description("Показать JSON Schema для YAML-файла проекта или имени схемы")
  .argument("<target>", "путь к YAML-файлу проекта или имя схемы")
  .option("--project <yamlDir>", "путь к корню YAML-проекта")
  .option("--inline", "развернуть составные подсхемы в одном JSON")
  .action((target: string, opts: { project?: string; inline?: boolean }) => {
    run(() => printJSONSchema(target, opts))
  })
```

- [ ] **Step 5: Run CLI tests**

Run:

```bash
pnpm --filter @nakidka/cli exec vitest run src/commands/schema.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/commands/schema.ts packages/cli/src/commands/schema.test.ts packages/cli/src/cli.ts
git commit -m "feat: :sparkles: обновить синтаксис команды schema"
```

---

### Task 6: Update config-add-item Instructions

**Files:**
- Modify: `/Users/nikita/git/new_config_add_item_test/.agents/skills/config-add-item/SKILL.md`

- [ ] **Step 1: Update the schema acquisition section**

In `/Users/nikita/git/new_config_add_item_test/.agents/skills/config-add-item/SKILL.md`, replace the section `## Получение схемы` through the examples block with:

````md
## Получение схемы

Построй путь будущего файла относительно корня YAML-проекта и получи сокращенную схему:

```bash
pnpm --filter @nakidka/cli dev schema "<relative-yaml-file>" --project "<yaml-project-dir>"
```

Если в окружении доступна установленная команда `nkdk`, можно использовать эквивалент:

```bash
nkdk schema "<relative-yaml-file>" --project "<yaml-project-dir>"
```

Примеры путей, которые понимает команда:

```text
Справочник/Товары/Свойства.yaml
Документ/Заказ/Свойства.yaml
Документ/Заказ/Формы/ФормаДокумента/Форма.yaml
```

Схема может содержать внешние ссылки вида:

```json
{ "$ref": "nkdk://schema/MetadataAttribute" }
```

Чтобы раскрыть такую ссылку, запроси схему по короткому имени последнего сегмента URI:

```bash
pnpm --filter @nakidka/cli dev schema "MetadataAttribute"
```

или установленной командой:

```bash
nkdk schema "MetadataAttribute"
```

Если вложенная схема снова содержит `$ref`, повторяй дозапрос по имени нужной схемы. Полный разворот одним ответом используй только для отладки:

```bash
nkdk schema "<relative-yaml-file>" --project "<yaml-project-dir>" --inline
```
````

Keep the existing paragraph after the examples:

```md
Если команда отвечает ошибкой `Ожидались пути вида ...`, не правь YAML вслепую: уточни относительный путь по существующей структуре проекта или соседнему объекту.
```

- [ ] **Step 2: Verify the instructions mention the new schema-name syntax**

Run:

```bash
rg -n "nkdk schema .*MetadataAttribute|--inline|\\$ref" /Users/nikita/git/new_config_add_item_test/.agents/skills/config-add-item/SKILL.md
```

Expected: output includes lines for `nkdk schema "MetadataAttribute"`, `--inline`, and `$ref`.

- [ ] **Step 3: Verify the external skill directory is not a git repository**

Run:

```bash
git -C /Users/nikita/git/new_config_add_item_test rev-parse --is-inside-work-tree
```

Expected: FAIL with:

```text
fatal: not a git repository (or any of the parent directories): .git
```

No commit is made for `/Users/nikita/git/new_config_add_item_test/.agents/skills/config-add-item/SKILL.md`; mention this in the implementation summary.

---

### Task 7: Final Verification

**Files:**
- No source edits expected.

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/jsonSchemaRefs.test.ts metadata/orchestration/formElement/toJSONSchema.test.ts metadata/validation/schemaRegistry.test.ts metadata/validation/projectFileSchema.test.ts --no-isolate
pnpm --filter @nakidka/cli exec vitest run src/commands/schema.test.ts --no-isolate
```

Expected: PASS for all listed test files.

- [ ] **Step 2: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all package test suites pass.

- [ ] **Step 3: Manual CLI smoke checks**

Run:

```bash
pnpm --filter @nakidka/cli dev schema "Справочник/Товары/Свойства.yaml"
pnpm --filter @nakidka/cli dev schema MetadataAttribute
pnpm --filter @nakidka/cli dev schema InputField
pnpm --filter @nakidka/cli dev schema "Справочник/Товары/Свойства.yaml" --inline
```

Expected:

- first command contains `nkdk://schema/MetadataAttribute`;
- `MetadataAttribute` prints valid JSON and contains `"Тип"`;
- `InputField` contains `"Вид": { "const": "ПолеВвода" }`;
- `--inline` output does not contain `nkdk://schema/MetadataAttribute`.

- [ ] **Step 4: Check git status in both repositories**

Run:

```bash
git status --short
git -C /Users/nikita/git/new_config_add_item_test status --short
```

Expected: either clean status, or only intentionally uncommitted files reported explicitly to the user.

---

## Self-Review

- Spec coverage: file syntax, name syntax, default compact mode, `--inline`, `x-nkdk-schemaRefs`, property-type based refs, per-element schemas, unknown-name errors, and `config-add-item` are covered by tasks.
- Scope check: implementation is one coherent feature across core, CLI, and one dependent `.agents` instruction. It does not require decomposition into separate plans.
- Placeholder scan: no red-flag placeholders or unspecified edge handling remains in this plan.
- Type consistency: the plan consistently uses `externalRefs | inline`, `exportJSONSchemaForProjectFile`, `exportJSONSchemaForSchemaName`, and `nkdk://schema/<Name>`.
