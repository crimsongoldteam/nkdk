# Declarative Incremental XML Sync Areas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make partial XML sync derive resources, routes, execution and CLI reporting from declarative rules/type registrations, so changed form YAML files and other declared resources are never silently skipped.

**Architecture:** Extend the existing `packages/core/metadata/project/ruleResources.ts` into the shared registry for project resources and XML sync routes. Keep `orchestration` generic: it reads `MetadataItemRule`, `PropertyRule` and type registrations, then dispatches to registered writers instead of checking concrete `itemType`, folders or property types.

**Tech Stack:** TypeScript, Vitest, existing `registerTypeRule` registry, Node `fs`, project `rules.ts`.

---

## File Structure

- Modify `packages/core/metadata/orchestration/property/fn.ts`
  - Add neutral function types for project resource descriptors, XML sync routes and XML sync writers.
- Modify `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
  - Register and read the new type-rule operations.
- Modify `packages/core/metadata/project/ruleResources.ts`
  - Become the shared source for project descriptors and XML routes.
  - Define resource descriptors, route descriptors, route matching helpers and descriptor-to-directory helpers.
- Modify `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`
  - Register ChildFormNames project resources/routes/writers.
  - Extract a single-form writer from the existing whole-property sync code.
- Modify `packages/core/metadata/commonObjects/childTemplateNames/syncExternalToXML.ts`
  - Register ChildTemplateNames project resources/routes/writers.
  - Extract a single-template writer from the existing whole-property sync code.
- Modify `packages/core/metadata/orchestration/appliedObject/xmlAreas.ts`
  - Resolve areas through route descriptors from `ruleResources.ts`.
  - Remove private checks for `Формы`, `Макеты`, `ChildFormNames`, `ChildTemplateNames` and `MetadataCatalog`.
- Modify `packages/core/metadata/appliedObjects/configuration/incrementalPlan.ts`
  - Use `compositionImpact` from descriptors instead of private owner logic.
- Modify `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`
  - Execute every planned area with an exhaustive switch.
  - Add `fileItem` execution through registered writers.
  - Track changed XML files by comparing file contents before and after write.
- Modify `packages/core/metadata/appliedObjects/configuration/convertFromXML.ts`
  - Extend `ConfigurationSyncResult` with optional `changedXmlFiles?: string[]`.
- Modify `packages/core/metadata/project/resources.ts`
  - Classify and discover YAML project resources through descriptors.
- Modify `packages/core/metadata/project/directoryStructure.ts`
  - Build resource nodes from descriptors instead of hard-coded forms.
- Modify `packages/core/metadata/project/syncStateFiles.ts`
  - Reuse descriptor matchers instead of hand-maintaining resource path rules.
- Modify `packages/cli/src/commands/sync.ts`
  - Print changed XML files for incremental sync.
- Tests:
  - `packages/core/metadata/project/ruleResources.test.ts`
  - `packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts`
  - `packages/core/metadata/appliedObjects/configuration/incrementalPlan.test.ts`
  - `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts`
  - `packages/core/metadata/project/resources.test.ts`
  - `packages/core/metadata/project/directoryStructure.test.ts`
  - `packages/core/metadata/project/syncStateFiles.test.ts`
  - `packages/cli/src/commands/sync.test.ts`

## Task 1: Add Type-Rule Contracts For Resources, Routes And Writers

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Test: `packages/core/metadata/project/ruleResources.test.ts`

- [ ] **Step 1: Write failing registry tests**

Add tests in `packages/core/metadata/project/ruleResources.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest"
import { clearTypeRulesRegistry, getTypeRule, registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"

describe("project resource type-rule contracts", () => {
  afterEach(() => clearTypeRulesRegistry())

  it("registers project resource descriptors for a property type", () => {
    registerTypeRule("ChildFormNames", "projectResources", () => [
      {
        kind: "yaml",
        role: "fileItem",
        projectPattern: "Формы/{itemName}/Форма.yaml",
        required: true,
        repeatable: true,
        owner: "currentItem",
        compositionImpact: "none",
        source: { kind: "propertyType", type: "ChildFormNames" },
      },
    ])

    expect(getTypeRule("ChildFormNames", "projectResources")?.({} as never)).toEqual([
      expect.objectContaining({
        kind: "yaml",
        role: "fileItem",
        projectPattern: "Формы/{itemName}/Форма.yaml",
        compositionImpact: "none",
      }),
    ])
  })

  it("registers XML sync routes and writers for a property type", () => {
    const writer = async () => undefined
    registerTypeRule("ChildFormNames", "xmlSyncRoutes", () => [
      {
        kind: "fileItem",
        yamlPattern: "Формы/{itemName}/Форма.yaml",
        xmlPathPattern: "Forms/{itemName}.xml",
        writerType: "propertyType",
        source: { kind: "propertyType", type: "ChildFormNames" },
      },
    ])
    registerTypeRule("ChildFormNames", "xmlSyncWriter", writer)

    expect(getTypeRule("ChildFormNames", "xmlSyncRoutes")?.({} as never)[0]).toMatchObject({
      kind: "fileItem",
      yamlPattern: "Формы/{itemName}/Форма.yaml",
      xmlPathPattern: "Forms/{itemName}.xml",
    })
    expect(getTypeRule("ChildFormNames", "xmlSyncWriter")).toBe(writer)
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/ruleResources.test.ts
```

Expected: TypeScript/Vitest failure because operations `projectResources`, `xmlSyncRoutes` and `xmlSyncWriter` are not defined.

- [ ] **Step 3: Add neutral types**

In `packages/core/metadata/orchestration/property/fn.ts`, add these exported types before `TypeRule`:

```ts
export type ProjectResourceCompositionImpact = "none" | "configurationComposition"

export type ProjectResourceDescriptor =
  | {
      kind: "yaml"
      role: "configuration" | "properties" | "fileItem" | "resourceOnly"
      projectPattern: string
      required: boolean
      repeatable: boolean
      owner: "configuration" | "currentItem"
      compositionImpact: ProjectResourceCompositionImpact
      source: ProjectResourceSource
    }
  | {
      kind: "directory"
      role: "resourceOnly"
      projectPattern: string
      required: boolean
      repeatable: boolean
      owner: "currentItem"
      compositionImpact: "none"
      source: ProjectResourceSource
    }

export type ProjectResourceSource =
  | { kind: "itemRule"; itemType: string }
  | { kind: "property"; propertyName: string; propertyType: PropertyRuleType }
  | { kind: "propertyType"; type: PropertyRuleType }

export type XmlSyncRoute =
  | {
      kind: "owner"
      yamlPattern: string
      xmlPathPattern: string
      source: ProjectResourceSource
    }
  | {
      kind: "fileItem" | "externalFile"
      yamlPattern: string
      xmlPathPattern: string
      writerType: "propertyType"
      source: ProjectResourceSource
      dumpInfoNamePatterns?: string[]
      deleteParentAreaBeforeWrite?: boolean
    }
  | {
      kind: "resourceOnly"
      yamlPattern: string
      source: ProjectResourceSource
    }

export type ProjectResourcesFunction = (params: { propertyRule?: PropertyRule }) => ProjectResourceDescriptor[]
export type XmlSyncRoutesFunction = (params: { propertyRule?: PropertyRule }) => XmlSyncRoute[]

export type XmlSyncWriterFunction = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  nkdkDir: string
  xmlDir: string
  name: string
  itemName?: string
  referenceDir?: string
  xmlManifest?: XmlWriteManifest
}) => Promise<void>
```

Then extend `TypeRule`, `TypeRulesOperations` and `importExportFunction` with:

```ts
projectResources?: ProjectResourcesFunction
xmlSyncRoutes?: XmlSyncRoutesFunction
xmlSyncWriter?: XmlSyncWriterFunction
```

- [ ] **Step 4: Wire the registry**

In `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`, add the three new function types to the map union and to the conditional return type in `getTypeRule`.

- [ ] **Step 5: Run focused test**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/ruleResources.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/orchestration/property/fn.ts packages/core/metadata/orchestration/property/typeRuleRegistry.ts packages/core/metadata/project/ruleResources.test.ts
git commit -m "feat: :sparkles: добавить договор ресурсов sync"
```

## Task 2: Build Shared Rule Resources And XML Routes

**Files:**
- Modify: `packages/core/metadata/project/ruleResources.ts`
- Test: `packages/core/metadata/project/ruleResources.test.ts`

- [ ] **Step 1: Add failing descriptor tests**

Extend `packages/core/metadata/project/ruleResources.test.ts`:

```ts
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import {
  describeMetadataRuleProjectResources,
  describeMetadataRuleXmlSyncRoutes,
  matchProjectPattern,
} from "./ruleResources"

describe("metadata rule resources and XML routes", () => {
  it("describes owner properties as configuration composition resource", () => {
    expect(describeMetadataRuleProjectResources(MetadataCatalogRules)).toContainEqual(
      expect.objectContaining({
        kind: "yaml",
        role: "properties",
        projectPattern: "Свойства.yaml",
        compositionImpact: "configurationComposition",
      }),
    )
  })

  it("does not hard-code MetadataCatalog for XML root names", () => {
    expect(describeMetadataRuleXmlSyncRoutes(MetadataCatalogRules)).toContainEqual(
      expect.objectContaining({
        kind: "owner",
        yamlPattern: "Свойства.yaml",
        xmlPathPattern: "Catalogs/{ownerName}.xml",
      }),
    )
  })

  it("matches named project patterns", () => {
    expect(matchProjectPattern("Формы/{itemName}/Форма.yaml", "Формы/ФормаЭлемента/Форма.yaml")).toEqual({
      itemName: "ФормаЭлемента",
    })
    expect(matchProjectPattern("Формы/{itemName}/Форма.yaml", "Формы/ФормаЭлемента/Модуль.bsl")).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/ruleResources.test.ts
```

Expected: FAIL because the new functions are missing.

- [ ] **Step 3: Implement project resource builders**

In `packages/core/metadata/project/ruleResources.ts`, keep existing exports for compatibility, then add:

```ts
export function describeMetadataRuleProjectResources(rule: MetadataItemRule): ProjectResourceDescriptor[] {
  const resources: ProjectResourceDescriptor[] = []

  if (configurationItemTypes.has(rule.itemType)) {
    resources.push({
      kind: "yaml",
      role: "configuration",
      projectPattern: "Конфигурация.yaml",
      required: true,
      repeatable: false,
      owner: "configuration",
      compositionImpact: "none",
      source: { kind: "itemRule", itemType: rule.itemType },
    })
  } else if (typeof rule.itemTypePrefix === "string") {
    resources.push({
      kind: "yaml",
      role: "properties",
      projectPattern: "Свойства.yaml",
      required: true,
      repeatable: false,
      owner: "currentItem",
      compositionImpact: "configurationComposition",
      source: { kind: "itemRule", itemType: rule.itemType },
    })
  }

  for (const [propertyName, propertyRule] of Object.entries(rule.properties) as Array<[string, PropertyRule]>) {
    const fromType = getTypeRule(propertyRule.type, "projectResources")?.({ propertyRule }) ?? []
    resources.push(
      ...fromType.map((resource) => ({
        ...resource,
        source:
          resource.source.kind === "propertyType"
            ? { kind: "property", propertyName, propertyType: propertyRule.type }
            : resource.source,
      })),
    )
  }

  return resources
}
```

Use exact imports from `~/metadata/orchestration/property/fn`.

- [ ] **Step 4: Implement XML route builders and pattern helpers**

Add:

```ts
export function describeMetadataRuleXmlSyncRoutes(rule: MetadataItemRule): XmlSyncRoute[] {
  const routes: XmlSyncRoute[] = []

  if (typeof rule.itemTypePrefix === "string" && typeof rule.xmlDir === "string") {
    routes.push({
      kind: "owner",
      yamlPattern: "Свойства.yaml",
      xmlPathPattern: `${rule.xmlDir}/{ownerName}.xml`,
      source: { kind: "itemRule", itemType: rule.itemType },
    })
  }

  for (const [propertyName, propertyRule] of Object.entries(rule.properties) as Array<[string, PropertyRule]>) {
    const fromType = getTypeRule(propertyRule.type, "xmlSyncRoutes")?.({ propertyRule }) ?? []
    routes.push(
      ...fromType.map((route) => ({
        ...route,
        source:
          route.source.kind === "propertyType"
            ? { kind: "property", propertyName, propertyType: propertyRule.type }
            : route.source,
      })),
    )
  }

  return routes
}

export function matchProjectPattern(pattern: string, projectPath: string): Record<string, string> | undefined {
  const patternParts = pattern.split("/")
  const pathParts = projectPath.split("/")
  if (patternParts.length !== pathParts.length) return undefined

  const params: Record<string, string> = {}
  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index]
    const pathPart = pathParts[index]
    const match = patternPart.match(/^\{([^}]+)\}$/)
    if (match) {
      if (!pathPart) return undefined
      params[match[1]] = pathPart
    } else if (patternPart !== pathPart) {
      return undefined
    }
  }
  return params
}

export function expandProjectPattern(pattern: string, params: Record<string, string>): string {
  return pattern.replace(/\{([^}]+)\}/g, (_source, key: string) => params[key] ?? "")
}
```

- [ ] **Step 5: Preserve old `describeMetadataRuleResources` behavior**

Keep the old `describeMetadataRuleResources` export unchanged for now. Do not remove old descriptor types yet; existing code still uses them.

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/ruleResources.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/project/ruleResources.ts packages/core/metadata/project/ruleResources.test.ts
git commit -m "feat: :sparkles: описать ресурсы sync из правил"
```

## Task 3: Register Child Form And Template Resources, Routes And Writers

**Files:**
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/syncExternalToXML.ts`
- Test: `packages/core/metadata/project/ruleResources.test.ts`
- Test: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts`
- Test: `packages/core/metadata/commonObjects/childTemplateNames/syncExternal.test.ts`

- [ ] **Step 1: Add failing route tests**

In `packages/core/metadata/project/ruleResources.test.ts`, add:

```ts
it("gets form resources and routes from ChildFormNames registration", () => {
  expect(describeMetadataRuleProjectResources(MetadataCatalogRules)).toContainEqual(
    expect.objectContaining({
      kind: "yaml",
      role: "fileItem",
      projectPattern: "Формы/{itemName}/Форма.yaml",
      source: expect.objectContaining({ propertyType: "ChildFormNames" }),
    }),
  )
  expect(describeMetadataRuleXmlSyncRoutes(MetadataCatalogRules)).toContainEqual(
    expect.objectContaining({
      kind: "fileItem",
      yamlPattern: "Формы/{itemName}/Форма.yaml",
      xmlPathPattern: "Forms/{itemName}.xml",
    }),
  )
  expect(describeMetadataRuleXmlSyncRoutes(MetadataCatalogRules)).toContainEqual(
    expect.objectContaining({
      kind: "externalFile",
      yamlPattern: "Формы/{itemName}/Модуль.bsl",
      xmlPathPattern: "Forms/{itemName}/Ext/Form/Module.bsl",
    }),
  )
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/ruleResources.test.ts
```

Expected: FAIL because ChildFormNames does not register project resources/routes yet.

- [ ] **Step 3: Register ChildFormNames descriptors and routes**

At the bottom of `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`, near existing registrations, add:

```ts
registerTypeRule("ChildFormNames", "projectResources", () => [
  {
    kind: "yaml",
    role: "fileItem",
    projectPattern: "Формы/{itemName}/Форма.yaml",
    required: true,
    repeatable: true,
    owner: "currentItem",
    compositionImpact: "none",
    source: { kind: "propertyType", type: "ChildFormNames" },
  },
  {
    kind: "yaml",
    role: "resourceOnly",
    projectPattern: "Формы/{itemName}/Модуль.bsl",
    required: false,
    repeatable: true,
    owner: "currentItem",
    compositionImpact: "none",
    source: { kind: "propertyType", type: "ChildFormNames" },
  },
])

registerTypeRule("ChildFormNames", "xmlSyncRoutes", () => [
  {
    kind: "fileItem",
    yamlPattern: "Формы/{itemName}/Форма.yaml",
    xmlPathPattern: "Forms/{itemName}.xml",
    writerType: "propertyType",
    source: { kind: "propertyType", type: "ChildFormNames" },
    dumpInfoNamePatterns: ["{dumpRoot}.{ownerName}.Form.{itemName}", "{dumpRoot}.{ownerName}.Form.{itemName}.Form"],
  },
  {
    kind: "externalFile",
    yamlPattern: "Формы/{itemName}/Модуль.bsl",
    xmlPathPattern: "Forms/{itemName}/Ext/Form/Module.bsl",
    writerType: "propertyType",
    source: { kind: "propertyType", type: "ChildFormNames" },
    dumpInfoNamePatterns: ["{dumpRoot}.{ownerName}.Form.{itemName}", "{dumpRoot}.{ownerName}.Form.{itemName}.Form"],
  },
])
```

- [ ] **Step 4: Extract a single-form writer**

In the same file, factor existing whole-property sync so a single item can be written when `itemName` is passed. Keep existing full sync behavior for calls without `itemName`.

Add and register:

```ts
registerTypeRule("ChildFormNames", "xmlSyncWriter", async (params) => {
  await syncChildFormNameToXML({
    context: params.context,
    rule: params.rule,
    nkdkDir: params.nkdkDir,
    xmlDir: params.xmlDir,
    name: params.name,
    itemName: params.itemName,
    referenceDir: params.referenceDir,
    xmlManifest: params.xmlManifest,
  })
})
```

Use existing form sync functions in this file; do not reimplement XML serialization.

- [ ] **Step 5: Register ChildTemplateNames descriptors and routes**

In `packages/core/metadata/commonObjects/childTemplateNames/syncExternalToXML.ts`, add analogous registrations:

```ts
registerTypeRule("ChildTemplateNames", "projectResources", () => [
  {
    kind: "yaml",
    role: "fileItem",
    projectPattern: "Макеты/{itemName}/Template.xml",
    required: true,
    repeatable: true,
    owner: "currentItem",
    compositionImpact: "none",
    source: { kind: "propertyType", type: "ChildTemplateNames" },
  },
])

registerTypeRule("ChildTemplateNames", "xmlSyncRoutes", () => [
  {
    kind: "fileItem",
    yamlPattern: "Макеты/{itemName}/Template.xml",
    xmlPathPattern: "Templates/{itemName}.xml",
    writerType: "propertyType",
    source: { kind: "propertyType", type: "ChildTemplateNames" },
    dumpInfoNamePatterns: ["{dumpRoot}.{ownerName}.Template.{itemName}", "{dumpRoot}.{ownerName}.Template.{itemName}.Template"],
  },
])
```

If existing template sync uses `Шаблоны` instead of `Макеты` for some rules, derive the YAML folder from `propertyRule.folderName` inside the registered function rather than hard-coding it in the general layer.

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/ruleResources.test.ts packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts packages/core/metadata/commonObjects/childTemplateNames/syncExternal.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts packages/core/metadata/commonObjects/childTemplateNames/syncExternalToXML.ts packages/core/metadata/project/ruleResources.test.ts
git commit -m "feat: :sparkles: зарегистрировать маршруты форм и макетов"
```

## Task 4: Resolve Incremental XML Areas Through Routes

**Files:**
- Modify: `packages/core/metadata/orchestration/appliedObject/xmlAreas.ts`
- Test: `packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts`

- [ ] **Step 1: Add failing architecture and behavior tests**

Extend `packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts`:

```ts
import { readFileSync } from "fs"
import { fileURLToPath } from "url"

it("does not contain private orchestration knowledge", () => {
  const source = readFileSync(fileURLToPath(import.meta.url).replace(/\.test\.ts$/, ".ts"), "utf-8")
  expect(source).not.toContain('parts[2] === "Формы"')
  expect(source).not.toContain('parts[2] === "Макеты"')
  expect(source).not.toContain('rule.itemType === "MetadataCatalog"')
  expect(source).not.toContain('rule.type === "ChildFormNames"')
  expect(source).not.toContain('rule.type === "ChildTemplateNames"')
})

it("maps form YAML through declarative route source", () => {
  const area = resolveXmlSyncAreaForProjectPath(
    "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
    [MetadataCatalogRules],
  )
  expect(area).toMatchObject({
    kind: "fileItem",
    itemName: "Товары",
    childName: "ФормаЭлемента",
    xmlPath: "Catalogs/Товары/Forms/ФормаЭлемента.xml",
    writer: { propertyType: "ChildFormNames" },
  })
})
```

Adjust the existing expectation from `xmlBasePath` to `xmlPath`.

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts
```

Expected: FAIL because `xmlAreas.ts` still has hard-coded forms and `MetadataCatalog`.

- [ ] **Step 3: Change `XmlSyncArea` to route-backed shape**

In `packages/core/metadata/orchestration/appliedObject/xmlAreas.ts`, update the `fileItem` branch of `XmlSyncArea`:

```ts
| {
    kind: "fileItem"
    itemType: MetadataItemRule["itemType"]
    itemTypePrefix: string
    itemName: string
    childName: string
    xmlDir: string
    xmlPath: string
    ownerCompositionChanges: boolean
    writer: { propertyName: string; propertyType: PropertyRule["type"] }
  }
```

Update `externalFile` similarly:

```ts
writer?: { propertyName: string; propertyType: PropertyRule["type"] }
```

- [ ] **Step 4: Implement route-based resolution**

Replace hard-coded form handling with:

```ts
const ownerRelativePath = parts.slice(2).join("/")
for (const route of describeMetadataRuleXmlSyncRoutes(rule)) {
  const match = matchProjectPattern(route.yamlPattern, ownerRelativePath)
  if (!match) continue

  if (route.kind === "resourceOnly") return undefined

  const patternParams = {
    ...match,
    ownerName: itemName,
    dumpRoot: dumpRoot(rule),
  }
  const xmlPath = posix.join(xmlDir, itemName, expandProjectPattern(route.xmlPathPattern, patternParams))

  if (route.kind === "owner") {
    return { kind: "owner", itemType: rule.itemType, itemTypePrefix, itemName, xmlDir }
  }

  const writer =
    route.source.kind === "property"
      ? { propertyName: route.source.propertyName, propertyType: route.source.propertyType }
      : undefined

  if (route.kind === "fileItem") {
    return {
      kind: "fileItem",
      itemType: rule.itemType,
      itemTypePrefix,
      itemName,
      childName: match.itemName ?? "",
      xmlDir,
      xmlPath,
      ownerCompositionChanges: false,
      writer: requireWriter(writer, projectPath),
    }
  }

  return {
    kind: "externalFile",
    itemType: rule.itemType,
    itemTypePrefix,
    itemName,
    childName: match.itemName,
    xmlDir,
    xmlPath,
    deleteParentAreaBeforeWrite: route.deleteParentAreaBeforeWrite,
    dumpInfoNames: (route.dumpInfoNamePatterns ?? []).map((pattern) => expandProjectPattern(pattern, patternParams)),
    writer,
  }
}
```

Use `externalMetadata.segment` or `XMLRoot.container` in `dumpRoot`; never add an item-type map.

- [ ] **Step 5: Keep declared property areas**

Convert existing `resolveDeclaredArea` into `XmlSyncRoute` generation in `ruleResources.ts` or leave it as a temporary route source if it does not add private metadata knowledge. The accepted temporary rule is: it may read `propertyRule.syncArea`, but it must not check concrete `itemType` or concrete property type names.

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts packages/core/metadata/appliedObjects/configuration/incrementalPlan.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/orchestration/appliedObject/xmlAreas.ts packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts packages/core/metadata/appliedObjects/configuration/incrementalPlan.test.ts packages/core/metadata/project/ruleResources.ts
git commit -m "feat: :sparkles: строить XML области из маршрутов"
```

## Task 5: Use Descriptor Composition Impact In The Incremental Plan

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalPlan.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/incrementalPlan.test.ts`

- [ ] **Step 1: Add failing composition tests**

Add:

```ts
it("does not rebuild Configuration.xml when a form is added", () => {
  const plan = buildIncrementalXmlSyncPlan({
    diff: {
      added: ["Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"],
      changed: [],
      deleted: [],
    },
    rules: [MetadataCatalogRules],
  })

  expect(plan.rebuildConfigurationXml).toBe(false)
})

it("rebuilds Configuration.xml when owner properties are deleted", () => {
  const plan = buildIncrementalXmlSyncPlan({
    diff: {
      added: [],
      changed: [],
      deleted: ["Справочник/Товары/Свойства.yaml"],
    },
    rules: [MetadataCatalogRules],
  })

  expect(plan.rebuildConfigurationXml).toBe(true)
})
```

- [ ] **Step 2: Run tests and verify current behavior**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/appliedObjects/configuration/incrementalPlan.test.ts
```

Expected: at least the new form-added test fails if the current logic treats added `fileItem` through private flags, or passes accidentally. Keep the test either way; it locks the requirement.

- [ ] **Step 3: Add descriptor lookup to the plan**

In `incrementalPlan.ts`, after resolving `area`, compute composition from descriptor/route data rather than from `area.kind`:

```ts
const changesConfigurationComposition =
  params.changeKind !== "changed" && area.compositionImpact === "configurationComposition"
```

If `XmlSyncArea` does not carry `compositionImpact` yet, add it in Task 4 route resolution and set:

- owner `Свойства.yaml`: `"configurationComposition"`;
- child file/resource routes: `"none"`;
- declared external files: `"none"`.

- [ ] **Step 4: Replace boolean parameter with explicit change kind**

Change calls to:

```ts
addPathToPlan({ grouped, path, rules: params.rules, changeKind: "added" })
addPathToPlan({ grouped, path, rules: params.rules, changeKind: "changed" })
addPathToPlan({ grouped, path, rules: params.rules, changeKind: "deleted" })
```

Use:

```ts
type XmlSyncStateChangeKind = "added" | "changed" | "deleted"
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/appliedObjects/configuration/incrementalPlan.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/appliedObjects/configuration/incrementalPlan.ts packages/core/metadata/appliedObjects/configuration/incrementalPlan.test.ts packages/core/metadata/orchestration/appliedObject/xmlAreas.ts
git commit -m "fix: :bug: пересобирать Configuration.xml по descriptor"
```

## Task 6: Execute FileItem Areas And Track Changed XML Files

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts`

- [ ] **Step 1: Add failing integration tests**

Add tests:

```ts
it("writes changed form YAML as a fileItem XML area", async () => {
  const yamlDir = tempDir()
  const xmlDir = tempDir()
  mkdirSync(join(yamlDir, "Справочник", "Контрагенты", "Формы", "ФормаЭлемента"), { recursive: true })
  writeFileSync(join(yamlDir, "Справочник", "Контрагенты", "Свойства.yaml"), "Имя: Контрагенты\n", "utf-8")
  writeFileSync(
    join(yamlDir, "Справочник", "Контрагенты", "Формы", "ФормаЭлемента", "Форма.yaml"),
    "Имя: ФормаЭлемента\nСиноним:\n  ru: Новая форма\n",
    "utf-8",
  )
  const current = await hashProjectFiles(yamlDir)
  await writeXmlSyncState(xmlDir, {
    version: 1,
    files: {
      ...current,
      "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml": "xxh3-64:0000000000000000",
    },
  })

  const result = await syncConfigurationIncrementallyToXML({
    context: baseContext(),
    inputDir: yamlDir,
    outputDir: xmlDir,
    referenceDir: join(__dirname, "__fixtures__", "syncConfiguration", "xml"),
  })

  expect(result.failed).toEqual([])
  expect(result.changedXmlFiles).toContain("Catalogs/Контрагенты/Forms/ФормаЭлемента.xml")
  expect(readFileSync(join(xmlDir, "Catalogs", "Контрагенты", "Forms", "ФормаЭлемента.xml"), "utf-8")).toContain(
    "Новая форма",
  )
  expect(existsSync(join(xmlDir, "Catalogs", "Контрагенты.xml"))).toBe(false)
})
```

If `__dirname` is unavailable in ESM tests, use `fileURLToPath(new URL(".", import.meta.url))`.

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
```

Expected: FAIL because `fileItem` is skipped or `changedXmlFiles` is missing.

- [ ] **Step 3: Extend result type**

In `packages/core/metadata/appliedObjects/configuration/convertFromXML.ts`, extend `ConfigurationSyncResult`:

```ts
changedXmlFiles?: string[]
```

Existing callers must continue to work when it is absent.

- [ ] **Step 4: Add changed-file tracking helpers**

In `incrementalSyncToXML.ts`, add:

```ts
async function snapshotFiles(outputDir: string, projectPaths: string[]): Promise<Map<string, string | undefined>> {
  const result = new Map<string, string | undefined>()
  for (const projectPath of projectPaths) {
    const absolutePath = join(outputDir, projectPath)
    result.set(projectPath, fs.existsSync(absolutePath) ? await fs.promises.readFile(absolutePath, "utf-8") : undefined)
  }
  return result
}

async function collectChangedFiles(
  outputDir: string,
  before: Map<string, string | undefined>,
  projectPaths: string[],
): Promise<string[]> {
  const changed: string[] = []
  for (const projectPath of projectPaths) {
    const absolutePath = join(outputDir, projectPath)
    const after = fs.existsSync(absolutePath) ? await fs.promises.readFile(absolutePath, "utf-8") : undefined
    if (before.get(projectPath) !== after) changed.push(projectPath)
  }
  return changed.sort((left, right) => left.localeCompare(right, "ru"))
}
```

Only pass text XML/BSL paths here. Do not read binary asset paths through this helper.

- [ ] **Step 5: Execute `fileItem` exhaustively**

Replace the current loop with an exhaustive switch:

```ts
switch (planned.area.kind) {
  case "owner":
    await syncAppliedObjectAreaToXML(...)
    break
  case "externalFile":
    await syncAppliedObjectAreaToXML(...)
    break
  case "fileItem":
    await syncRegisteredXmlWriter({ planned, rule, params, dumpInfoNames })
    break
  default:
    assertNever(planned.area)
}
```

Implement `syncRegisteredXmlWriter`:

```ts
const writer = getTypeRule(planned.area.writer.propertyType, "xmlSyncWriter")
if (!writer) throw new Error(`Нет XML writer для ${planned.area.writer.propertyType}`)
const propertyRule = rule.properties[planned.area.writer.propertyName]
if (!propertyRule) throw new Error(`Не найдено свойство ${planned.area.writer.propertyName}`)
await writer({
  context: { ...params.context, exportToXML: { ...params.context.exportToXML } },
  rule: propertyRule,
  nkdkDir: join(params.inputDir, rule.itemTypePrefix, planned.area.itemName),
  xmlDir: join(params.outputDir, rule.xmlDir, planned.area.itemName),
  name: planned.area.itemName,
  itemName: planned.area.childName,
  referenceDir: params.referenceDir
    ? join(params.referenceDir, rule.xmlDir, planned.area.itemName)
    : join(params.outputDir, rule.xmlDir, planned.area.itemName),
})
```

- [ ] **Step 6: Return changed XML files after successful state write**

Before writes, snapshot paths:

```ts
const expectedOutputPaths = [
  ...(plan.rebuildConfigurationXml ? [CONFIGURATION_XML_FILE] : []),
  ...plan.areas.map((item) => item.area.kind === "owner"
    ? `${item.area.xmlDir}/${item.area.itemName}.xml`
    : item.area.xmlPath),
]
const before = await snapshotFiles(params.outputDir, expectedOutputPaths)
```

After writes and state update:

```ts
const changedXmlFiles = await collectChangedFiles(params.outputDir, before, expectedOutputPaths)
return { succeeded: plan.areas.length, failed: [], changedXmlFiles }
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/appliedObjects/configuration/convertFromXML.ts packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
git commit -m "fix: :bug: выполнять fileItem области XML sync"
```

## Task 7: Move Project Resource Discovery To Descriptors

**Files:**
- Modify: `packages/core/metadata/project/resources.ts`
- Modify: `packages/core/metadata/project/syncStateFiles.ts`
- Test: `packages/core/metadata/project/resources.test.ts`
- Test: `packages/core/metadata/project/syncStateFiles.test.ts`

- [ ] **Step 1: Add failing architecture tests**

In `resources.test.ts`, add:

```ts
it("does not hard-code form folders in project resource discovery", () => {
  const source = readFileSync(new URL("./resources.ts", import.meta.url), "utf-8")
  expect(source).not.toContain('parts[2] === "Формы"')
  expect(source).not.toContain('join(kindDir, ownerEntry.name, "Формы")')
})
```

In `syncStateFiles.test.ts`, add:

```ts
it("does not hard-code ChildFormNames or ChildTemplateNames in sync-state discovery", () => {
  const source = readFileSync(new URL("./syncStateFiles.ts", import.meta.url), "utf-8")
  expect(source).not.toContain('propertyRule.type === "ChildFormNames"')
  expect(source).not.toContain('propertyRule.type === "ChildTemplateNames"')
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/resources.test.ts packages/core/metadata/project/syncStateFiles.test.ts
```

Expected: FAIL because discovery still has hard-coded form logic or old type checks.

- [ ] **Step 3: Classify paths through descriptors**

In `resources.ts`, replace `matchFormPath` with a generic descriptor matcher:

```ts
function matchDescriptorPath(parts: string[], projectPath: string): MetadataProjectResourceRef | undefined {
  const owner = createOwner(parts[0], parts[1])
  if (!owner) return undefined
  const relativePath = parts.slice(2).join("/")

  for (const descriptor of describeMetadataRuleProjectResources(owner.spec.rule)) {
    if (descriptor.kind !== "yaml") continue
    const match = matchProjectPattern(descriptor.projectPattern, relativePath)
    if (!match) continue
    if (descriptor.role === "properties") return { kind: "yaml", role: "properties", projectPath, owner, nesting: [] }
    if (descriptor.role === "fileItem") {
      return { kind: "yaml", role: "form", projectPath, owner, formName: match.itemName ?? "" }
    }
  }
  return undefined
}
```

Keep the public `MetadataProjectFormYamlRef` type for compatibility, but source it from descriptors.

- [ ] **Step 4: Discover resources by walking descriptor patterns**

In `discoverMetadataProjectResources`, for each owner directory, collect existing files from descriptors:

```ts
for (const descriptor of describeMetadataRuleProjectResources(spec.rule)) {
  if (descriptor.kind !== "yaml") continue
  collectDescriptorResources(projectRoot, join(kindDir, ownerEntry.name), descriptor, resources)
}
```

Implement `collectDescriptorResources` by walking fixed path segments and expanding `{itemName}` as one directory level. For this task, support the patterns used by descriptors:

- `Свойства.yaml`;
- `Формы/{itemName}/Форма.yaml`;
- `Макеты/{itemName}/Template.xml`;
- `Шаблоны/{itemName}/Template.xml`.

Throw a clear error in tests if a new unsupported pattern shape appears.

- [ ] **Step 5: Convert sync-state matchers**

In `syncStateFiles.ts`, make `collectRulePathMatchers` add paths from `describeMetadataRuleProjectResources(rule)`:

```ts
for (const resource of describeMetadataRuleProjectResources(rule)) {
  if (resource.kind === "yaml") addPathValueMatcher(matchers, basePattern, resource.projectPattern, { family: false })
  if (resource.kind === "directory") addDirectoryMatcher(matchers, basePattern, resource.projectPattern)
}
```

Keep existing generic handling for `filePath`, `nkdkDir`, `nkdkPath`, `externalFile`, `syncExternalOnly` and child collections. Remove concrete property type checks for forms/templates.

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/resources.test.ts packages/core/metadata/project/syncStateFiles.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/project/resources.ts packages/core/metadata/project/syncStateFiles.ts packages/core/metadata/project/resources.test.ts packages/core/metadata/project/syncStateFiles.test.ts
git commit -m "refactor: :recycle: искать project ресурсы по descriptor"
```

## Task 8: Move Directory Structure To Descriptors

**Files:**
- Modify: `packages/core/metadata/project/directoryStructure.ts`
- Test: `packages/core/metadata/project/directoryStructure.test.ts`

- [ ] **Step 1: Add failing architecture test**

Add:

```ts
it("does not hard-code forms in directory structure", () => {
  const source = readFileSync(new URL("./directoryStructure.ts", import.meta.url), "utf-8")
  expect(source).not.toContain('parts[2] === FORMS_DIR')
  expect(source).not.toContain('directory(FORMS_DIR')
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/directoryStructure.test.ts
```

Expected: FAIL because directory structure still has a hard-coded forms branch.

- [ ] **Step 3: Generate nodes from descriptors**

Replace `forms` and `form` `DirectoryPosition` variants with a generic descriptor position:

```ts
| { kind: "descriptorDirectory"; dir: string; ownerName: string; spec: MetadataProjectSpec; path: string }
```

In `metadataObjectNode`, build children from:

```ts
descriptorNodes(position.spec.rule, directoryPath)
```

Implement `descriptorNodes` so `Формы/{itemName}/Форма.yaml` becomes:

```ts
directory("Формы", "resourceDirectory", `${objectPath}/Формы`, "Каталог ресурсов metadata-объекта", false, false, [
  directory("<Имя>", "fileItem", `${objectPath}/Формы/<Имя>`, "Каталог дочернего файлового ресурса", false, true, [
    file("Форма.yaml", "fileItemYaml", `${objectPath}/Формы/<Имя>/Форма.yaml`, "YAML-файл дочернего файлового ресурса", true),
  ]),
])
```

The labels can be generic; do not mention forms in common code.

- [ ] **Step 4: Keep subsystem directory handling**

Subsystem nesting is allowed as existing behavior. If possible, express it through descriptors later, but do not block this task on a full subsystem rewrite.

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/directoryStructure.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/project/directoryStructure.ts packages/core/metadata/project/directoryStructure.test.ts
git commit -m "refactor: :recycle: описывать структуру проекта по descriptor"
```

## Task 9: Print Changed XML Files In CLI And MCP-Safe Result

**Files:**
- Modify: `packages/cli/src/commands/sync.ts`
- Modify: `packages/cli/src/commands/sync.test.ts`
- Modify: `packages/mcp/src/services/syncToXml.ts`
- Modify: `packages/mcp/src/services/syncToXml.test.ts`

- [ ] **Step 1: Add failing CLI test**

In `packages/cli/src/commands/sync.test.ts`, make the incremental mock return:

```ts
{ succeeded: 1, failed: [], changedXmlFiles: ["Catalogs/Товары/Forms/ФормаЭлемента.xml"] }
```

Add assertion:

```ts
expect(stdout).toContain("Изменены файлы:")
expect(stdout).toContain("Catalogs/Товары/Forms/ФормаЭлемента.xml")
```

Also add a no-change assertion where `changedXmlFiles: []` does not print `Изменены файлы:`.

- [ ] **Step 2: Run CLI tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/cli test -- packages/cli/src/commands/sync.test.ts
```

Expected: FAIL because CLI does not print changed XML files.

- [ ] **Step 3: Implement CLI output**

In `packages/cli/src/commands/sync.ts`, after the `Готово` line:

```ts
if (hasState && result.changedXmlFiles !== undefined && result.changedXmlFiles.length > 0) {
  process.stdout.write("Изменены файлы:\n")
  for (const file of result.changedXmlFiles) {
    process.stdout.write(`${file}\n`)
  }
}
```

- [ ] **Step 4: Keep MCP compatible**

If `packages/mcp/src/services/syncToXml.ts` narrows result fields, add `changedXmlFiles` to its returned details without changing existing fields. If it only passes through `succeeded`/`failed`, no visible MCP change is required; update tests only if TypeScript requires it.

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/cli test -- packages/cli/src/commands/sync.test.ts
pnpm --filter @nakidka/mcp test -- packages/mcp/src/services/syncToXml.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/commands/sync.ts packages/cli/src/commands/sync.test.ts packages/mcp/src/services/syncToXml.ts packages/mcp/src/services/syncToXml.test.ts
git commit -m "feat: :sparkles: выводить измененные XML файлы"
```

## Task 10: Add Partial-Vs-Full Coverage And Final Verification

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts`
- Modify as needed: tests touched in earlier tasks

- [ ] **Step 1: Add partial-vs-full test on temporary directories**

In `incrementalSyncToXML.test.ts`, add a test that:

1. Creates a minimal YAML project with `Конфигурация.yaml`, `Справочник/Контрагенты/Свойства.yaml` and `Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml`.
2. Runs full `syncConfigurationToXML` into `fullXmlDir`.
3. Writes sync state for `partialXmlDir`.
4. Changes only `Форма.yaml`.
5. Runs `syncConfigurationIncrementallyToXML` into `partialXmlDir`.
6. Runs full sync again into `expectedXmlDir`.
7. Compares only `Catalogs/Контрагенты/Forms/ФормаЭлемента.xml` between partial and expected directories.

Use temp directories only. Do not use `/Users/nikita/git/nkdk-yaml` or `/Users/nikita/git/round-trip/erp` in automated tests.

- [ ] **Step 2: Run focused integration tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run architecture boundary search**

Run:

```bash
rg -n 'MetadataCatalog|ChildFormNames|ChildTemplateNames|parts\\[2\\] === "Формы"|parts\\[2\\] === "Макеты"|rule\\.itemType ===' packages/core/metadata/orchestration packages/core/metadata/project
```

Expected:

- No private checks in `packages/core/metadata/orchestration/**` or `packages/core/metadata/project/**`.
- Allowed mentions only in tests that assert absence, type definitions, or comments explaining forbidden patterns.

- [ ] **Step 4: Run focused package tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/ruleResources.test.ts packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts packages/core/metadata/appliedObjects/configuration/incrementalPlan.test.ts packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts packages/core/metadata/project/resources.test.ts packages/core/metadata/project/directoryStructure.test.ts packages/core/metadata/project/syncStateFiles.test.ts
pnpm --filter @nakidka/cli test -- packages/cli/src/commands/sync.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS in all packages.

- [ ] **Step 6: Optional manual real-project smoke test**

Only after automated tests pass, run:

```bash
pnpm --filter @nakidka/cli dev -- sync /Users/nikita/git/nkdk-yaml /Users/nikita/git/round-trip/erp --reference-dir /Users/nikita/git/round-trip/erp
```

Expected:

- CLI prints changed XML files when content changes.
- A change in `Справочник/Бригады/Формы/ФормаЭлемента/Форма.yaml` updates `Catalogs/Бригады/Forms/ФормаЭлемента.xml`.
- `.nkdk-sync.bin` updates only after successful writes.

- [ ] **Step 7: Commit final test coverage**

```bash
git add packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
git commit -m "test: :white_check_mark: проверить partial XML sync"
```

## Self-Review

- Spec coverage: covered declarative resources/routes, no private orchestration knowledge, sync-state discovery, directory structure, exhaustive execution, state update after success, changed XML output and temp-dir tests.
- Placeholder scan: no unfinished markers or intentionally vague steps.
- Type consistency: new operation names are `projectResources`, `xmlSyncRoutes`, `xmlSyncWriter`; descriptor field is `compositionImpact: "configurationComposition" | "none"`; route fields are `yamlPattern` and `xmlPathPattern`.
- Scope check: one implementation plan is acceptable because all work is one incremental sync slice; tasks are ordered so each commit is testable.
