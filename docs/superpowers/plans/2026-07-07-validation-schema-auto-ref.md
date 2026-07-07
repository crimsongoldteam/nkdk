# Validation Schema Auto Ref Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перенести ref-схемы validation на стандартные регистрации metadata item и metadata collection, сохранив нейтральные границы orchestration.

**Architecture:** Добавляем нейтральный schema identity registry в orchestration рядом с текущими JSON Schema ref helpers. `registerMetadataItemRule` автоматически регистрирует одиночный rules-объект по `itemRule.itemType` или явному `schemaName`, а `registerMetadataItemCollectionRule` явно регистрирует shape коллекции и ссылку на item schema. Project/validation schema registry читает этот нейтральный registry и строит graph без знаний о конкретных applied/common/form объектах.

**Tech Stack:** TypeScript, TypeBox, AJV 2020, Vitest, pnpm workspace.

## Global Constraints

- Ответы и комментарии по задаче вести на русском языке.
- Не изменять XML-фикстуры.
- Не писать новые правила fromXML/toXML/fromYAML/toYAML без явного запроса.
- Не добавлять `order` в `rules.ts` без необходимости.
- Минимизировать `as any` и `as unknown`; если приведение нужно, держать его на границе registry/helper и покрыть тестом.
- `packages/core/metadata/orchestration`, `packages/core/metadata/validation` и `packages/core/metadata/project` не должны знать конкретные реализации метаданных.
- Полная проверка перед завершением: `pnpm test` из корня worktree.

---

## File Structure

- Modify: `packages/core/metadata/orchestration/jsonSchemaRefs.ts`
  - Ответственность: нейтральные `$ref` helpers, сбор refs, property-ref factories и новый named schema identity registry.
- Modify: `packages/core/metadata/orchestration/metadataItem/ruleFactory.ts`
  - Ответственность: стандартная регистрация одиночного metadata item и подключение schema identity по умолчанию.
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`
  - Ответственность: стандартная регистрация metadata collection, явная связь коллекции с item-rule и shape ref-схемы.
- Modify: `packages/core/metadata/project/schemaRegistry.ts`
  - Ответственность: объединить project-local schema exporters и нейтральные exporters из orchestration, раскрывать graph без частных условий.
- Modify: `packages/core/metadata/orchestration/jsonSchemaRefs.test.ts`
  - Ответственность: модульные тесты нейтрального registry и property ref behavior.
- Modify: `packages/core/metadata/orchestration/metadataItem/ruleFactory.test.ts`
  - Ответственность: тесты автоматической schema identity регистрации одиночного rules-объекта.
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts`
  - Ответственность: тесты явной collection schema регистрации, `record`/`array`, рекурсии.
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`
  - Ответственность: интеграционные проверки graph для реальных rules, включая `MetadataCatalogAttributes`.
- Review/Modify: `packages/core/metadata/commonObjects/schemaRegister.ts`
  - Ответственность: удалить ручные registrations, которые станут дубликатами стандартных metadata item/collection registrations.
- Review/Modify: `packages/core/metadata/forms/schemaRegister.ts`
  - Ответственность: оставить custom form registrations; удалить только дубликаты, если они покрыты стандартными registrations без изменения поведения.

---

### Task 1: Neutral Schema Identity Registry

**Files:**
- Modify: `packages/core/metadata/orchestration/jsonSchemaRefs.ts`
- Modify: `packages/core/metadata/orchestration/jsonSchemaRefs.test.ts`

**Interfaces:**
- Produces:
  - `type JSONSchemaExporter = (params: { context: ConfigurationContext }) => TSchema`
  - `registerJSONSchemaIdentity(params: { name: string; exporter: JSONSchemaExporter; source: object | string }): void`
  - `getJSONSchemaIdentityExporter(name: string): JSONSchemaExporter | undefined`
  - `listJSONSchemaIdentityNames(): string[]`
  - `clearJSONSchemaRefRegistries(): void` clears both property-ref factories and identity exporters.
- Consumes: existing `ConfigurationContext`, `TSchema`, `createSchemaRef`, `collectSchemaRefs`.

- [ ] **Step 1: Write failing tests for identity registration**

Add to `packages/core/metadata/orchestration/jsonSchemaRefs.test.ts`:

```ts
import { Type } from "typebox"
import {
  clearJSONSchemaRefRegistries,
  getJSONSchemaIdentityExporter,
  listJSONSchemaIdentityNames,
  registerJSONSchemaIdentity,
} from "./jsonSchemaRefs"
import { mockContext } from "../__fixtures__/context"

describe("JSON Schema identity registry", () => {
  beforeEach(() => {
    clearJSONSchemaRefRegistries()
  })

  it("registers and lists named schema exporters", () => {
    const source = { itemType: "SampleItem" }
    registerJSONSchemaIdentity({
      name: "SampleItem",
      source,
      exporter: () => Type.Object({ Имя: Type.String() }),
    })

    expect(listJSONSchemaIdentityNames()).toEqual(["SampleItem"])
    expect(getJSONSchemaIdentityExporter("SampleItem")?.({ context: mockContext })).toMatchObject({
      type: "object",
      properties: { Имя: { type: "string" } },
    })
  })

  it("allows idempotent registration for the same source", () => {
    const source = { itemType: "SampleItem" }
    const exporter = () => Type.Object({})

    registerJSONSchemaIdentity({ name: "SampleItem", source, exporter })
    registerJSONSchemaIdentity({ name: "SampleItem", source, exporter })

    expect(listJSONSchemaIdentityNames()).toEqual(["SampleItem"])
  })

  it("rejects the same schema name for different sources", () => {
    registerJSONSchemaIdentity({
      name: "DuplicateItem",
      source: { itemType: "Left" },
      exporter: () => Type.Object({ left: Type.String() }),
    })

    expect(() =>
      registerJSONSchemaIdentity({
        name: "DuplicateItem",
        source: { itemType: "Right" },
        exporter: () => Type.Object({ right: Type.String() }),
      })
    ).toThrow('JSON Schema "DuplicateItem" already registered')
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/jsonSchemaRefs.test.ts
```

Expected: FAIL because `registerJSONSchemaIdentity`, `getJSONSchemaIdentityExporter`, and `listJSONSchemaIdentityNames` are not exported yet.

- [ ] **Step 3: Implement minimal registry**

In `packages/core/metadata/orchestration/jsonSchemaRefs.ts`, add near the current `PropertyRefFactory` definitions:

```ts
type JSONSchemaExporter = (params: { context: ConfigurationContext }) => TSchema

interface JSONSchemaIdentityRegistration {
  exporter: JSONSchemaExporter
  source: object | string
}

const schemaIdentityExporters = new Map<string, JSONSchemaIdentityRegistration>()
```

Update `clearJSONSchemaRefRegistries`:

```ts
export function clearJSONSchemaRefRegistries(): void {
  propertyRefFactories.clear()
  schemaIdentityExporters.clear()
}
```

Add exported functions:

```ts
export function registerJSONSchemaIdentity(params: {
  name: string
  exporter: JSONSchemaExporter
  source: object | string
}): void {
  const existing = schemaIdentityExporters.get(params.name)
  if (existing !== undefined) {
    if (existing.source === params.source && existing.exporter === params.exporter) return
    throw new Error(`JSON Schema "${params.name}" already registered`)
  }

  schemaIdentityExporters.set(params.name, {
    exporter: params.exporter,
    source: params.source,
  })
}

export function getJSONSchemaIdentityExporter(name: string): JSONSchemaExporter | undefined {
  return schemaIdentityExporters.get(name)?.exporter
}

export function listJSONSchemaIdentityNames(): string[] {
  return [...schemaIdentityExporters.keys()].sort()
}
```

- [ ] **Step 4: Run task tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/jsonSchemaRefs.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/orchestration/jsonSchemaRefs.ts packages/core/metadata/orchestration/jsonSchemaRefs.test.ts
git commit -m "feat: :sparkles: добавить registry schema identity"
```

---

### Task 2: Metadata Item Registration Publishes Schema Identity

**Files:**
- Modify: `packages/core/metadata/orchestration/metadataItem/ruleFactory.ts`
- Create or Modify: `packages/core/metadata/orchestration/metadataItem/ruleFactory.test.ts`

**Interfaces:**
- Consumes:
  - `registerJSONSchemaIdentity(params)` from Task 1.
- Produces:
  - `registerMetadataItemRule({ propertyType, itemRule, schemaName? })`.
  - Default schema name is `itemRule.itemType`.

- [ ] **Step 1: Write failing tests**

Create `packages/core/metadata/orchestration/metadataItem/ruleFactory.test.ts` if missing, or append:

```ts
import { Type } from "typebox"
import { clearJSONSchemaRefRegistries, getJSONSchemaIdentityExporter } from "../jsonSchemaRefs"
import type { MetadataItemRule } from "../property/types"
import { registerMetadataItemRule } from "./ruleFactory"
import { mockContext } from "../../__fixtures__/context"

const SampleItemRule = {
  itemType: "SampleItem",
  properties: {
    name: { yaml: "Имя", type: "string", required: true },
  },
} as const satisfies MetadataItemRule

describe("registerMetadataItemRule JSON Schema identity", () => {
  beforeEach(() => {
    clearJSONSchemaRefRegistries()
  })

  it("registers item schema by itemType by default", () => {
    registerMetadataItemRule({ propertyType: "SampleItemProperty", itemRule: SampleItemRule })

    const exporter = getJSONSchemaIdentityExporter("SampleItem")
    expect(exporter?.({ context: mockContext })).toMatchObject({
      type: "object",
      properties: { Имя: { type: "string" } },
      required: ["Имя"],
    })
  })

  it("uses explicit schemaName when provided", () => {
    registerMetadataItemRule({
      propertyType: "SampleItemProperty",
      itemRule: SampleItemRule,
      schemaName: "ExplicitSampleItem",
    })

    expect(getJSONSchemaIdentityExporter("SampleItem")).toBeUndefined()
    expect(getJSONSchemaIdentityExporter("ExplicitSampleItem")?.({ context: mockContext })).toMatchObject({
      type: "object",
    })
  })
})
```

If TypeScript complains that `Type` is unused, remove the import.

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/metadataItem/ruleFactory.test.ts
```

Expected: FAIL because `schemaName` is not accepted and no schema identity is registered.

- [ ] **Step 3: Extend registration params**

In `packages/core/metadata/orchestration/metadataItem/ruleFactory.ts`, change:

```ts
type MetadataItemRuleParams<Rule extends MetadataItemRule, PropertyType extends PropertyRuleType> = {
  propertyType: PropertyType
  itemRule: Rule
}
```

to:

```ts
type MetadataItemRuleParams<Rule extends MetadataItemRule, PropertyType extends PropertyRuleType> = {
  propertyType: PropertyType
  itemRule: Rule
  schemaName?: string
}
```

- [ ] **Step 4: Register schema identity**

Import `registerJSONSchemaIdentity` from `../jsonSchemaRefs` and add inside `registerMetadataItemRule` after destructuring:

```ts
const schemaName = params.schemaName ?? itemRule.itemType

registerJSONSchemaIdentity({
  name: schemaName,
  source: itemRule,
  exporter: ({ context }) => exportMetadataItemToJSONSchema({ context, rule: itemRule }),
})
```

Keep the existing `registerTypeRule(propertyType, "exportToJSONSchema", ...)` behavior unchanged for inline fallback.

- [ ] **Step 5: Run task tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/metadataItem/ruleFactory.test.ts packages/core/metadata/orchestration/jsonSchemaRefs.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/orchestration/metadataItem/ruleFactory.ts packages/core/metadata/orchestration/metadataItem/ruleFactory.test.ts
git commit -m "feat: :sparkles: регистрировать schema identity metadata item"
```

---

### Task 3: Metadata Collection Registration Publishes Explicit Ref Shape

**Files:**
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts`
- Modify: `packages/core/metadata/orchestration/jsonSchemaRefs.ts`

**Interfaces:**
- Consumes:
  - `registerJSONSchemaIdentity`
  - `registerJSONSchemaPropertyRef`
  - `schemaRef`
  - existing `recordOfSchemaRef`
- Produces:
  - `type JSONSchemaCollectionShape = "record" | "array"`
  - `registerMetadataItemCollectionRule({ ..., schemaName?, schemaShape? })`
  - collection property ref is registered only through explicit collection registration.

- [ ] **Step 1: Write failing tests for record and array refs**

Append to `packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts`:

```ts
import { createJSONSchemaExportContext, clearJSONSchemaRefRegistries } from "../jsonSchemaRefs"
import { exportPropertyToJSONSchema } from "../property/toJSONSchema"
import { mockContext } from "../../__fixtures__/context"

const CollectionItemRule = {
  itemType: "CollectionItem",
  properties: {
    name: { yaml: "Имя", type: "string", required: true },
  },
} as const

describe("registerMetadataItemCollectionRule JSON Schema refs", () => {
  beforeEach(() => {
    clearJSONSchemaRefRegistries()
  })

  it("registers record ref schema for metadata collections by default", () => {
    registerMetadataItemCollectionRule({
      propertyType: "CollectionItems",
      itemRule: CollectionItemRule as any,
      xmlElement: "Item",
    })

    const schema = exportPropertyToJSONSchema({
      context: createJSONSchemaExportContext(mockContext, "externalRefs"),
      rule: { type: "CollectionItems" },
      value: undefined,
    })

    expect(schema).toEqual({
      type: "object",
      additionalProperties: { $ref: "nkdk://schema/CollectionItem" },
    })
  })

  it("registers array ref schema when yamlAsArray is true", () => {
    registerMetadataItemCollectionRule({
      propertyType: "CollectionItemsArray",
      itemRule: CollectionItemRule as any,
      xmlElement: "Item",
      yamlAsArray: true,
    })

    const schema = exportPropertyToJSONSchema({
      context: createJSONSchemaExportContext(mockContext, "externalRefs"),
      rule: { type: "CollectionItemsArray" },
      value: undefined,
    })

    expect(schema).toEqual({
      type: "array",
      items: { $ref: "nkdk://schema/CollectionItem" },
    })
  })

  it("uses explicit schemaName for collection item refs", () => {
    registerMetadataItemCollectionRule({
      propertyType: "ExplicitCollectionItems",
      itemRule: CollectionItemRule as any,
      xmlElement: "Item",
      schemaName: "ExplicitCollectionItem",
    })

    const schema = exportPropertyToJSONSchema({
      context: createJSONSchemaExportContext(mockContext, "externalRefs"),
      rule: { type: "ExplicitCollectionItems" },
      value: undefined,
    })

    expect(schema).toEqual({
      type: "object",
      additionalProperties: { $ref: "nkdk://schema/ExplicitCollectionItem" },
    })
  })
})
```

If the file already imports the same helpers, merge imports instead of duplicating them. Keep the `as any` in tests only if the existing test fixtures use it; otherwise type the fixture as `MetadataItemRule`.

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts
```

Expected: FAIL because collection registration does not publish property refs yet.

- [ ] **Step 3: Add array ref helper**

In `packages/core/metadata/orchestration/jsonSchemaRefs.ts`, add:

```ts
export function arrayOfSchemaRef(name: string): TSchema {
  return rawJSONSchema({
    type: "array",
    items: schemaRef(name),
  })
}
```

- [ ] **Step 4: Extend collection params**

In `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`, extend params type:

```ts
type JSONSchemaCollectionShape = "record" | "array"

type MetadataItemCollectionRuleParams<Rule extends MetadataItemRule, PropertyType extends PropertyRuleType> = {
  propertyType: PropertyType
  itemRule: Rule
  xmlElement?: string
  keyField?: string
  yamlAsArray?: true
  collectionItemRule?: true
  schemaName?: string
  schemaShape?: JSONSchemaCollectionShape
  // keep all existing params
}
```

Do not remove existing fields; add only `schemaName` and `schemaShape`.

- [ ] **Step 5: Register collection item schema and property ref**

Import `arrayOfSchemaRef`, `recordOfSchemaRef`, `registerJSONSchemaIdentity`, and `registerJSONSchemaPropertyRef`. Inside `registerMetadataItemCollectionRule`, after `const { propertyType, itemRule } = params`, add:

```ts
const schemaName = params.schemaName ?? itemRule.itemType

registerJSONSchemaIdentity({
  name: schemaName,
  source: itemRule,
  exporter: ({ context }) => exportMetadataItemToJSONSchema({ context, rule: itemRule }),
})

registerJSONSchemaPropertyRef(propertyType, () => {
  const shape = params.schemaShape ?? (params.yamlAsArray ? "array" : "record")
  return shape === "array" ? arrayOfSchemaRef(schemaName) : recordOfSchemaRef(schemaName)
})
```

Keep the existing inline `toJSONSchemaDefault` unchanged so inline mode still works.

- [ ] **Step 6: Run task tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts packages/core/metadata/orchestration/jsonSchemaRefs.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/orchestration/jsonSchemaRefs.ts packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts
git commit -m "feat: :sparkles: регистрировать ref-схемы коллекций"
```

---

### Task 4: Project Schema Registry Reads Neutral Identity Exporters

**Files:**
- Modify: `packages/core/metadata/project/schemaRegistry.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`
- Modify: `packages/core/metadata/project/schemaRegistry.test.ts`

**Interfaces:**
- Consumes:
  - `getJSONSchemaIdentityExporter(name)`
  - `listJSONSchemaIdentityNames()`
- Produces:
  - `exportJSONSchemaForSchemaName` can resolve names registered through standard metadata item/collection registrations.
  - `listJSONSchemaNames()` includes both project-local and neutral names.

- [ ] **Step 1: Write failing project registry test**

Append to `packages/core/metadata/project/schemaRegistry.test.ts`:

```ts
import { Type } from "typebox"
import { clearJSONSchemaRefRegistries, registerJSONSchemaIdentity } from "../orchestration/jsonSchemaRefs"
import { exportJSONSchemaForSchemaName, listJSONSchemaNames } from "./schemaRegistry"
import { mockContext } from "../__fixtures__/context"

describe("project schema registry neutral identities", () => {
  beforeEach(() => {
    clearJSONSchemaRefRegistries()
  })

  it("exports schemas registered through orchestration identity registry", () => {
    registerJSONSchemaIdentity({
      name: "NeutralSchema",
      source: "test",
      exporter: () => Type.Object({ Имя: Type.String() }),
    })

    expect(listJSONSchemaNames()).toContain("NeutralSchema")
    expect(exportJSONSchemaForSchemaName({ context: mockContext, name: "NeutralSchema" })).toMatchObject({
      type: "object",
      properties: { Имя: { type: "string" } },
    })
  })
})
```

Merge imports if the file already has `Type`, `mockContext`, or registry imports.

- [ ] **Step 2: Write failing integration test for real collection refs**

Append to `packages/core/metadata/validation/schemaRegistry.test.ts`:

```ts
it("resolves MetadataCatalogAttributes through collection registration", () => {
  const graph = exportJSONSchemaGraph({
    context,
    roots: [{ key: "catalog", name: "MetadataCatalog" }],
  })

  const catalog = graph.roots.catalog as { properties?: Record<string, unknown> }
  expect(catalog.properties?.Реквизиты).toEqual({
    type: "object",
    additionalProperties: { $ref: "nkdk://schema/MetadataCatalogAttribute" },
  })
  expect(graph.schemas["nkdk://schema/MetadataCatalogAttribute"]).toMatchObject({
    $id: "nkdk://schema/MetadataCatalogAttribute",
    type: "object",
  })
})
```

Use the existing `context` setup in that test file; do not create a second context if one already exists.

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project/schemaRegistry.test.ts packages/core/metadata/validation/schemaRegistry.test.ts
```

Expected: FAIL until project registry consults neutral identity exporters. The integration test may already pass because of old manual registrations; if it passes, keep it as a regression guard for the later cleanup task.

- [ ] **Step 4: Add exporter resolution helper**

In `packages/core/metadata/project/schemaRegistry.ts`, import:

```ts
import {
  getJSONSchemaIdentityExporter,
  listJSONSchemaIdentityNames,
  // keep existing imports
} from "../orchestration/jsonSchemaRefs"
```

Add helper:

```ts
function getSchemaExporter(name: string): SchemaExporter | undefined {
  return schemaExporters.get(name) ?? getJSONSchemaIdentityExporter(name)
}
```

- [ ] **Step 5: Use helper in export path**

Change:

```ts
const exporter = schemaExporters.get(name)
```

to:

```ts
const exporter = getSchemaExporter(name)
```

Change `listJSONSchemaNames`:

```ts
export function listJSONSchemaNames(): string[] {
  ensureJSONSchemaRegistry()
  return [...new Set([...schemaExporters.keys(), ...listJSONSchemaIdentityNames()])].sort()
}
```

Do not import concrete rules into `project/schemaRegistry.ts`.

- [ ] **Step 6: Run task tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project/schemaRegistry.test.ts packages/core/metadata/validation/schemaRegistry.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/project/schemaRegistry.ts packages/core/metadata/project/schemaRegistry.test.ts packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "feat: :sparkles: читать schema identity из orchestration"
```

---

### Task 5: Replace Duplicate Manual Property Ref Registrations

**Files:**
- Modify: `packages/core/metadata/commonObjects/schemaRegister.ts`
- Modify: `packages/core/metadata/forms/schemaRegister.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`

**Interfaces:**
- Consumes:
  - standard registrations from Tasks 2-4.
- Produces:
  - manual property-ref registrations remain only where they describe custom schema exporters or discriminated unions.

- [ ] **Step 1: Add regression tests before deleting registrations**

In `packages/core/metadata/validation/schemaRegistry.test.ts`, ensure these cases exist or add them:

```ts
it("keeps form child items as discriminated external refs", () => {
  const graph = exportJSONSchemaGraph({
    context,
    roots: [{ key: "form", name: "ClientApplicationForm", includeNestedChildItems: true }],
  })

  const formJson = JSON.stringify(graph.roots.form)
  expect(formJson).toContain("nkdk://schema/InputField")
  expect(formJson).toContain("nkdk://schema/Table")
  expect(graph.schemas["nkdk://schema/InputField"]).toMatchObject({
    $id: "nkdk://schema/InputField",
  })
})

it("keeps custom DCS parameter value refs", () => {
  const graph = exportJSONSchemaGraph({
    context,
    roots: [{ key: "form", name: "FormAttribute", includeNestedChildItems: true }],
  })

  expect(JSON.stringify(graph)).toContain("nkdk://schema/")
})
```

If the second test is too broad after inspecting current tests, replace it with an existing DCS-specific schema name from `dcsMetadataValue/toJSONSchema.ts` or `parameterValue/toJSONSchema.ts`.

- [ ] **Step 2: Run regression tests before cleanup**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/schemaRegistry.test.ts
```

Expected: PASS before cleanup.

- [ ] **Step 3: Remove duplicated common object registrations**

In `packages/core/metadata/commonObjects/schemaRegister.ts`, remove manual registrations that are now created by `registerMetadataItemCollectionRule`, starting with:

```ts
registerProjectJSONSchemaPropertyRef("MetadataCatalogAttributes", "MetadataCatalogAttribute")
registerProjectJSONSchemaPropertyRef("MetadataDocumentAttributes", "MetadataDocumentAttribute")
registerProjectJSONSchemaPropertyRef("MetadataAttributes", "MetadataAttribute")
registerProjectJSONSchemaPropertyRef("MetadataRegisterAttributes", "MetadataRegisterAttribute")
registerProjectJSONSchemaPropertyRef("MetadataReportAttributes", "MetadataAttribute")
registerProjectJSONSchemaPropertyRef("MetadataTaskAddressingAttributes", "MetadataTaskAddressingAttribute")
registerProjectJSONSchemaPropertyRefFactory("MetadataTabularSectionAttributes", () =>
  recordOfSchemaRef("MetadataTabularSectionAttribute")
)
registerProjectJSONSchemaPropertyRefFactory("MetadataCommands", () => recordOfSchemaRef("MetadataCommand"))
```

Keep `registerProjectJSONSchema(...)` calls temporarily if they still provide custom exporters or if the corresponding rules are not registered through `registerMetadataItemRule`.

- [ ] **Step 4: Review forms registrations conservatively**

In `packages/core/metadata/forms/schemaRegister.ts`, keep these custom/manual registrations:

```ts
registerProjectJSONSchemaPropertyRefFactory("ClientApplicationForm", () => schemaRef("ClientApplicationForm"))
registerProjectJSONSchemaPropertyRefFactory("FormAttributes", () => recordOfSchemaRef("FormAttribute"))
registerProjectJSONSchemaPropertyRefFactory("FormAttributeColumns", () => recordOfSchemaRef("FormAttributeColumn"))
registerProjectJSONSchemaPropertyRefFactory("FormCommands", () => recordOfSchemaRef("FormCommand"))
registerProjectJSONSchemaPropertyRefFactory("FormParameters", () => recordOfSchemaRef("FormParameter"))
```

Keep form element discriminated refs:

```ts
registerProjectJSONSchemaPropertyRefFactory(type, () =>
  recordOfDiscriminatedOneOfSchemaRefs(getChildItemTypesByPropertyType(type), "Вид")
)
```

Only delete a forms registration if a test proves the standard metadata item/collection registration now produces the same schema.

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/schemaRegistry.test.ts packages/core/metadata/validation/projectFileSchema.test.ts packages/core/metadata/orchestration/jsonSchemaRefs.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/schemaRegister.ts packages/core/metadata/forms/schemaRegister.ts packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "refactor: :recycle: убрать дубли ref-регистраций схем"
```

---

### Task 6: Standalone Validation Graph Verification

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationStandaloneBuild.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationStandaloneSchemas.ts`

**Interfaces:**
- Consumes:
  - `createProjectValidationStandaloneSchemaSet`
  - graph refs from Tasks 1-5.
- Produces:
  - standalone schema set keeps reachable refs from automatic collection registrations.

- [ ] **Step 1: Add standalone schema-set regression test**

Append to `packages/core/metadata/validation/projectValidationStandaloneBuild.test.ts` or the closest existing standalone schema test:

```ts
import { createProjectValidationStandaloneSchemaSet } from "./projectValidationStandaloneSchemas"

it("includes refs produced by metadata collection registrations", () => {
  const schemaSet = createProjectValidationStandaloneSchemaSet()

  expect(schemaSet.refs["nkdk://schema/MetadataCatalogAttribute"]).toMatchObject({
    type: "object",
  })
  expect(JSON.stringify(schemaSet.byProjectDir["Справочник"])).toContain(
    "nkdk://schema/MetadataCatalogAttribute"
  )
})
```

If `projectValidationStandaloneBuild.test.ts` already imports the schema set, merge the import.

- [ ] **Step 2: Run standalone tests to verify behavior**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectValidationStandaloneBuild.test.ts packages/core/metadata/validation/projectValidationStandaloneLoader.test.ts
```

Expected: PASS. If it fails because refs are stripped, inspect `stripExternalRefsForValidation` and `collectExternalRefSchemas`.

- [ ] **Step 3: Confirm reachable refs are preserved**

Inspect `createStandalonePropertiesSchema` and keep root schemas with `$ref`, replacing only explicitly external validation properties:

```ts
const rootSchema = stripCollectedSchemaRefs(spec.exportSchema({ context, mode: "externalRefs" }))
return replaceExternalValidationProperties(rootSchema, spec.externalValidationProperties)
```

This is the required shape; do not call `stripExternalRefsForValidation` for properties schemas.

- [ ] **Step 4: Run standalone generator test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectValidationStandaloneBuild.test.ts
```

Expected: PASS and generated standalone module shape still matches `project-validation-ajv-standalone-v1`.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/validation/projectValidationStandaloneBuild.test.ts packages/core/metadata/validation/projectValidationStandaloneSchemas.ts
git commit -m "test: :white_check_mark: закрепить refs standalone validation"
```

---

### Task 7: Full Verification and Boundary Guards

**Files:**
- Review/Modify: `packages/core/metadata/importBoundaries.test.ts`
- No production changes unless a boundary regression is found.

**Interfaces:**
- Consumes all previous tasks.
- Produces a fully verified branch.

- [ ] **Step 1: Run focused validation and boundary tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/importBoundaries.test.ts packages/core/metadata/validation/schemaRegistry.test.ts packages/core/metadata/validation/projectValidationStandaloneBuild.test.ts
```

Expected: PASS.

- [ ] **Step 2: If boundary test misses the new rule, add a guard**

Only if `importBoundaries.test.ts` does not already protect this, add an assertion that `metadata/project/schemaRegistry.ts` does not import concrete applied/common/form rules:

```ts
it("project schema registry не импортирует concrete metadata rules", () => {
  const source = readFileSync(join(METADATA_DIR, "project", "schemaRegistry.ts"), "utf-8")

  expect(source).not.toContain("../appliedObjects/")
  expect(source).not.toContain("../commonObjects/")
  expect(source).not.toContain("../forms/")
})
```

If similar checks already exist, update the existing test instead of adding a duplicate.

- [ ] **Step 3: Run full project tests**

Run from the worktree root:

```bash
pnpm test
```

Expected:

```text
packages/core test:  Test Files  765+ passed
packages/mcp test:   Test Files  13 passed
packages/cli test:   Test Files  7 passed
```

Exact test counts may increase because this plan adds tests. There must be 0 failures.

- [ ] **Step 4: Check working tree**

Run:

```bash
git status --short
```

Expected: no unstaged changes except intentionally modified files before the final commit.

- [ ] **Step 5: Final commit if boundary/full-verification files changed**

If Task 7 changed files:

```bash
git add packages/core/metadata/importBoundaries.test.ts
git commit -m "test: :white_check_mark: закрепить границы schema registry"
```

If Task 7 changed nothing, do not create an empty commit.

---

## Self-Review Checklist

- Spec coverage:
  - Standard metadata item registration: Task 2.
  - Explicit collection registration: Task 3.
  - Project/validation graph reads neutral registry: Task 4.
  - Manual duplicate cleanup: Task 5.
  - Standalone validation refs: Task 6.
  - Boundary and full verification: Task 7.
- No placeholders: every task has concrete files, commands, expected result, and commit step.
- Type consistency:
  - `schemaName` is used consistently in item and collection registrations.
  - `registerJSONSchemaIdentity` has one signature across all tasks.
  - `JSONSchemaExporter` always receives `{ context: ConfigurationContext }`.
  - Collection `record` uses `additionalProperties`, `array` uses `items`.
