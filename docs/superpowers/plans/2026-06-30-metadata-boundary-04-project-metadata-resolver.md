# Project Metadata Resolver Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Разделить нейтральный `ProjectMetadataResolver` и предметные resolvers, чтобы validation больше не знала конкретные metadata roots, member collections, child file folders и inline collections.

**Architecture:** `ProjectMetadataResolver` остаётся фасадом с текущим публичным API, но делегирует object path, member, value, child file и filter resolution в registry. Concrete rules регистрируют resolvers рядом с объектами, переиспользуя project descriptors из плана 2 и metadata-target/file-child descriptors из плана 3.

**Tech Stack:** TypeScript 5.9, Vitest, pnpm, existing `ProjectYamlCache`, `OwnerMetadataCache`, metadata target parser types.

---

## Scope Check

Этот план покрывает пункт 6 спеки. Он зависит от project descriptors и metadata-target owner/file-child descriptors. Он не меняет `DataPathResolverRegistry`, кроме использования уже существующих `objectFields` через текущий `OwnerMetadataCache`.

## File Structure

- Create: `packages/core/metadata/validation/projectMetadataResolverRegistry.ts`
  - Registry for object paths, member collections, values, child file lookup, style/common resource resolvers.
- Modify: `packages/core/metadata/validation/projectMetadataResolver.ts`
  - Delegate to registered resolvers and keep public `ProjectMetadataResolver` API.
- Modify: `packages/core/metadata/validation/metadataTargetTraversal.ts`
  - No behavior change; use the same resolver interface.
- Modify: `packages/core/metadata/validation/validateProject.ts`
  - Use registered project/resource descriptors for form path and configuration required keys.
- Modify: object/common `register.ts` files listed in tasks
  - Register object roots, member collections, value collections and inline nested objects.
- Test: `packages/core/metadata/validation/projectMetadataResolverRegistry.test.ts`
- Test: `packages/core/metadata/validation/projectMetadataResolver.test.ts`
- Test: `packages/core/metadata/validation/metadataTargetTraversal.test.ts`
- Test: `packages/core/metadata/importBoundaries.test.ts`

## Task 0: Preflight

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `docs/superpowers/specs/2026-06-28-metadata-layer-boundary-violations-spec.md`
- Read: `packages/core/metadata/validation/projectMetadataResolver.ts`

- [ ] **Step 1: Check metadata knowledge**

Run:

```bash
test -f .agents/knowledge/metadata/INDEX.md && sed -n '1,260p' .agents/knowledge/metadata/INDEX.md || echo "metadata knowledge index is missing"
```

Expected: the file is read, or the command prints `metadata knowledge index is missing`.

- [ ] **Step 2: Read resolver section of the spec**

Run:

```bash
sed -n '430,520p' docs/superpowers/specs/2026-06-28-metadata-layer-boundary-violations-spec.md
```

Expected: output includes `ProjectMetadataResolver`.

## Task 1: Add Resolver Registry

**Files:**
- Create: `packages/core/metadata/validation/projectMetadataResolverRegistry.ts`
- Test: `packages/core/metadata/validation/projectMetadataResolverRegistry.test.ts`

- [ ] **Step 1: Write registry tests**

Create `packages/core/metadata/validation/projectMetadataResolverRegistry.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest"
import type { ParsedMetadataTarget } from "~/metadata/commonObjects/metadataTargets"
import {
  clearProjectMetadataResolverRegistryForTests,
  getProjectObjectPathResolver,
  getProjectMemberResolver,
  registerProjectMemberResolver,
  registerProjectObjectPathResolver,
} from "./projectMetadataResolverRegistry"

describe("projectMetadataResolverRegistry", () => {
  beforeEach(() => clearProjectMetadataResolverRegistryForTests())

  it("registers object path and member resolvers by root/kind", () => {
    registerProjectObjectPathResolver("Document", ({ projectDir, target }) => ({
      filePath: `${projectDir}/Документ/${target.objectName}/Свойства.yaml`,
    }))
    registerProjectMemberResolver("Form", ({ ownerFilePath, segment }) => ({
      ok: true,
      filePath: `${ownerFilePath}/../Формы/${segment.name}/Форма.yaml`,
      details: { kind: "Form", name: segment.name, item: segment.name },
    }))

    const target = { kind: "object", root: "Document", objectName: "Заказ" } as Extract<ParsedMetadataTarget, { kind: "object" }>
    expect(getProjectObjectPathResolver("Document")?.({ projectDir: "/p", target })).toEqual({
      filePath: "/p/Документ/Заказ/Свойства.yaml",
    })
    expect(getProjectMemberResolver("Form")).toBeTypeOf("function")
  })
})
```

- [ ] **Step 2: Run and confirm failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectMetadataResolverRegistry.test.ts --no-isolate
```

Expected: FAIL because registry file does not exist.

- [ ] **Step 3: Implement registry**

Create `packages/core/metadata/validation/projectMetadataResolverRegistry.ts`:

```ts
import type {
  MetadataMemberKind,
  MetadataRootName,
  ParsedMetadataTarget,
  StyleItemTargetType,
} from "~/metadata/commonObjects/metadataTargets"
import type { OwnerMetadata, OwnerMetadataCache } from "./dataPath/ownerCache"
import type { ProjectYamlCache } from "./projectYamlCache"
import type { Diagnostic } from "./types"

export type MetadataResolveResult =
  | { ok: true; filePath?: string; details?: unknown }
  | { ok: false; diagnostics: Diagnostic[] }

export type ProjectObjectPathResolver = (params: {
  projectDir: string
  target: Extract<ParsedMetadataTarget, { kind: "object" }>
}) => { filePath: string } | undefined

export type ProjectMemberResolver = (params: {
  projectDir: string
  ownerFilePath: string
  owner: OwnerMetadata
  rawYaml: unknown
  segment: Extract<ParsedMetadataTarget, { kind: "member" }>["segments"][number]
  target: Extract<ParsedMetadataTarget, { kind: "member" }>
  yamlCache: ProjectYamlCache
  ownerCache: OwnerMetadataCache
}) => MetadataResolveResult | undefined

export type ProjectValueResolver = (params: {
  owner: OwnerMetadata
  target: Extract<ParsedMetadataTarget, { kind: "value" }>
}) => MetadataResolveResult | undefined

export type ProjectNamedResourceResolver = (params: {
  projectDir: string
  name: string
  expectedTypes?: readonly StyleItemTargetType[]
  yamlCache: ProjectYamlCache
}) => MetadataResolveResult

const objectPathResolvers = new Map<MetadataRootName, ProjectObjectPathResolver>()
const memberResolvers = new Map<MetadataMemberKind, ProjectMemberResolver[]>()
const valueResolvers = new Map<MetadataRootName, ProjectValueResolver>()
const namedResourceResolvers = new Map<string, ProjectNamedResourceResolver>()

export function registerProjectObjectPathResolver(root: MetadataRootName, resolver: ProjectObjectPathResolver): void {
  objectPathResolvers.set(root, resolver)
}

export function getProjectObjectPathResolver(root: MetadataRootName): ProjectObjectPathResolver | undefined {
  return objectPathResolvers.get(root)
}

export function registerProjectMemberResolver(kind: MetadataMemberKind, resolver: ProjectMemberResolver): void {
  memberResolvers.set(kind, [...(memberResolvers.get(kind) ?? []), resolver])
}

export function getProjectMemberResolvers(kind: MetadataMemberKind): readonly ProjectMemberResolver[] {
  return memberResolvers.get(kind) ?? []
}

export function getProjectMemberResolver(kind: MetadataMemberKind): ProjectMemberResolver | undefined {
  return getProjectMemberResolvers(kind)[0]
}

export function registerProjectValueResolver(root: MetadataRootName, resolver: ProjectValueResolver): void {
  valueResolvers.set(root, resolver)
}

export function getProjectValueResolver(root: MetadataRootName): ProjectValueResolver | undefined {
  return valueResolvers.get(root)
}

export function registerProjectNamedResourceResolver(kind: string, resolver: ProjectNamedResourceResolver): void {
  namedResourceResolvers.set(kind, resolver)
}

export function getProjectNamedResourceResolver(kind: string): ProjectNamedResourceResolver | undefined {
  return namedResourceResolvers.get(kind)
}

export function clearProjectMetadataResolverRegistryForTests(): void {
  objectPathResolvers.clear()
  memberResolvers.clear()
  valueResolvers.clear()
  namedResourceResolvers.clear()
}
```

- [ ] **Step 4: Run registry test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectMetadataResolverRegistry.test.ts --no-isolate
```

Expected: PASS.

## Task 2: Delegate Object Path Resolution

**Files:**
- Modify: `packages/core/metadata/validation/projectMetadataResolver.ts`
- Modify: project/object registration files
- Test: `packages/core/metadata/validation/projectMetadataResolver.test.ts`

- [ ] **Step 1: Add object path source guard**

Add to `projectMetadataResolver.test.ts`:

```ts
  it("does not hard-code object root directories in ProjectMetadataResolver", () => {
    const source = readFileSync(join(process.cwd(), "metadata/validation/projectMetadataResolver.ts"), "utf-8")

    expect(source).not.toContain("objectRootDir")
    expect(source).not.toContain("DocumentNumerator")
    expect(source).not.toContain("rootToYAML")
  })
```

Add imports if missing:

```ts
import { readFileSync } from "fs"
import { join } from "path"
```

- [ ] **Step 2: Register object path resolvers from project specs**

In the registration entrypoint that imports project specs after plan 2, add:

```ts
for (const spec of metadataProjectSpecs) {
  const owner = spec.rule.metadataTargetOwner
  if (owner?.kind !== "self") continue
  registerProjectObjectPathResolver(owner.root, ({ projectDir, target }) => ({
    filePath: join(projectDir, spec.dir, target.objectName, "Свойства.yaml"),
  }))
}
```

For configuration root-like cases that have no object path, do not register an object resolver.

- [ ] **Step 3: Use object path resolver in `resolveObject(...)`**

In `projectMetadataResolver.ts`, replace `objectFilePath(projectDir, target.root, target.objectName)` with:

```ts
const objectPath = getProjectObjectPathResolver(target.root)?.({ projectDir, target })
const filePath = objectPath?.filePath
if (!filePath || !existsSync(filePath)) {
  return referenceError(filePath ?? projectDir, `Не найден объект "${formatObjectTarget(target)}"`)
}
```

Delete `objectFilePath(...)`, `objectRootDir(...)`, and `nestedObjectFolderName(...)` after nested path resolution is moved in Task 3.

- [ ] **Step 4: Run object path tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectMetadataResolver.test.ts --no-isolate
```

Expected: existing object resolution tests pass.

## Task 3: Register Nested Object Path Resolvers

**Files:**
- Modify: external data source nested object register files
- Modify: `packages/core/metadata/validation/projectMetadataResolver.ts`
- Test: `packages/core/metadata/validation/projectMetadataResolver.test.ts`

- [ ] **Step 1: Register external data source nested paths**

In external data source table/cube/dimension table registrations, add object path resolvers:

```ts
registerProjectObjectPathResolver("ExternalDataSource", ({ projectDir, target }) => {
  if (!target.segments || target.segments.length === 0) {
    return { filePath: join(projectDir, "ВнешнийИсточникДанных", target.objectName, "Свойства.yaml") }
  }

  const parts = [projectDir, "ВнешнийИсточникДанных", target.objectName]
  for (const segment of target.segments) {
    if (segment.kind === "Table") parts.push("Таблицы", segment.objectName)
    if (segment.kind === "Cube") parts.push("Кубы", segment.objectName)
    if (segment.kind === "DimensionTable") parts.push("ТаблицыИзмерений", segment.objectName)
    if (segment.kind === "Function") parts.push("Функции", segment.objectName)
  }
  return { filePath: join(...parts, "Свойства.yaml") }
})
```

Create one `registerExternalDataSourceProjectResolvers()` helper and call it once from `metadataExternalDataSource/register.ts`, so this resolver is registered in a single place.

- [ ] **Step 2: Register subsystem nested paths**

In `metadataSubsystem/register.ts`, add:

```ts
registerProjectObjectPathResolver("Subsystem", ({ projectDir, target }) => {
  const parts = [projectDir, "Подсистема", target.objectName]
  for (const segment of target.segments ?? []) {
    if (segment.kind !== "Subsystem") return undefined
    parts.push("Подсистемы", segment.objectName)
  }
  return { filePath: join(...parts, "Свойства.yaml") }
})
```

- [ ] **Step 3: Remove nested object path switch from `ProjectMetadataResolver`**

In `resolveObject(...)`, use the same registered object path resolver for `target.segments`:

```ts
const nestedPath = getProjectObjectPathResolver(target.root)?.({ projectDir, target })
if (target.segments && target.segments.length > 0) {
  if (nestedPath?.filePath && existsSync(nestedPath.filePath)) return { ok: true, filePath: nestedPath.filePath }
  const inlineObject = resolveRegisteredInlineObject({ target, yamlCache: params.yamlCache, ownerCache })
  if (inlineObject) return inlineObject
  return referenceError(nestedPath?.filePath ?? filePath, `Не найден объект "${formatObjectTarget(target)}"`)
}
```

- [ ] **Step 4: Run resolver tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectMetadataResolver.test.ts --no-isolate
```

Expected: PASS.

## Task 4: Register Member and Child File Resolvers

**Files:**
- Modify: object/common register files
- Modify: `packages/core/metadata/validation/projectMetadataResolver.ts`
- Test: `packages/core/metadata/validation/projectMetadataResolver.test.ts`

- [ ] **Step 1: Register member collections**

Register direct member collections with exact YAML/model names:

```ts
registerProjectMemberResolver("Form", createCollectionMemberResolver({ modelName: "forms", yamlName: "Формы" }))
registerProjectMemberResolver("Template", createCollectionMemberResolver({ modelName: "templates", yamlName: "Макеты" }))
registerProjectMemberResolver("Command", createCollectionMemberResolver({ modelName: "commands", yamlName: "Команды" }))
registerProjectMemberResolver("AccountingFlag", createCollectionMemberResolver({ modelName: "accountingFlags", yamlName: "ПризнакиУчета" }))
registerProjectMemberResolver("ExtDimensionAccountingFlag", createCollectionMemberResolver({ modelName: "extDimensionAccountingFlags", yamlName: "ПризнакиУчетаСубконто" }))
registerProjectMemberResolver("Field", createCollectionMemberResolver({ modelName: "fields", yamlName: "Поля" }))
```

Define `createCollectionMemberResolver(...)` in a shared registration helper:

```ts
function createCollectionMemberResolver(params: { modelName: string; yamlName: string }): ProjectMemberResolver {
  return ({ owner, rawYaml, segment }) => {
    const item = memberCollectionItem(
      metadataRecord(owner.model)[params.modelName] ?? metadataRecord(rawYaml)[params.yamlName],
      segment.name
    )
    return item === undefined
      ? undefined
      : { ok: true, filePath: owner.filePath, details: { kind: segment.kind, name: segment.name, item } }
  }
}
```

- [ ] **Step 2: Register child file member resolvers using `fileChildNamesDescriptor`**

In `childFormNames` registration:

```ts
registerProjectMemberResolver("Form", ({ ownerFilePath, segment }) => {
  const filePath = join(dirname(ownerFilePath), "Формы", segment.name, "Форма.yaml")
  return existsSync(filePath)
    ? { ok: true, filePath, details: { kind: "Form", name: segment.name, item: segment.name } }
    : undefined
})
```

In `childTemplateNames` registration:

```ts
registerProjectMemberResolver("Template", ({ ownerFilePath, segment }) => {
  const templateDir = join(dirname(ownerFilePath), "Шаблоны", segment.name)
  for (const fileName of ["Template.xml", "Template.txt", "Template.bin"]) {
    const filePath = join(templateDir, fileName)
    if (existsSync(filePath)) return { ok: true, filePath, details: { kind: "Template", name: segment.name, item: segment.name } }
  }
  return undefined
})
```

- [ ] **Step 3: Delegate member resolution**

In `resolveMemberSegments(...)`, after field handling and before returning `нет сегмента`, iterate registered resolvers:

```ts
for (const resolver of getProjectMemberResolvers(firstSegment.kind)) {
  const resolved = resolver({
    projectDir,
    ownerFilePath: owner.filePath,
    owner,
    rawYaml: params.rawYaml,
    segment: firstSegment,
    target,
    yamlCache,
    ownerCache,
  })
  if (resolved !== undefined) return resolved.ok ? { ok: true, details: resolved.details as ResolvedMemberDetails } : { ok: false, message: resolved.diagnostics[0]?.message ?? "не найдено" }
}
```

Pass `projectDir`, `target`, `yamlCache` and `ownerCache` into `resolveMemberSegments(...)`.

- [ ] **Step 4: Delete hard-coded member helpers**

Delete `resolveChildFormFile(...)`, `resolveChildTemplateFile(...)`, `memberCollectionName(...)`, `memberCollectionYamlName(...)` from `projectMetadataResolver.ts`.

- [ ] **Step 5: Run member tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectMetadataResolver.test.ts --no-isolate
```

Expected: PASS.

## Task 5: Register Values and Named Resources

**Files:**
- Modify: object/common register files
- Modify: `packages/core/metadata/validation/projectMetadataResolver.ts`
- Test: `packages/core/metadata/validation/projectMetadataResolver.test.ts`

- [ ] **Step 1: Register enum/predefined value resolvers**

In enumeration/predefined registrations:

```ts
registerProjectValueResolver("Enum", ({ owner, target }) => {
  const values = metadataRecord(owner.model).enumValues
  return hasNamedItem(values, target.valueName) ? { ok: true, filePath: owner.filePath } : undefined
})

registerProjectValueResolver("Catalog", ({ owner, target }) => {
  const values = metadataRecord(owner.model).predefined
  return hasNamedItem(values, target.valueName) ? { ok: true, filePath: owner.filePath } : undefined
})
```

Register the same predefined resolver for these roots, because their current metadata-target behavior reads `model.predefined`:

```ts
for (const root of [
  "Catalog",
  "ChartOfAccounts",
  "ChartOfCalculationTypes",
  "ChartOfCharacteristicTypes",
  "ExchangePlan",
] as const) {
  registerProjectValueResolver(root, ({ owner, target }) => {
    const values = metadataRecord(owner.model).predefined
    return hasNamedItem(values, target.valueName) ? { ok: true, filePath: owner.filePath } : undefined
  })
}
```

- [ ] **Step 2: Register style item and common picture named resources**

In `metadataStyleItem/register.ts`:

```ts
registerProjectNamedResourceResolver("StyleItem", ({ projectDir, name, expectedTypes = [], yamlCache }) => {
  const filePath = join(projectDir, "ЭлементСтиля", name, "Свойства.yaml")
  if (!existsSync(filePath)) return referenceError(filePath, `Не найден элемент стиля "ЭлементСтиля.${name}"`)
  const styleItemType = readStyleItemType({ filePath, yamlCache })
  if (styleItemType && expectedTypes.length > 0 && !expectedTypes.includes(styleItemType)) {
    return referenceError(filePath, `Элемент стиля "ЭлементСтиля.${name}" имеет тип "${styleItemType}", ожидался: ${expectedTypes.join(", ")}`)
  }
  return { ok: true, filePath }
})
```

In `metadataCommonPicture/register.ts`:

```ts
registerProjectNamedResourceResolver("CommonPicture", ({ projectDir, name }) => {
  const filePath = join(projectDir, "ОбщаяКартинка", name, "Свойства.yaml")
  return existsSync(filePath) ? { ok: true, filePath } : referenceError(filePath, `Не найдена общая картинка "ОбщаяКартинка.${name}"`)
})
```

- [ ] **Step 3: Delegate value and named resource methods**

In `ProjectMetadataResolver.resolveValue(...)`, replace enum/predefined branch with:

```ts
const valueResolver = getProjectValueResolver(target.root)
const resolved = valueResolver?.({ owner: owner.owner, target })
if (resolved) return resolved
return referenceError(owner.owner.filePath, `Не найдено значение "${formatValueTarget(target)}"`)
```

In `resolveStyleItem(...)`:

```ts
const resolver = getProjectNamedResourceResolver("StyleItem")
return resolver
  ? resolver({ projectDir, name, expectedTypes, yamlCache: params.yamlCache })
  : referenceError(projectDir, `Не найден элемент стиля "ЭлементСтиля.${name}"`)
```

In `resolveCommonPicture(...)`:

```ts
const resolver = getProjectNamedResourceResolver("CommonPicture")
return resolver
  ? resolver({ projectDir, name, yamlCache: params.yamlCache })
  : referenceError(projectDir, `Не найдена общая картинка "ОбщаяКартинка.${name}"`)
```

- [ ] **Step 4: Run value/resource tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectMetadataResolver.test.ts packages/core/metadata/validation/metadataTargetTraversal.test.ts --no-isolate
```

Expected: PASS.

## Task 6: Move Configuration Required-Key Validation to Rule/Schema Registration

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/register.ts`
- Test: project validation tests

- [ ] **Step 1: Add registered project validator type**

In `projectMetadataResolverRegistry.ts`, add:

```ts
export type ProjectFileValidator = (params: {
  filePath: string
  parsed: ParsedYaml
}) => Diagnostic[]

const projectFileValidators = new Map<string, ProjectFileValidator[]>()

export function registerProjectFileValidator(role: string, validator: ProjectFileValidator): void {
  projectFileValidators.set(role, [...(projectFileValidators.get(role) ?? []), validator])
}

export function getProjectFileValidators(role: string): readonly ProjectFileValidator[] {
  return projectFileValidators.get(role) ?? []
}
```

Import `ParsedYaml`.

- [ ] **Step 2: Register configuration validator**

In `configuration/register.ts`:

```ts
registerProjectFileValidator("configuration", ({ filePath, parsed }) => {
  const data = parsed.data
  if (typeof data === "object" && data !== null && Object.prototype.hasOwnProperty.call(data, "ОсновнойЯзык")) return []
  return [
    diagnosticAtYamlPath({
      filePath,
      parsed,
      path: ["ОсновнойЯзык"],
      severity: "error",
      source: "structure",
      message: 'Обязательное поле "ОсновнойЯзык" отсутствует',
    }),
  ]
})
```

- [ ] **Step 3: Use validators from `validateProject.ts`**

Replace direct `MetadataConfiguration` condition with:

```ts
for (const validator of getProjectFileValidators(resource.role)) {
  diagnostics.push(...validator({ filePath: resource.absolutePath ?? resource.projectPath, parsed: entry.parsed }))
}
```

- [ ] **Step 4: Run project validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/validateProject.test.ts packages/core/metadata/validation/projectFileSchema.test.ts --no-isolate
```

Expected: PASS.

## Task 7: Boundary Guards and Verification

**Files:**
- Modify: `packages/core/metadata/importBoundaries.test.ts`

- [ ] **Step 1: Add resolver boundary guard**

Add:

```ts
  it("ProjectMetadataResolver delegates concrete metadata knowledge to registrations", () => {
    const source = readFileSync(join(METADATA_DIR, "validation", "projectMetadataResolver.ts"), "utf-8")

    for (const forbidden of [
      "Form",
      "Template",
      "ExternalDataSource",
      "StyleItem",
      "CommonPicture",
      "Template.xml",
      "Формы",
      "Шаблоны",
      "Поля",
      "Команды",
      "ПризнакиУчета",
    ]) {
      expect(source).not.toContain(forbidden)
    }
  })
```

- [ ] **Step 2: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectMetadataResolverRegistry.test.ts packages/core/metadata/validation/projectMetadataResolver.test.ts packages/core/metadata/validation/metadataTargetTraversal.test.ts packages/core/metadata/validation/validateProject.test.ts packages/core/metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 3: Run TypeScript and full tests**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
pnpm --filter @nakidka/core test
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```bash
git add packages/core/metadata/validation \
  packages/core/metadata/appliedObjects \
  packages/core/metadata/commonObjects \
  packages/core/metadata/importBoundaries.test.ts
git commit -m "refactor: :recycle: вынести project metadata resolvers"
```

Expected: commit succeeds.
