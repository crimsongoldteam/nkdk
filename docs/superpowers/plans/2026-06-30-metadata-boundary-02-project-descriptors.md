# Metadata Project Descriptor Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести `packages/core/metadata/project` с предметных списков объектов, schemas, папок и ресурсов на регистрации рядом с metadata/rules-объектами.

**Architecture:** `metadata/project` хранит нейтральные registry APIs и алгоритмы обхода descriptors. Конкретные объекты регистрируют project spec, JSON Schema exporter, property refs и project resources в своём `register.ts`; `specs.ts`, `schemaRegistry.ts`, `resources.ts`, `directoryStructure.ts` и `syncStateFiles.ts` читают только descriptors.

**Tech Stack:** TypeScript 5.9, Vitest, TypeBox, pnpm, existing `MetadataItemRule`, `ProjectResourceDescriptor`, `XmlSyncRoute`, existing `ruleResources.ts`.

---

## Scope Check

Этот план покрывает пункт 2 спеки: предметная сборка структуры проекта в `metadata/project`. Он не меняет `orchestration/appliedObject`, metadata-target и dataPath logic, кроме использования уже существующих `projectResources`/`xmlSyncRoutes` операций property-type registry.

## File Structure

- Create: `packages/core/metadata/project/projectSpecRegistry.ts`
  - Runtime registry for project specs, schema exporters and property schema refs.
- Modify: `packages/core/metadata/project/specs.ts`
  - Build `metadataProjectSpecs` from registered specs, not hard-coded overrides.
- Modify: `packages/core/metadata/project/schemaRegistry.ts`
  - Export `registerProjectJSONSchema`, `registerProjectJSONSchemaPropertyRef`, and read registered entries.
- Modify: `packages/core/metadata/project/ruleResources.ts`
  - Keep descriptor derivation from rules and add helper functions for directory/resource consumers.
- Modify: `packages/core/metadata/project/resources.ts`
  - Classify/discover YAML resources by project descriptors.
- Modify: `packages/core/metadata/project/directoryStructure.ts`
  - Render structure nodes from project descriptors instead of hard-coded `Формы`/`Подсистемы`.
- Modify: `packages/core/metadata/project/syncStateFiles.ts`
  - Compile matchers from project descriptors and `describeMetadataRuleProjectResources`.
- Modify: `packages/core/metadata/appliedObjects/configuration/register.ts`
  - Register configuration project spec and schema.
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/register.ts`
  - Register catalog project spec and schema/export/import overrides.
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/register.ts`
  - Register document project spec and schema/export override.
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/register.ts`
  - Register enumeration project spec and schema/export/import overrides.
- Modify/create: `register.ts` files for all schema names currently listed in `schemaRegistry.ts`.
  - Move named schema registrations and property schema refs out of `schemaRegistry.ts`.
- Test: `packages/core/metadata/project/projectSpecRegistry.test.ts`
- Test: `packages/core/metadata/project/schemaRegistry.test.ts`
- Test: `packages/core/metadata/project/resources.test.ts`
- Test: `packages/core/metadata/project/directoryStructure.test.ts`
- Test: `packages/core/metadata/project/syncStateFiles.test.ts`
- Test: `packages/core/metadata/importBoundaries.test.ts`

## Task 0: Preflight

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `docs/superpowers/specs/2026-06-28-metadata-layer-boundary-violations-spec.md`
- Read: `packages/core/metadata/project/ruleResources.ts`

- [ ] **Step 1: Check metadata knowledge**

Run:

```bash
test -f .agents/knowledge/metadata/INDEX.md && sed -n '1,260p' .agents/knowledge/metadata/INDEX.md || echo "metadata knowledge index is missing"
```

Expected: the file is read, or the command prints `metadata knowledge index is missing`.

- [ ] **Step 2: Read project section of the spec**

Run:

```bash
sed -n '120,230p' docs/superpowers/specs/2026-06-28-metadata-layer-boundary-violations-spec.md
```

Expected: output includes `Предметная сборка структуры проекта в metadata/project`.

## Task 1: Add Project Spec Registry

**Files:**
- Create: `packages/core/metadata/project/projectSpecRegistry.ts`
- Test: `packages/core/metadata/project/projectSpecRegistry.test.ts`

- [ ] **Step 1: Write registry tests**

Create `packages/core/metadata/project/projectSpecRegistry.test.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { beforeEach, describe, expect, it } from "vitest"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import {
  clearProjectSpecRegistryForTests,
  getRegisteredProjectSpecs,
  registerProjectSpec,
} from "./projectSpecRegistry"

const SampleRule = {
  itemType: "SampleItem",
  itemTypePrefix: "Образец",
  xmlDir: "Samples",
  properties: {},
} as const satisfies MetadataItemRule

describe("projectSpecRegistry", () => {
  beforeEach(() => clearProjectSpecRegistryForTests())

  it("registers specs by dir and replaces duplicate registration predictably", () => {
    registerProjectSpec({
      dir: "Образец",
      kind: "sample",
      rule: SampleRule,
      exportSchema: () => Type.Object({ first: Type.String() }),
      importModel: ({ name }) => ({ itemType: "SampleItem", name }) as never,
    })
    registerProjectSpec({
      dir: "Образец",
      kind: "sample2",
      rule: SampleRule,
      exportSchema: () => Type.Object({ second: Type.String() }),
      importModel: ({ name }) => ({ itemType: "SampleItem", name }) as never,
    })

    expect(getRegisteredProjectSpecs()).toHaveLength(1)
    expect(getRegisteredProjectSpecs()[0]).toMatchObject({
      dir: "Образец",
      kind: "sample2",
      rule: SampleRule,
    })
  })
})
```

- [ ] **Step 2: Run test and confirm it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project/projectSpecRegistry.test.ts --no-isolate
```

Expected: FAIL because `projectSpecRegistry.ts` does not exist.

- [ ] **Step 3: Implement registry**

Create `packages/core/metadata/project/projectSpecRegistry.ts`:

```ts
import type { TSchema } from "@sinclair/typebox"
import type { ConfigurationContext, JSONSchemaExportMode } from "~/metadata/context/types"
import type { MetadataItem, MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"

export interface RegisteredProjectSpec {
  dir: string
  kind: string
  rule: MetadataItemRule
  exportSchema: (params: { context: ConfigurationContext; mode?: JSONSchemaExportMode }) => TSchema
  importModel: (params: { context: ConfigurationContext; parsed: ParsedYaml; name: string }) => MetadataItem | undefined
  nesting?: ProjectSpecNesting
}

export type ProjectSpecNesting =
  | {
      kind: "recursiveChildDir"
      childDir: string
      itemRole: string
      collectionRole: string
    }

const specsByDir = new Map<string, RegisteredProjectSpec>()

export function registerProjectSpec(spec: RegisteredProjectSpec): void {
  specsByDir.set(spec.dir, spec)
}

export function getRegisteredProjectSpecs(): readonly RegisteredProjectSpec[] {
  return [...specsByDir.values()].sort((left, right) => left.dir.localeCompare(right.dir, "ru"))
}

export function getRegisteredProjectSpecByDir(dir: string): RegisteredProjectSpec | undefined {
  return specsByDir.get(dir)
}

export function clearProjectSpecRegistryForTests(): void {
  specsByDir.clear()
}
```

- [ ] **Step 4: Run registry test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project/projectSpecRegistry.test.ts --no-isolate
```

Expected: PASS.

## Task 2: Register Project Specs from Objects

**Files:**
- Modify: `packages/core/metadata/project/specs.ts`
- Modify/create: `packages/core/metadata/appliedObjects/configuration/register.ts`
- Modify/create: `packages/core/metadata/appliedObjects/metadataCatalog/register.ts`
- Modify/create: `packages/core/metadata/appliedObjects/metadataDocument/register.ts`
- Modify/create: `packages/core/metadata/appliedObjects/metadataEnumeration/register.ts`
- Test: `packages/core/metadata/project/specs.test.ts`

- [ ] **Step 1: Add failing specs test**

Create or extend `packages/core/metadata/project/specs.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import "~/metadata/register"
import { configurationMetadataProjectSpec, getMetadataProjectSpecByDir, metadataProjectSpecs } from "./specs"

describe("metadata project specs", () => {
  it("comes from object registrations, including custom import/export specs", () => {
    expect(configurationMetadataProjectSpec.kind).toBe("configuration")
    expect(configurationMetadataProjectSpec.dir).toBe("")

    expect(getMetadataProjectSpecByDir("Справочник")).toMatchObject({ kind: "catalog", dir: "Справочник" })
    expect(getMetadataProjectSpecByDir("Документ")).toMatchObject({ kind: "document", dir: "Документ" })
    expect(getMetadataProjectSpecByDir("Перечисление")).toMatchObject({ kind: "enumeration", dir: "Перечисление" })

    expect(metadataProjectSpecs.map((spec) => spec.dir)).toEqual(expect.arrayContaining(["Справочник", "Документ", "Перечисление"]))
  })
})
```

- [ ] **Step 2: Export compatibility helpers from `specs.ts`**

Replace the hard-coded override map in `packages/core/metadata/project/specs.ts` with registry-backed exports:

```ts
import "~/metadata/register"
import { Type, type TSchema } from "@sinclair/typebox"
import type { ConfigurationContext, JSONSchemaExportMode } from "~/metadata/context/types"
import {
  attachCollectedSchemaRefs,
  createJSONSchemaExportContext,
} from "~/metadata/orchestration/jsonSchemaRefs"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import type { MetadataItem, MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import { ensureJSONSchemaRegistry } from "./schemaRegistry"
import { getRegisteredProjectSpecByDir, getRegisteredProjectSpecs, type RegisteredProjectSpec } from "./projectSpecRegistry"

export type MetadataProjectSpec = RegisteredProjectSpec

export const metadataProjectSpecs: readonly MetadataProjectSpec[] = getRegisteredProjectSpecs().filter((spec) => spec.dir !== "")

export const configurationMetadataProjectSpec: MetadataProjectSpec =
  getRegisteredProjectSpecByDir("") ?? {
    kind: "configuration",
    dir: "",
    rule: { itemType: "MetadataConfiguration", properties: {} } as MetadataItemRule,
    exportSchema: () => Type.Object({}),
    importModel: () => undefined,
  }

export const metadataProjectSpecByDir = new Map(metadataProjectSpecs.map((spec) => [spec.dir, spec]))

export function getMetadataProjectSpecByDir(dir: string): MetadataProjectSpec | undefined {
  return getRegisteredProjectSpecByDir(dir)
}

export function createMetadataItemProjectSchemaExporter(rule: MetadataItemRule): MetadataProjectSpec["exportSchema"] {
  return createProjectSchemaExporter(({ context }) => exportMetadataItemToJSONSchema({ context, rule }))
}

export function createProjectSchemaExporter(
  exporter: (params: { context: ConfigurationContext }) => TSchema
): MetadataProjectSpec["exportSchema"] {
  return ({ context, mode = "externalRefs" }) => {
    ensureJSONSchemaRegistry()
    const schemaContext = createJSONSchemaExportContext(context, mode)
    const schema = exporter({ context: schemaContext })
    return mode === "externalRefs" ? attachCollectedSchemaRefs(schemaContext, schema) : schema
  }
}

export function createGenericProjectImportModel(rule: MetadataItemRule): MetadataProjectSpec["importModel"] {
  return ({ context, parsed, name }) => {
    const model: unknown = importMetadataItemFromYAML({ context, yaml: parsed.data, rule, name })
    return isMetadataItem(model) ? model : undefined
  }
}

function isMetadataItem(value: unknown): value is MetadataItem {
  return typeof value === "object" && value !== null && "itemType" in value
}
```

- [ ] **Step 3: Register configuration project spec**

In `packages/core/metadata/appliedObjects/configuration/register.ts`, add:

```ts
import {
  createGenericProjectImportModel,
  createMetadataItemProjectSchemaExporter,
} from "~/metadata/project/specs"
import { registerProjectSpec } from "~/metadata/project/projectSpecRegistry"
import { MetadataConfigurationRules } from "./rules"

registerProjectSpec({
  kind: "configuration",
  dir: "",
  rule: MetadataConfigurationRules,
  exportSchema: createMetadataItemProjectSchemaExporter(MetadataConfigurationRules),
  importModel: createGenericProjectImportModel(MetadataConfigurationRules),
})
```

- [ ] **Step 4: Register catalog/document/enumeration project specs**

Add these calls to the existing object `register.ts` files, preserving their existing `registerMetadataItemRule(...)` calls.

`packages/core/metadata/appliedObjects/metadataCatalog/register.ts`:

```ts
import {
  createGenericProjectImportModel,
  createProjectSchemaExporter,
} from "~/metadata/project/specs"
import { registerProjectSpec } from "~/metadata/project/projectSpecRegistry"
import { importMetadataCatalogFromYAML } from "./fromYAML"
import { MetadataCatalogRules } from "./rules"
import { exportMetadataCatalogToJSONSchema } from "./toJSONSchema"

registerProjectSpec({
  kind: "catalog",
  dir: "Справочник",
  rule: MetadataCatalogRules,
  exportSchema: createProjectSchemaExporter(({ context }) => exportMetadataCatalogToJSONSchema({ context })),
  importModel: ({ context, parsed, name }) => importMetadataCatalogFromYAML(context, parsed.data, name),
})
```

`packages/core/metadata/appliedObjects/metadataDocument/register.ts`:

```ts
import { createProjectSchemaExporter, createGenericProjectImportModel } from "~/metadata/project/specs"
import { registerProjectSpec } from "~/metadata/project/projectSpecRegistry"
import { MetadataDocumentRules } from "./rules"
import { exportMetadataDocumentToJSONSchema } from "./toJSONSchema"

registerProjectSpec({
  kind: "document",
  dir: "Документ",
  rule: MetadataDocumentRules,
  exportSchema: createProjectSchemaExporter(({ context }) => exportMetadataDocumentToJSONSchema({ context })),
  importModel: createGenericProjectImportModel(MetadataDocumentRules),
})
```

`packages/core/metadata/appliedObjects/metadataEnumeration/register.ts`:

```ts
import { createProjectSchemaExporter } from "~/metadata/project/specs"
import { registerProjectSpec } from "~/metadata/project/projectSpecRegistry"
import { importMetadataEnumerationFromYAML } from "./fromYAML"
import { MetadataEnumerationRules } from "./rules"
import { exportMetadataEnumerationToJSONSchema } from "./toJSONSchema"

registerProjectSpec({
  kind: "enumeration",
  dir: "Перечисление",
  rule: MetadataEnumerationRules,
  exportSchema: createProjectSchemaExporter(({ context }) => exportMetadataEnumerationToJSONSchema({ context })),
  importModel: ({ context, parsed, name }) => importMetadataEnumerationFromYAML(context, parsed.data, name),
})
```

- [ ] **Step 5: Run specs tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project/specs.test.ts --no-isolate
```

Expected: PASS.

## Task 3: Move JSON Schema Registry Entries to Registrations

**Files:**
- Modify: `packages/core/metadata/project/schemaRegistry.ts`
- Modify/create: object/common/form `register.ts` files named below
- Test: `packages/core/metadata/project/schemaRegistry.test.ts`

- [ ] **Step 1: Add public registration API in `schemaRegistry.ts`**

In `packages/core/metadata/project/schemaRegistry.ts`, export these functions and use them from `ensureJSONSchemaRegistry()`:

```ts
export function registerProjectJSONSchema(name: string, exporter: SchemaExporter): void {
  schemaExporters.set(name, exporter)
}

export function registerProjectJSONSchemaPropertyRef(type: PropertyRuleType, schemaName: string): void {
  registerJSONSchemaPropertyRef(type, () => recordOfSchemaRef(schemaName))
}

export function registerProjectJSONSchemaPropertyRefFactory(
  type: PropertyRuleType,
  factory: () => ReturnType<typeof recordOfSchemaRef> | ReturnType<typeof recordOfOneOfSchemaRefs>
): void {
  registerJSONSchemaPropertyRef(type, factory)
}
```

Keep `ensureJSONSchemaRegistry()` idempotent:

```ts
export function ensureJSONSchemaRegistry(): void {
  if (!namedSchemasInitialized) {
    registerCoreMetadata()
    namedSchemasInitialized = true
  }
}
```

Add this import at the top of `schemaRegistry.ts`:

```ts
import { registerCoreMetadata } from "~/metadata/register"
```

This keeps schema initialization synchronous and idempotent.

- [ ] **Step 2: Move named schema registrations**

Add `registerProjectJSONSchema(...)` calls to the `register.ts` files owning these rules:

```ts
registerProjectJSONSchema("MetadataCatalog", ({ context }) => exportMetadataCatalogToJSONSchema({ context }))
registerProjectJSONSchema("MetadataDocument", ({ context }) => exportMetadataDocumentToJSONSchema({ context }))
registerProjectJSONSchema("MetadataEnumeration", ({ context }) => exportMetadataEnumerationToJSONSchema({ context }))
registerProjectJSONSchema("MetadataDataProcessor", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: MetadataDataProcessorRules }))
registerProjectJSONSchema("MetadataDocumentJournal", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: MetadataDocumentJournalRules }))
registerProjectJSONSchema("MetadataHTTPService", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: MetadataHTTPServiceRules }))
registerProjectJSONSchema("MetadataInformationRegister", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: MetadataInformationRegisterRules }))
registerProjectJSONSchema("MetadataAccumulationRegister", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: MetadataAccumulationRegisterRules }))
registerProjectJSONSchema("MetadataExchangePlan", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: MetadataExchangePlanRules }))
registerProjectJSONSchema("ClientApplicationForm", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: ClientApplicationFormRules }))
registerProjectJSONSchema("MetadataAttribute", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: MetadataAttributeRules }))
registerProjectJSONSchema("MetadataCatalogAttribute", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: MetadataCatalogAttributeRules }))
registerProjectJSONSchema("MetadataDocumentAttribute", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: MetadataDocumentAttributeRules }))
registerProjectJSONSchema("MetadataTabularSectionAttribute", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: MetadataTabularSectionAttributeRules }))
registerProjectJSONSchema("MetadataRegisterAttribute", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: MetadataRegisterAttributeRules }))
registerProjectJSONSchema("MetadataTaskAddressingAttribute", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: MetadataTaskAddressingAttributeRules }))
registerProjectJSONSchema("MetadataTabularSection", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: MetadataTabularSectionRules }))
registerProjectJSONSchema("MetadataCommand", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: MetadataCommandRules }))
registerProjectJSONSchema("FormAttribute", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: FormAttributeRules }))
registerProjectJSONSchema("FormAttributeColumn", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: FormAttributeColumnRules }))
registerProjectJSONSchema("FormCommand", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: FormCommandRules }))
registerProjectJSONSchema("FormParameter", ({ context }) => exportMetadataItemToJSONSchema({ context, rule: FormParameterRules }))
```

For collectable form element schemas, add the loop to the form element registration entrypoint that already owns `getElementRule(...)`:

```ts
for (const [itemType, yamlKind] of Object.entries(CollectableElementTypeToYAML)) {
  const elementType = itemType as CollectableElementType
  registerProjectJSONSchema(elementType, ({ context }) =>
    exportElementRuleToJSONSchema({
      context,
      propertyAliases: getTreeNodeJSONSchemaPropertyAliases(elementType),
      rule: getElementRule(elementType),
      yamlKind,
    })
  )
}
```

- [ ] **Step 3: Move property ref registrations**

Move these refs into the `register.ts` file that owns the corresponding collection property type:

```ts
registerProjectJSONSchemaPropertyRef("MetadataCatalogAttributes", "MetadataCatalogAttribute")
registerProjectJSONSchemaPropertyRef("MetadataDocumentAttributes", "MetadataDocumentAttribute")
registerProjectJSONSchemaPropertyRef("MetadataAttributes", "MetadataAttribute")
registerProjectJSONSchemaPropertyRef("MetadataRegisterAttributes", "MetadataRegisterAttribute")
registerProjectJSONSchemaPropertyRef("MetadataReportAttributes", "MetadataAttribute")
registerProjectJSONSchemaPropertyRef("MetadataTaskAddressingAttributes", "MetadataTaskAddressingAttribute")
registerProjectJSONSchemaPropertyRefFactory("MetadataTabularSectionAttributes", () => recordOfSchemaRef("MetadataTabularSectionAttribute"))
registerProjectJSONSchemaPropertyRefFactory("MetadataCommands", () => recordOfSchemaRef("MetadataCommand"))
registerProjectJSONSchemaPropertyRefFactory("FormAttributes", () => recordOfSchemaRef("FormAttribute"))
registerProjectJSONSchemaPropertyRefFactory("FormAttributeColumns", () => recordOfSchemaRef("FormAttributeColumn"))
registerProjectJSONSchemaPropertyRefFactory("FormCommands", () => recordOfSchemaRef("FormCommand"))
registerProjectJSONSchemaPropertyRefFactory("FormParameters", () => recordOfSchemaRef("FormParameter"))
```

For tabular-section collection refs, register each exact type:

```ts
for (const type of [
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
] as const) {
  registerProjectJSONSchemaPropertyRefFactory(type, () => recordOfSchemaRef("MetadataTabularSection"))
}
```

For form child items, register each exact tree property type:

```ts
for (const type of [
  "GroupChildItems",
  "CommandBarChildItems",
  "TableChildItems",
  "PagesChildItems",
] as const) {
  registerProjectJSONSchemaPropertyRefFactory(type, () => recordOfOneOfSchemaRefs(getChildItemTypesByPropertyType(type)))
}
```

- [ ] **Step 4: Remove hard-coded registration bodies from `schemaRegistry.ts`**

Delete `registerNamedSchemas()`, `registerPropertyRefs()` and the private `registerSchemaPropertyRef(...)` helper from `schemaRegistry.ts`.

Keep `listJSONSchemaNames()` and `exportJSONSchemaForSchemaName(...)` unchanged except that they read the registry filled by object registration.

- [ ] **Step 5: Run schema tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/schemaRegistry.test.ts packages/core/metadata/project/schemaRegistry.test.ts --no-isolate
```

Expected: PASS.

## Task 4: Drive Resources and Directory Structure from Descriptors

**Files:**
- Modify: `packages/core/metadata/project/ruleResources.ts`
- Modify: `packages/core/metadata/project/resources.ts`
- Modify: `packages/core/metadata/project/directoryStructure.ts`
- Test: `packages/core/metadata/project/resources.test.ts`
- Test: `packages/core/metadata/project/directoryStructure.test.ts`

- [ ] **Step 1: Add helper to expand owner resource patterns**

Append to `packages/core/metadata/project/ruleResources.ts`:

```ts
export function describeMetadataRuleProjectResourcePatterns(rule: MetadataItemRule): string[] {
  return describeMetadataRuleProjectResources(rule)
    .map((resource) => resource.projectPattern)
    .filter((pattern, index, patterns) => patterns.indexOf(pattern) === index)
}
```

- [ ] **Step 2: Add tests that project consumers do not depend on hard-coded form dir**

Extend `packages/core/metadata/project/resources.test.ts`:

```ts
  it("classifies form YAML through registered project resources", () => {
    expect(classifyMetadataProjectPath("Документ/Заказ/Формы/ФормаДокумента/Форма.yaml")).toMatchObject({
      kind: "yaml",
      role: "form",
      projectPath: "Документ/Заказ/Формы/ФормаДокумента/Форма.yaml",
      owner: expect.objectContaining({ dir: "Документ", name: "Заказ" }),
      formName: "ФормаДокумента",
    })
  })
```

Extend `packages/core/metadata/project/directoryStructure.test.ts`:

```ts
  it("shows file-item directories from registered project resources", () => {
    const structure = describeMetadataProjectDirectoryStructure({
      projectDir: "/tmp/project",
      directoryPath: "Справочник/Номенклатура",
      depth: 2,
    })

    expect(structure.node.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Свойства.yaml", role: "properties" }),
        expect.objectContaining({ name: "Формы", role: "fileItemDirectory" }),
      ])
    )
  })
```

- [ ] **Step 3: Replace hard-coded form/subsystem branches with descriptor matching**

In `resources.ts`, keep public result types stable and implement classification by trying:

```ts
for (const spec of metadataProjectSpecs) {
  const ownerPrefix = `${spec.dir}/`
  if (!normalized.startsWith(ownerPrefix)) continue

  const [dir, name, ...relativeParts] = normalized.split("/")
  if (!name) return undefined
  const relativePath = relativeParts.join("/")

  for (const resource of describeMetadataRuleProjectResources(spec.rule)) {
    const match = matchProjectPattern(resource.projectPattern, relativePath)
    if (match && resource.kind === "yaml" && resource.role === "properties") {
      return { kind: "yaml", role: "properties", projectPath: normalized, owner: createOwner(dir, name), nesting: [] }
    }
    if (match && resource.kind === "yaml" && resource.role === "fileItem" && match.itemName) {
      return { kind: "yaml", role: "form", projectPath: normalized, owner: createOwner(dir, name), formName: match.itemName }
    }
  }
}
```

Then handle recursive subsystem nesting through `spec.nesting` instead of constants by adding this helper to `resources.ts`:

```ts
function matchRecursiveNestedPropertiesPath(
  spec: MetadataProjectSpec,
  parts: string[],
  projectPath: string
): MetadataProjectPropertiesYamlRef | undefined {
  const nestingRule = spec.nesting
  if (nestingRule?.kind !== "recursiveChildDir") return undefined
  if (parts[0] !== spec.dir || parts[parts.length - 1] !== "Свойства.yaml") return undefined
  if (parts.length < 5 || (parts.length - 3) % 2 !== 0) return undefined
  if (parts.some((part) => part.length === 0)) return undefined

  const nesting: MetadataProjectNestingSegment[] = [{ dir: spec.dir, name: parts[1] }]
  for (let index = 2; index < parts.length - 2; index += 2) {
    if (parts[index] !== nestingRule.childDir || !parts[index + 1]) return undefined
    if (index < parts.length - 3) nesting.push({ dir: spec.dir, name: parts[index + 1] })
  }

  const owner = createOwner(spec.dir, parts[parts.length - 2])
  return owner ? { kind: "yaml", role: "properties", projectPath, owner, nesting } : undefined
}
```

Use exact names from the registered subsystem spec:

```ts
nesting: { kind: "recursiveChildDir", childDir: "Подсистемы", itemRole: "subsystem", collectionRole: "subsystems" }
```

- [ ] **Step 4: Render directory structure from project resources**

In `directoryStructure.ts`, replace hard-coded `FORMS_DIR` and `FORM_FILE` nodes inside `metadataObjectNode(...)` with nodes derived from `describeMetadataRuleProjectResources(position.spec.rule)`:

```ts
function projectResourceNodes(spec: MetadataProjectSpec, objectPath: string): MetadataProjectStructureNode[] {
  return describeMetadataRuleProjectResources(spec.rule).flatMap((resource) => {
    if (resource.kind === "yaml" && resource.role === "fileItem") {
      const [dirName, itemName, fileName] = resource.projectPattern.split("/")
      return [
        directory(dirName, "fileItemDirectory", `${objectPath}/${dirName}`, "Каталог файловых дочерних объектов", false, false, [
          directory(itemName, "fileItem", `${objectPath}/${dirName}/${itemName}`, "Каталог файлового дочернего объекта", false, true, [
            file(fileName, "fileItemYaml", `${objectPath}/${dirName}/${itemName}/${fileName}`, "YAML-файл файлового дочернего объекта", resource.required),
          ]),
        ]),
      ]
    }

    if (resource.kind === "directory" && resource.role === "resourceOnly") {
      return [
        directory(resource.projectPattern, "externalResourceDirectory", `${objectPath}/${resource.projectPattern}`, "Каталог внешних ресурсов", resource.required, resource.repeatable),
      ]
    }

    return []
  })
}
```

Call `projectResourceNodes(position.spec, directoryPath)` from `metadataObjectNode(...)`.

- [ ] **Step 5: Run project resource tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project/resources.test.ts packages/core/metadata/project/directoryStructure.test.ts packages/core/metadata/project/ruleResources.test.ts --no-isolate
```

Expected: PASS.

## Task 5: Drive Sync State Files from Project Descriptors

**Files:**
- Modify: `packages/core/metadata/project/syncStateFiles.ts`
- Test: `packages/core/metadata/project/syncStateFiles.test.ts`

- [ ] **Step 1: Add guard test for removed private type checks**

Append to `packages/core/metadata/project/syncStateFiles.test.ts`:

```ts
  it("does not hard-code child form/template or ws schema property types", () => {
    const source = readFileSync(join(process.cwd(), "metadata/project/syncStateFiles.ts"), "utf-8")

    expect(source).not.toContain('propertyRule.type === "ClientApplicationForm"')
    expect(source).not.toContain('propertyRule.type === "WSDefinitionSchemas"')
    expect(source).not.toContain('propertyRule.type === "Template"')
    expect(source).not.toContain('spec.dir === SUBSYSTEM_DIR')
  })
```

Add imports if missing:

```ts
import { readFileSync } from "fs"
import { join } from "path"
```

- [ ] **Step 2: Replace private type checks with descriptor loops**

In `syncStateFiles.ts`, remove `getSyncExternalResourceDirs(...)`, `collectResourceDirsFromRule(...)`, `getReferenceOnlyFolderName(...)` and all checks for `ClientApplicationForm`, `WSDefinitionSchemas`, `Template`.

Use `describeMetadataRuleProjectResources(rule)` in `collectRulePathMatchers(...)`:

```ts
for (const resource of describeMetadataRuleProjectResources(rule)) {
  if (resource.kind === "yaml") {
    addPathValueMatcher(matchers, basePattern, resource.projectPattern, { family: false })
  }
  if (resource.kind === "directory") {
    addDirectoryMatcher(matchers, basePattern, resource.projectPattern)
  }
}
```

Keep recursive child collections generic:

```ts
for (const childCollection of rule.childCollections ?? []) {
  const childBasePattern =
    childCollection.nkdkDir === undefined
      ? basePattern
      : joinRegexPath(basePattern, pathValueToRegex(childCollection.nkdkDir))

  collectRulePathMatchers(matchers, childCollection.itemRule, childBasePattern)
}
```

- [ ] **Step 3: Run sync-state tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project/syncStateFiles.test.ts --no-isolate
```

Expected: PASS.

## Task 6: Strengthen Import Boundaries for Project Layer

**Files:**
- Modify: `packages/core/metadata/importBoundaries.test.ts`

- [ ] **Step 1: Add project-layer forbidden import test**

Add this test:

```ts
  it("metadata/project does not import concrete metadata implementations", () => {
    const offenders = findImportOffenders(join(METADATA_DIR, "project"), [
      "~/metadata/appliedObjects/metadata",
      "~/metadata/forms/clientApplicationForm",
      "~/metadata/forms/commonObjects",
      "~/metadata/commonObjects/metadata",
    ]).filter(({ filePath }) => !filePath.endsWith(".test.ts"))

    expect(offenders).toEqual([])
  })
```

- [ ] **Step 2: Run boundary tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS.

## Task 7: Verify and Commit

**Files:**
- All files changed in this plan.

- [ ] **Step 1: Run focused project tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project/projectSpecRegistry.test.ts packages/core/metadata/project/specs.test.ts packages/core/metadata/project/schemaRegistry.test.ts packages/core/metadata/project/resources.test.ts packages/core/metadata/project/directoryStructure.test.ts packages/core/metadata/project/syncStateFiles.test.ts packages/core/metadata/project/ruleResources.test.ts packages/core/metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 2: Run TypeScript and all tests**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
pnpm --filter @nakidka/core test
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Confirm project layer no longer contains concrete references**

Run:

```bash
rg -n "MetadataCatalog|MetadataDocument|MetadataEnumeration|ClientApplicationForm|DynamicList|WSDefinitionSchemas|Формы|Подсистемы|spec.dir ===" packages/core/metadata/project
```

Expected: no production-code matches for concrete implementation imports or `spec.dir ===`; Russian words may remain only in registered descriptors or tests.

- [ ] **Step 4: Commit**

Run:

```bash
git add packages/core/metadata/project \
  packages/core/metadata/appliedObjects \
  packages/core/metadata/commonObjects \
  packages/core/metadata/forms \
  packages/core/metadata/importBoundaries.test.ts
git commit -m "refactor: :recycle: вынести project descriptors в регистрации"
```

Expected: commit succeeds.
