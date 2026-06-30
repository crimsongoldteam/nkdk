# Metadata Child Files And Target Owner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать частные проверки `ChildFormNames`/`ChildTemplateNames` из `orchestration/appliedObject` и itemType-specific owner/root logic из `orchestration/property/metadataTargetString.ts`.

**Architecture:** Property-типы дочерних файлов регистрируют нейтральный `fileChildNamesDescriptor`; appliedObject sync читает descriptor через type-rule registry. Metadata-target owner/root разделяется на декларацию в `MetadataItemRule.metadataTargetOwner` для простых объектов и registry resolver для сложных вложенных объектов.

**Tech Stack:** TypeScript 5.9, Vitest, pnpm, existing type-rule registry, existing metadata target parser/formatter.

---

## Scope Check

Этот план покрывает пункты 3 и 4 спеки. Он не переносит сами `syncExternalFromXML`/`syncExternalToXML` реализации форм и макетов и не меняет смысл property-rules с `metadataTarget`.

## File Structure

- Modify: `packages/core/metadata/orchestration/property/fn.ts`
  - Add `FileChildNamesDescriptorFunction`, `MetadataTargetOwnerDeclaration`, and operation names.
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
  - Support `fileChildNamesDescriptor`.
- Modify: `packages/core/metadata/orchestration/property/types.ts`
  - Add neutral `metadataTargetOwner` declaration to `MetadataItemRule`.
- Create: `packages/core/metadata/orchestration/property/metadataTargetOwnerRegistry.ts`
  - Runtime registry for complex owner resolvers.
- Modify: `packages/core/metadata/orchestration/property/metadataTargetString.ts`
  - Resolve owner/root from declarations/registry instead of hard-coded itemType checks.
- Modify: `packages/core/metadata/orchestration/property/fromYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/toYAML.ts`
  - Pass owner stack in a neutral form accepted by `metadataTargetString.ts`.
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/syncExternalToXML.ts`
  - Register `fileChildNamesDescriptor`.
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`
  - Use `fileChildNamesDescriptor`, remove local `isFileChildNameRule`.
- Modify: metadata rules/register files listed in Task 5
  - Add `metadataTargetOwner` or resolver registration.
- Test: `packages/core/metadata/orchestration/appliedObject/fileChildNamesDescriptor.test.ts`
- Test: `packages/core/metadata/orchestration/property/metadataTargetString.test.ts`
- Test: `packages/core/metadata/orchestration/appliedObject/convertFromXML.test.ts`
- Test: `packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts`
- Test: `packages/core/metadata/importBoundaries.test.ts`

## Task 0: Preflight

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `docs/superpowers/specs/2026-06-28-metadata-layer-boundary-violations-spec.md`
- Read: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Read: `packages/core/metadata/orchestration/property/metadataTargetString.ts`

- [ ] **Step 1: Check metadata knowledge**

Run:

```bash
test -f .agents/knowledge/metadata/INDEX.md && sed -n '1,260p' .agents/knowledge/metadata/INDEX.md || echo "metadata knowledge index is missing"
```

Expected: the file is read, or the command prints `metadata knowledge index is missing`.

- [ ] **Step 2: Read spec sections for this plan**

Run:

```bash
sed -n '230,340p' docs/superpowers/specs/2026-06-28-metadata-layer-boundary-violations-spec.md
```

Expected: output includes `Частные условия в orchestration/appliedObject` and `Metadata target owner/root`.

## Task 1: Add File Child Names Descriptor Operation

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Test: `packages/core/metadata/orchestration/appliedObject/fileChildNamesDescriptor.test.ts`

- [ ] **Step 1: Write descriptor registry test**

Create `packages/core/metadata/orchestration/appliedObject/fileChildNamesDescriptor.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects/childFormNames/syncExternalToXML"
import "~/metadata/commonObjects/childTemplateNames/syncExternalToXML"
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"

describe("fileChildNamesDescriptor", () => {
  it("describes child forms without appliedObject knowing ChildFormNames", () => {
    const descriptor = getTypeRule("ChildFormNames", "fileChildNamesDescriptor")?.({
      propertyRule: {
        type: "ChildFormNames",
        xml: "Form",
        folderName: "Формы",
        forReferenceOnly: true,
      },
    })

    expect(descriptor).toEqual({
      folderName: "Формы",
      xmlFolderName: "Forms",
      xmlItemName: "Form",
      useOwnerDirectoryForExternalSync: true,
      preserveReferenceXmlFolder: true,
      expectedNames: expect.any(Function),
    })
  })

  it("describes child templates without appliedObject knowing ChildTemplateNames", () => {
    const descriptor = getTypeRule("ChildTemplateNames", "fileChildNamesDescriptor")?.({
      propertyRule: {
        type: "ChildTemplateNames",
        xml: "Template",
        folderName: "Макеты",
        forReferenceOnly: true,
      },
    })

    expect(descriptor).toMatchObject({
      folderName: "Макеты",
      xmlFolderName: "Templates",
      xmlItemName: "Template",
      useOwnerDirectoryForExternalSync: true,
      preserveReferenceXmlFolder: true,
    })
  })
})
```

- [ ] **Step 2: Run test and confirm it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/appliedObject/fileChildNamesDescriptor.test.ts --no-isolate
```

Expected: FAIL because operation `fileChildNamesDescriptor` is not registered.

- [ ] **Step 3: Add descriptor types**

In `packages/core/metadata/orchestration/property/fn.ts`, add:

```ts
export interface FileChildNamesDescriptor {
  folderName: string
  xmlFolderName: string
  xmlItemName: string
  useOwnerDirectoryForExternalSync: boolean
  preserveReferenceXmlFolder: boolean
  expectedNames: (params: { rule: MetadataItemRule; model: Record<string, unknown>; propertyValue: unknown }) => string[]
}

export type FileChildNamesDescriptorFunction = (params: {
  propertyRule: PropertyRule
}) => FileChildNamesDescriptor | undefined
```

Add `fileChildNamesDescriptor?: FileChildNamesDescriptorFunction` to `TypeRule`.

Add `"fileChildNamesDescriptor"` to `TypeRulesOperations`.

Add the conditional mapping in `importExportFunction<O>`:

```ts
: O extends "fileChildNamesDescriptor"
  ? FileChildNamesDescriptorFunction | undefined
```

- [ ] **Step 4: Add registry support**

In `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`, add `FileChildNamesDescriptorFunction` to imports and the registry union:

```ts
  | FileChildNamesDescriptorFunction
```

Add return mapping in `getTypeRule`:

```ts
: O extends "fileChildNamesDescriptor"
  ? FileChildNamesDescriptorFunction | undefined
```

- [ ] **Step 5: Register descriptors in property-type files**

In `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`, after existing `registerTypeRule("ChildFormNames", "xmlSyncRoutes", ...)`, add:

```ts
registerTypeRule("ChildFormNames", "fileChildNamesDescriptor", ({ propertyRule }) => {
  const rule = propertyRule as ChildFormNamesPropertyRule
  return {
    folderName: rule.folderName,
    xmlFolderName: "Forms",
    xmlItemName: rule.xml,
    useOwnerDirectoryForExternalSync: true,
    preserveReferenceXmlFolder: true,
    expectedNames: ({ rule: ownerRule, model, propertyValue }) => [
      ...normalizeFormNames(propertyValue),
      ...collectMetadataTargetFormNames({ rule: ownerRule, model }),
    ],
  }
})
```

Add helper:

```ts
function collectMetadataTargetFormNames(params: { rule: MetadataItemRule; model: Record<string, unknown> }): string[] {
  const result = new Set<string>()
  for (const [propertyName, propertyRule] of Object.entries(params.rule.properties)) {
    if (propertyRule.type === "ChildFormNames") continue
    const value = params.model[propertyName]
    if (typeof value !== "string") continue

    const target = propertyRule.metadataTarget ?? (
      propertyRule.referenceScope?.target === "this" && propertyRule.referenceScope.kind === "Form"
        ? { kind: "member", memberKinds: ["Form"] }
        : undefined
    )
    if (target === undefined) continue

    const parts = value.split(".")
    const formIndex = parts.lastIndexOf("Form")
    if (formIndex >= 0 && parts[formIndex + 1]) result.add(parts[formIndex + 1])
  }
  return [...result]
}
```

In `packages/core/metadata/commonObjects/childTemplateNames/syncExternalToXML.ts`, add:

```ts
registerTypeRule("ChildTemplateNames", "fileChildNamesDescriptor", ({ propertyRule }) => {
  const rule = propertyRule as ChildTemplateNamesPropertyRule
  return {
    folderName: rule.folderName,
    xmlFolderName: "Templates",
    xmlItemName: rule.xml,
    useOwnerDirectoryForExternalSync: true,
    preserveReferenceXmlFolder: true,
    expectedNames: ({ propertyValue }) => (Array.isArray(propertyValue) ? propertyValue.filter((item): item is string => typeof item === "string") : []),
  }
})
```

- [ ] **Step 6: Run descriptor test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/appliedObject/fileChildNamesDescriptor.test.ts --no-isolate
```

Expected: PASS.

## Task 2: Use Descriptor in appliedObject Sync

**Files:**
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`
- Test: `packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts`
- Test: `packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts`
- Test: `packages/core/metadata/orchestration/appliedObject/convertFromXML.test.ts`

- [ ] **Step 1: Add source guard test**

Add to `packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts`:

```ts
  it("appliedObject sync uses fileChildNamesDescriptor instead of child form/template strings", () => {
    const syncToXmlSource = readFileSync(join(process.cwd(), "metadata/orchestration/appliedObject/syncToXML.ts"), "utf-8")
    const convertSource = readFileSync(join(process.cwd(), "metadata/orchestration/appliedObject/convertFromXML.ts"), "utf-8")

    expect(syncToXmlSource).toContain("fileChildNamesDescriptor")
    expect(convertSource).toContain("fileChildNamesDescriptor")
    expect(syncToXmlSource).not.toContain('rule.type === "ChildFormNames"')
    expect(syncToXmlSource).not.toContain('rule.type === "ChildTemplateNames"')
    expect(convertSource).not.toContain('rule.type === "ChildFormNames"')
    expect(convertSource).not.toContain('rule.type === "ChildTemplateNames"')
  })
```

Add imports if needed:

```ts
import { readFileSync } from "fs"
import { join } from "path"
```

- [ ] **Step 2: Add helper in `syncToXML.ts`**

Add:

```ts
function getFileChildNamesDescriptor(rule: PropertyRule): FileChildNamesDescriptor | undefined {
  return getTypeRule(rule.type, "fileChildNamesDescriptor")?.({ propertyRule: rule })
}
```

Import `FileChildNamesDescriptor`:

```ts
import type { FileChildNamesDescriptor } from "~/metadata/orchestration/property/fn"
```

- [ ] **Step 3: Replace child form/template checks in `syncToXML.ts`**

Replace `collectFolderNames(rule, "ChildFormNames", inputDir, name)` and `collectFolderNames(rule, "ChildTemplateNames", inputDir, name)` with one loop:

```ts
const fileChildNames = await collectFileChildNames({ rule, inputDir, name })
```

Add:

```ts
async function collectFileChildNames(params: {
  rule: MetadataItemRule
  inputDir: string
  name: string
}): Promise<Record<string, string[]>> {
  const result: Record<string, string[]> = {}
  for (const [propertyName, propertyRule] of Object.entries(params.rule.properties) as Array<[string, PropertyRule]>) {
    const descriptor = getFileChildNamesDescriptor(propertyRule)
    if (!descriptor) continue
    result[propertyName] = await collectFolderNamesByDescriptor({
      descriptor,
      inputDir: params.inputDir,
      name: params.name,
    })
  }
  return result
}
```

Use `descriptor.folderName` in `collectFolderNamesByDescriptor(...)`.

Replace all `isFileChildNameRule(itemPropRule)` checks with:

```ts
const fileChildDescriptor = getFileChildNamesDescriptor(itemPropRule)
const externalSyncName = hasOwnDirs && fileChildDescriptor?.useOwnerDirectoryForExternalSync === true ? "" : syncName
const externalSyncReferenceName = hasOwnDirs && fileChildDescriptor?.useOwnerDirectoryForExternalSync === true ? "" : syncReferenceName
```

Replace `getExpectedFormNames(...)` with:

```ts
const expectedNames = fileChildDescriptor.expectedNames({
  rule: childRule,
  model: item.model,
  propertyValue: item.model[itemPropertyName],
})
```

Replace `preserveReferenceChildNameFilesToXML(...)` implementation to use `descriptor.xmlFolderName`.

- [ ] **Step 4: Replace child checks in `convertFromXML.ts`**

Add the same `getFileChildNamesDescriptor(...)` helper to `convertFromXML.ts`.

Replace:

```ts
const externalSyncName = hasOwnDirs && isFileChildNameRule(itemPropRule) ? "" : syncName
```

with:

```ts
const descriptor = getFileChildNamesDescriptor(itemPropRule)
const externalSyncName = hasOwnDirs && descriptor?.useOwnerDirectoryForExternalSync === true ? "" : syncName
```

Delete local `isFileChildNameRule(...)`.

- [ ] **Step 5: Run appliedObject tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts packages/core/metadata/orchestration/appliedObject/convertFromXML.test.ts --no-isolate
```

Expected: PASS.

## Task 3: Add Metadata Target Owner Declaration and Registry

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Create: `packages/core/metadata/orchestration/property/metadataTargetOwnerRegistry.ts`
- Test: `packages/core/metadata/orchestration/property/metadataTargetString.test.ts`

- [ ] **Step 1: Add owner declaration types**

In `packages/core/metadata/orchestration/property/types.ts`, import:

```ts
import type { MetadataRootName, MetadataTargetOwner } from "~/metadata/commonObjects/metadataTargets/types"
```

Add:

```ts
export type MetadataTargetOwnerDeclaration =
  | { kind: "self"; root: MetadataRootName }
  | { kind: "inherit" }
  | { kind: "resolver" }
```

Add to `MetadataItemRule`:

```ts
  /**
   * Описывает, как объект участвует в owner/root metadata-target.
   * Property rules по-прежнему описывают ограничения ссылки; это поле описывает только владельца.
   */
  metadataTargetOwner?: MetadataTargetOwnerDeclaration
```

- [ ] **Step 2: Create owner resolver registry**

Create `packages/core/metadata/orchestration/property/metadataTargetOwnerRegistry.ts`:

```ts
import type { ConfigurationContext } from "~/metadata/context/types"
import type { MetadataTargetOwner } from "~/metadata/commonObjects/metadataTargets/types"
import type { MetadataItemRule } from "./types"

export interface MetadataTargetOwnerFrame {
  itemType: string
  name: string
  owner?: MetadataTargetOwner
}

export type MetadataTargetOwnerResolver = (params: {
  itemRule: MetadataItemRule
  name: string | undefined
  frames: readonly MetadataTargetOwnerFrame[]
  context?: ConfigurationContext
}) => MetadataTargetOwner | undefined

const resolvers = new Map<string, MetadataTargetOwnerResolver>()

export function registerMetadataTargetOwnerResolver(itemType: string, resolver: MetadataTargetOwnerResolver): void {
  resolvers.set(itemType, resolver)
}

export function getMetadataTargetOwnerResolver(itemType: string): MetadataTargetOwnerResolver | undefined {
  return resolvers.get(itemType)
}

export function clearMetadataTargetOwnerResolversForTests(): void {
  resolvers.clear()
}
```

- [ ] **Step 3: Add owner tests**

Create or extend `packages/core/metadata/orchestration/property/metadataTargetString.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "./types"
import { metadataTargetOwnerFromRule } from "./metadataTargetString"

describe("metadataTargetOwnerFromRule", () => {
  it("uses self declaration for simple root objects", () => {
    const rule = {
      itemType: "MetadataDocument",
      itemTypePrefix: "Документ",
      metadataTargetOwner: { kind: "self", root: "Document" },
      properties: {},
    } as const satisfies MetadataItemRule

    expect(metadataTargetOwnerFromRule({ itemRule: rule, name: "Заказ" })).toEqual({
      root: "Document",
      objectName: "Заказ",
    })
  })

  it("inherits owner for forms", () => {
    const rule = {
      itemType: "ClientApplicationForm",
      metadataTargetOwner: { kind: "inherit" },
      properties: {},
    } as const satisfies MetadataItemRule

    expect(
      metadataTargetOwnerFromRule({
        itemRule: rule,
        name: "ФормаДокумента",
        context: {
          importFromYAML: {
            metadataTargetOwners: [
              { itemType: "MetadataDocument", name: "Заказ", owner: { root: "Document", objectName: "Заказ" } },
            ],
          },
        } as never,
      })
    ).toEqual({ root: "Document", objectName: "Заказ" })
  })
})
```

- [ ] **Step 4: Run owner tests and confirm failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/property/metadataTargetString.test.ts --no-isolate
```

Expected: FAIL until `metadataTargetString.ts` uses declarations.

## Task 4: Replace Hard-Coded Metadata Target Owner Logic

**Files:**
- Modify: `packages/core/metadata/orchestration/property/metadataTargetString.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/toYAML.ts`

- [ ] **Step 1: Update owner stack type**

Where `metadataTargetOwners` is pushed in `fromYAML.ts` and `toYAML.ts`, include resolved owner when available:

```ts
const owner = metadataTargetOwnerFromRule({ itemRule: rule, name, context })
const metadataTargetOwners = [
  ...(context.importFromYAML?.metadataTargetOwners ?? []),
  ...(name ? [{ itemType: rule.itemType, name, ...(owner ? { owner } : {}) }] : []),
]
```

Use the equivalent `context.exportToYAML?.metadataTargetOwners` branch in `toYAML.ts`.

- [ ] **Step 2: Implement declaration-based owner resolution**

Replace `metadataTargetNestedOwnerFromRule(...)`, `itemTypePrefixRootFallback`, `rootByOwnerItemType`, `metadataOwnerFromContext(...)` and `findLastOwner(...)` in `metadataTargetString.ts` with:

```ts
export function metadataTargetOwnerFromRule(params: {
  itemRule: MetadataItemRule
  name: string | undefined
  context?: ConfigurationContext
}): MetadataTargetOwner | undefined {
  const frames = metadataTargetOwnerFrames(params.context)
  const resolver = getMetadataTargetOwnerResolver(params.itemRule.itemType)
  if (resolver) {
    const resolved = resolver({ itemRule: params.itemRule, name: params.name, frames, context: params.context })
    if (resolved) return resolved
  }

  const declaration = params.itemRule.metadataTargetOwner
  if (declaration?.kind === "inherit") return lastResolvedOwner(frames)
  if (declaration?.kind === "self") {
    return params.name ? { root: declaration.root, objectName: params.name } : undefined
  }

  return undefined
}

function metadataTargetOwnerFrames(context: ConfigurationContext | undefined): readonly MetadataTargetOwnerFrame[] {
  return context?.importFromYAML?.metadataTargetOwners ?? context?.exportToYAML?.metadataTargetOwners ?? []
}

function lastResolvedOwner(frames: readonly MetadataTargetOwnerFrame[]): MetadataTargetOwner | undefined {
  for (let index = frames.length - 1; index >= 0; index -= 1) {
    const owner = frames[index].owner
    if (owner) return owner
  }
  return undefined
}
```

Import:

```ts
import { getMetadataTargetOwnerResolver, type MetadataTargetOwnerFrame } from "./metadataTargetOwnerRegistry"
```

- [ ] **Step 3: Run owner tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/property/metadataTargetString.test.ts --no-isolate
```

Expected: PASS.

## Task 5: Register Owner Declarations and Complex Resolvers

**Files:**
- Modify: simple root object `rules.ts` files
- Modify: nested object `register.ts` files
- Test: existing metadata-target validation tests

- [ ] **Step 1: Add simple self declarations**

Add `metadataTargetOwner: { kind: "self", root: "<Root>" }` to these rules:

```ts
MetadataAccountingRegisterRules -> "AccountingRegister"
MetadataAccumulationRegisterRules -> "AccumulationRegister"
MetadataBusinessProcessRules -> "BusinessProcess"
MetadataCalculationRegisterRules -> "CalculationRegister"
MetadataCatalogRules -> "Catalog"
MetadataChartOfAccountsRules -> "ChartOfAccounts"
MetadataChartOfCalculationTypesRules -> "ChartOfCalculationTypes"
MetadataChartOfCharacteristicTypesRules -> "ChartOfCharacteristicTypes"
MetadataConstantRules -> "Constant"
MetadataDataProcessorRules -> "DataProcessor"
MetadataDocumentRules -> "Document"
MetadataDocumentNumeratorRules -> "DocumentNumerator"
MetadataEnumerationRules -> "Enum"
MetadataExchangePlanRules -> "ExchangePlan"
MetadataExternalDataSourceRules -> "ExternalDataSource"
MetadataInformationRegisterRules -> "InformationRegister"
MetadataReportRules -> "Report"
MetadataTaskRules -> "Task"
```

Example:

```ts
export const MetadataDocumentRules = {
  itemType: "MetadataDocument",
  itemTypePrefix: "Документ",
  xmlDir: "Documents",
  metadataTargetOwner: { kind: "self", root: "Document" },
  properties: MetadataDocumentRulesProperties,
} as const satisfies MetadataItemRule
```

For files that declare `properties` inline, keep that inline object exactly as it is and add only the `metadataTargetOwner` field shown above.

- [ ] **Step 2: Add inherit declarations**

Add `metadataTargetOwner: { kind: "inherit" }` to:

```ts
ClientApplicationFormRules
MetadataAttributeRules
MetadataCatalogAttributeRules
MetadataDocumentAttributeRules
MetadataTabularSectionAttributeRules
MetadataRegisterAttributeRules
MetadataTaskAddressingAttributeRules
MetadataCommandRules
MetadataTabularSectionRules
```

- [ ] **Step 3: Register external data source nested resolvers**

In `packages/core/metadata/commonObjects/metadataExternalDataSourceTable/register.ts`:

```ts
import { registerMetadataTargetOwnerResolver } from "~/metadata/orchestration/property/metadataTargetOwnerRegistry"

registerMetadataTargetOwnerResolver("MetadataExternalDataSourceTable", ({ name, frames }) => {
  const external = [...frames].reverse().find((frame) => frame.itemType === "MetadataExternalDataSource")
  if (!external || !name) return undefined
  return { root: "ExternalDataSource", objectName: `${external.name}.Table.${name}` }
})
```

In `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/register.ts`:

```ts
registerMetadataTargetOwnerResolver("MetadataExternalDataSourceCube", ({ name, frames }) => {
  const external = [...frames].reverse().find((frame) => frame.itemType === "MetadataExternalDataSource")
  if (!external || !name) return undefined
  return { root: "ExternalDataSource", objectName: `${external.name}.Cube.${name}` }
})
```

In `packages/core/metadata/commonObjects/metadataExternalDataSourceDimensionTable/register.ts`:

```ts
registerMetadataTargetOwnerResolver("MetadataExternalDataSourceDimensionTable", ({ name, frames }) => {
  const external = [...frames].reverse().find((frame) => frame.itemType === "MetadataExternalDataSource")
  const cube = [...frames].reverse().find((frame) => frame.itemType === "MetadataExternalDataSourceCube")
  if (!external || !cube || !name) return undefined
  return { root: "ExternalDataSource", objectName: `${external.name}.Cube.${cube.name}.DimensionTable.${name}` }
})
```

- [ ] **Step 4: Run metadata-target validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/metadataTargetTraversal.test.ts packages/core/metadata/validation/projectMetadataResolver.test.ts packages/core/metadata/orchestration/property/metadataTargetString.test.ts --no-isolate
```

Expected: PASS.

## Task 6: Add Boundary Guards

**Files:**
- Modify: `packages/core/metadata/importBoundaries.test.ts`

- [ ] **Step 1: Add guard for removed hard-coded child file checks**

Add:

```ts
  it("appliedObject sync does not hard-code child form/template property types", () => {
    const files = [
      "metadata/orchestration/appliedObject/syncToXML.ts",
      "metadata/orchestration/appliedObject/convertFromXML.ts",
    ]

    for (const filePath of files) {
      const source = readFileSync(join(process.cwd(), filePath), "utf-8")
      expect(source).not.toContain("ChildFormNames")
      expect(source).not.toContain("ChildTemplateNames")
      expect(source).toContain("fileChildNamesDescriptor")
    }
  })
```

- [ ] **Step 2: Add guard for removed metadata-target itemType checks**

Add:

```ts
  it("metadataTargetString does not hard-code concrete metadata owners", () => {
    const source = readFileSync(join(METADATA_DIR, "orchestration", "property", "metadataTargetString.ts"), "utf-8")

    expect(source).not.toContain("MetadataExternalDataSource")
    expect(source).not.toContain("ClientApplicationForm")
    expect(source).not.toContain("MetadataAttribute")
    expect(source).not.toContain("rootByOwnerItemType")
    expect(source).not.toContain("Нумератор")
  })
```

- [ ] **Step 3: Run boundary tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS.

## Task 7: Verify and Commit

**Files:**
- All files changed in this plan.

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/appliedObject/fileChildNamesDescriptor.test.ts packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts packages/core/metadata/orchestration/appliedObject/convertFromXML.test.ts packages/core/metadata/orchestration/property/metadataTargetString.test.ts packages/core/metadata/validation/metadataTargetTraversal.test.ts packages/core/metadata/validation/projectMetadataResolver.test.ts packages/core/metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 2: Run TypeScript and full tests**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
pnpm --filter @nakidka/core test
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Search for removed private checks**

Run:

```bash
rg -n "ChildFormNames|ChildTemplateNames|rootByOwnerItemType|MetadataExternalDataSource|ClientApplicationForm|MetadataAttribute|Нумератор" packages/core/metadata/orchestration/appliedObject packages/core/metadata/orchestration/property/metadataTargetString.ts
```

Expected: no production-code matches except type names inside neutral descriptor tests if the command is expanded to test files.

- [ ] **Step 4: Commit**

Run:

```bash
git add packages/core/metadata/orchestration \
  packages/core/metadata/commonObjects \
  packages/core/metadata/appliedObjects \
  packages/core/metadata/forms \
  packages/core/metadata/importBoundaries.test.ts
git commit -m "refactor: :recycle: вынести child files и target owner"
```

Expected: commit succeeds.
