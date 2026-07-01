# Metadata Rename/Delete Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать в core безопасные операции `list_operation_targets`, `rename_item`, `delete_item` и общий шаг миграций для `sync_to_xml`, а MCP и CLI оставить тонкими входами.

**Architecture:** Новый слой `packages/core/metadata/operations` строит общий снимок YAML-проекта, запускает validation перед изменяющими операциями, разрешает operation target через правила metadata, переписывает структурные ссылки через общий обход правил и применяет единый план файловых изменений. `metadata/project` остается нейтральным описателем проекта, `metadata/orchestration` только расширяется договорами правил, а MCP/CLI вызывают core без разбора YAML. Полная и частичная XML-синхронизация используют один общий шаг проверки и сворачивания миграционной цепочки.

**Tech Stack:** TypeScript 5.9, Vitest, TypeBox, Zod v4, yaml, Node fs/path, existing `MetadataItemRule`, `PropertyRule`, `validateProject`, `discoverMetadataProjectResources`, `syncConfigurationToXML`, `syncConfigurationIncrementallyToXML`.

---

## Scope Check

Спека описывает один сквозной пользовательский сценарий: безопасно переименовать или удалить metadata-цель, затем корректно синхронизировать XML с учетом миграций. Подсистемы зависимы: operation targets нужны rename/delete, миграции нужны rename и sync, reference traversal нужен rename/delete, MCP/CLI должны возвращать тот же core result. Поэтому план один, но задачи дают рабочие проверяемые этапы.

Не менять существующие XML-фикстуры. Не добавлять новые fromXML/toXML/fromYAML/toYAML правила. Не добавлять частные условия по папкам `Формы`, `Макеты`, `ChildFormNames` или конкретным `itemType` в `metadata/project`, `metadata/validation`, `metadata/orchestration/appliedObject`.

## File Structure

- Create: `packages/core/metadata/operations/types.ts`
  - Public core contracts: `MetadataOperationTarget`, operation results, migration result, changed XML file shape.
- Create: `packages/core/metadata/operations/targetSchema.ts`
  - TypeBox schema and runtime guard for `MetadataOperationTarget`.
- Create: `packages/core/metadata/operations/context.ts`
  - Default `ConfigurationContext` for operations.
- Create: `packages/core/metadata/operations/nameRules.ts`
  - Shared metadata name validation and case-insensitive conflict checks.
- Create: `packages/core/metadata/operations/projectSnapshot.ts`
  - Read YAML project resources, parse models through registered project specs, run whole-project validation gate.
- Create: `packages/core/metadata/operations/listOperationTargets.ts`
  - List ready target objects from current YAML project without mandatory validation.
- Create: `packages/core/metadata/operations/targetResolver.ts`
  - Resolve a structured target to model node, YAML file, namespace, migration path and affected resources.
- Create: `packages/core/metadata/operations/references.ts`
  - Traverse model references by property rules and build rewrites/blocked references.
- Create: `packages/core/metadata/operations/dataPathReferences.ts`
  - Collect resolvable DataPath references using existing DataPath resolver and form indexes.
- Create: `packages/core/metadata/operations/filePlan.ts`
  - Build and apply YAML/file/migration write plans; report partial write failure honestly.
- Create: `packages/core/metadata/operations/yamlModelIO.ts`
  - Import/export touched YAML files through model and `exportToYAML`.
- Create: `packages/core/metadata/operations/migrationChain.ts`
  - Strict migration file reading, applied-state validation, sequential collapse, machine-readable chain errors.
- Create: `packages/core/metadata/operations/xmlChanges.ts`
  - Snapshot XML files and report `{ path, change }` for full and partial sync.
- Create: `packages/core/metadata/operations/renameItem.ts`
  - Core `renameMetadataItem` operation.
- Create: `packages/core/metadata/operations/deleteItem.ts`
  - Core `deleteMetadataItem` operation.
- Create: `packages/core/metadata/operations/index.ts`
  - Public exports.
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
  - Add neutral structural-reference type-rule operation.
- Modify: `packages/core/metadata/orchestration/property/types.ts`
  - Add `operationTarget` to `BasePropertyRule`.
- Create: `packages/core/metadata/orchestration/property/operationTargets.ts`
  - Helper builders `namedCollectionTarget` and `fileItemCollectionTarget`.
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
  - Accept the new structural-reference operation key.
- Modify: `packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts`
  - Register structural-reference handlers next to existing validation handlers.
- Modify: `packages/core/metadata/commonObjects/childFormNames/types.ts`
  - Inject `fileItemCollectionTarget` for forms.
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/types.ts`
  - Inject `fileItemCollectionTarget` for templates.
- Modify: `packages/core/metadata/appliedObjects/**/rules.ts`
  - Add `operationTarget` to named UUID/reference collections that are already represented in migration state.
- Modify: `packages/core/metadata/project/ruleResources.ts`
  - Export neutral helpers to read `operationTarget` declarations from rules.
- Modify: `packages/core/metadata/project/index.ts`
  - Export operation-target project helpers.
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/*.ts`
  - Route old migration exports through strict operation migration chain, keeping public names where still used.
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
  - Use the shared migration step and return `migrationsApplied` plus typed `changedXmlFiles`.
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`
  - Apply all unapplied migrations even in partial sync; add migration XML areas to the partial plan.
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalPlan.ts`
  - Accept extra XML areas from migration chain.
- Modify: `packages/core/metadata/appliedObjects/configuration/syncState.ts`
  - Keep `Миграции/**` out of sync-state hashing.
- Modify: `packages/core/index.ts`
  - Export operations API and updated sync result types.
- Modify: `packages/mcp/src/coreApi.ts`
  - Add operation and sync plan methods to `CoreApi`.
- Create: `packages/mcp/src/contracts/operations.ts`
  - Zod input shapes for operation tools.
- Create: `packages/mcp/src/services/listOperationTargets.ts`
  - Thin service wrapper.
- Create: `packages/mcp/src/services/renameItem.ts`
  - Thin service wrapper.
- Create: `packages/mcp/src/services/deleteItem.ts`
  - Thin service wrapper.
- Modify: `packages/mcp/src/services/syncToXml.ts`
  - Support no-write migration preview and updated success payload.
- Modify: `packages/mcp/src/tools/registerTools.ts`
  - Register three new tools.
- Modify: `packages/mcp/src/guides/index.ts`
  - Tell agents to use `nkdk.rename_item` for identity-preserving rename.
- Modify: `packages/mcp/src/prompts/index.ts`
  - Repeat the rule before YAML edits.
- Modify: `packages/cli/src/commands/migration.ts`
  - Make `rename` and `delete` call core operations; keep `generate-migration` strict.
- Modify: `packages/cli/src/cli.ts`
  - Add `--write` and target parsing for `rename`/`delete`.
- Tests:
  - `packages/core/metadata/operations/*.test.ts`
  - Existing migration, sync, MCP and CLI tests updated for the new contract.

## Task 0: Preflight And Baseline

**Files:**
- Read: `AGENTS.md` instructions already supplied in the thread.
- Read: `docs/superpowers/specs/2026-06-29-metadata-rename-delete-mcp-design.md`
- Read if present: `.agents/knowledge/metadata/INDEX.md`

- [ ] **Step 1: Confirm worktree and baseline status**

Run:

```bash
git status --short --branch
```

Expected: current branch is `codex/metadata-rename-delete-design`; any existing changes are documented before implementation starts.

- [ ] **Step 2: Check metadata knowledge file**

Run:

```bash
test -f .agents/knowledge/metadata/INDEX.md && sed -n '1,260p' .agents/knowledge/metadata/INDEX.md || printf '%s\n' 'metadata knowledge index is missing'
```

Expected: either the knowledge file content is printed, or exactly `metadata knowledge index is missing`.

- [ ] **Step 3: Run focused baseline tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project/resources.test.ts packages/core/metadata/validation/validateProject.test.ts packages/core/metadata/appliedObjects/configuration/migrations/applyMigrations.test.ts --no-isolate
```

Expected: PASS before changing code.

## Task 1: Public Operation Target Contract

**Files:**
- Create: `packages/core/metadata/operations/types.ts`
- Create: `packages/core/metadata/operations/targetSchema.ts`
- Create: `packages/core/metadata/operations/targetSchema.test.ts`
- Modify: `packages/core/metadata/operations/index.ts`
- Modify: `packages/core/index.ts`

- [ ] **Step 1: Write failing schema tests**

Create `packages/core/metadata/operations/targetSchema.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { isMetadataOperationTarget, metadataOperationTargetJSONSchema } from "./targetSchema"

describe("metadata operation target schema", () => {
  it("accepts object, nested collection and file item targets", () => {
    expect(isMetadataOperationTarget({ kind: "object", itemTypePrefix: "Справочник", name: "Товары" })).toBe(true)
    expect(
      isMetadataOperationTarget({
        kind: "attribute",
        owner: { itemTypePrefix: "Справочник", name: "Товары" },
        name: "Артикул",
      }),
    ).toBe(true)
    expect(
      isMetadataOperationTarget({
        kind: "attribute",
        owner: { itemTypePrefix: "Документ", name: "Заказ" },
        parent: { kind: "tabularSection", name: "Товары" },
        name: "Количество",
      }),
    ).toBe(true)
    expect(
      isMetadataOperationTarget({
        kind: "fileItem",
        owner: { itemTypePrefix: "Справочник", name: "Товары" },
        role: "form",
        name: "ФормаЭлемента",
      }),
    ).toBe(true)
  })

  it("rejects ambiguous or path-like targets", () => {
    expect(isMetadataOperationTarget("Справочник.Товары")).toBe(false)
    expect(isMetadataOperationTarget({ kind: "attribute", name: "Артикул" })).toBe(false)
    expect(isMetadataOperationTarget({ kind: "object", itemTypePrefix: "Справочник", name: "Товары.Артикул" })).toBe(false)
  })

  it("exports JSON Schema with kind discriminator", () => {
    expect(metadataOperationTargetJSONSchema).toMatchObject({
      anyOf: expect.any(Array),
    })
    expect(JSON.stringify(metadataOperationTargetJSONSchema)).toContain('"kind"')
    expect(JSON.stringify(metadataOperationTargetJSONSchema)).toContain('"fileItem"')
  })
})
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/targetSchema.test.ts --no-isolate
```

Expected: FAIL because `targetSchema.ts` does not exist.

- [ ] **Step 3: Add operation target types**

Create `packages/core/metadata/operations/types.ts`:

```ts
import type { Diagnostic } from "~/metadata/validation/types"

export type MetadataOperationTarget =
  | MetadataObjectOperationTarget
  | MetadataNamedChildOperationTarget
  | MetadataFileItemOperationTarget

export interface MetadataOperationOwnerTarget {
  itemTypePrefix: string
  name: string
}

export interface MetadataObjectOperationTarget {
  kind: "object"
  itemTypePrefix: string
  name: string
}

export type MetadataNamedChildKind =
  | "attribute"
  | "tabularSection"
  | "dimension"
  | "resource"
  | "addressingAttribute"
  | "command"

export interface MetadataNamedChildOperationTarget {
  kind: MetadataNamedChildKind
  owner: MetadataOperationOwnerTarget
  parent?: {
    kind: "tabularSection"
    name: string
  }
  name: string
}

export type MetadataFileItemRole = "form" | "template" | "command"

export interface MetadataFileItemOperationTarget {
  kind: "fileItem"
  owner: MetadataOperationOwnerTarget
  role: MetadataFileItemRole
  name: string
}

export type MetadataOperationMode = "plan" | "applied"

export interface MetadataOperationChangedXmlFile {
  path: string
  change: "added" | "changed" | "deleted"
}

export interface MetadataOperationReferenceChange {
  filePath: string
  yamlPath: Array<string | number>
  from: string
  to: string
}

export interface MetadataOperationBlockedReference {
  filePath: string
  yamlPath: Array<string | number>
  value: string
}

export interface MetadataOperationMigrationInfo {
  from: string
  to: string
  fileName?: string
}

export interface MetadataOperationSuccess {
  ok: true
  mode: MetadataOperationMode
  changedFiles: string[]
  rewrittenReferences: MetadataOperationReferenceChange[]
  createdMigration?: MetadataOperationMigrationInfo
  blockedReferences: []
}

export interface MetadataOperationValidationFailed {
  ok: false
  code: "validation_failed"
  message: string
  diagnostics: Diagnostic[]
}

export interface MetadataOperationFailure {
  ok: false
  code:
    | "target_not_found"
    | "invalid_name"
    | "name_conflict"
    | "references_found"
    | "unsupported_target"
    | "write_failed"
  message: string
  changedFiles: string[]
  rewrittenReferences: MetadataOperationReferenceChange[]
  blockedReferences: MetadataOperationBlockedReference[]
  failedStep?: string
  appliedFiles?: string[]
  pendingFiles?: string[]
}

export type MetadataOperationResult =
  | MetadataOperationSuccess
  | MetadataOperationValidationFailed
  | MetadataOperationFailure

export interface MigrationPlanItem {
  fileName: string
  from: string
  to: string
}

export interface MigrationChainError {
  fileName?: string
  code:
    | "invalid_migration_file_name"
    | "invalid_migration_file"
    | "invalid_applied_migrations_state"
    | "missing_source_path"
    | "name_conflict"
    | "noop_migration"
    | "duplicate_migration"
    | "same_reference_conflict"
    | "missing_incremental_sync_rule"
  message: string
  path?: string
  value?: string
  conflictingFileName?: string
}

export interface MigrationChainInvalidResult {
  ok: false
  code: "migration_chain_invalid"
  message: string
  migrationErrors: MigrationChainError[]
}
```

- [ ] **Step 4: Add TypeBox schema and guard**

Create `packages/core/metadata/operations/targetSchema.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { Value } from "@sinclair/typebox/value"
import type { MetadataOperationTarget } from "./types"

const metadataNamePattern = "^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*$"

const localName = Type.String({ minLength: 1, pattern: metadataNamePattern })
const owner = Type.Object(
  {
    itemTypePrefix: localName,
    name: localName,
  },
  { additionalProperties: false },
)

export const metadataOperationTargetSchema = Type.Union([
  Type.Object(
    {
      kind: Type.Literal("object"),
      itemTypePrefix: localName,
      name: localName,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      kind: Type.Union([
        Type.Literal("attribute"),
        Type.Literal("tabularSection"),
        Type.Literal("dimension"),
        Type.Literal("resource"),
        Type.Literal("addressingAttribute"),
        Type.Literal("command"),
      ]),
      owner,
      parent: Type.Optional(
        Type.Object(
          {
            kind: Type.Literal("tabularSection"),
            name: localName,
          },
          { additionalProperties: false },
        ),
      ),
      name: localName,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      kind: Type.Literal("fileItem"),
      owner,
      role: Type.Union([Type.Literal("form"), Type.Literal("template"), Type.Literal("command")]),
      name: localName,
    },
    { additionalProperties: false },
  ),
])

export const metadataOperationTargetJSONSchema = metadataOperationTargetSchema

export function isMetadataOperationTarget(value: unknown): value is MetadataOperationTarget {
  return Value.Check(metadataOperationTargetSchema, value)
}
```

- [ ] **Step 5: Export public contract**

Create `packages/core/metadata/operations/index.ts`:

```ts
export * from "./types"
export * from "./targetSchema"
```

Modify `packages/core/index.ts` by adding:

```ts
export * from "./metadata/operations"
```

- [ ] **Step 6: Run schema test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/targetSchema.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/core/metadata/operations packages/core/index.ts
git commit -m "feat: ✨ добавить договор целей metadata-операций"
```

Expected: commit created.

## Task 2: Operation Target Declarations In Rules

**Files:**
- Create: `packages/core/metadata/orchestration/property/operationTargets.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Test: `packages/core/metadata/orchestration/property/operationTargets.test.ts`

- [ ] **Step 1: Write failing declaration tests**

Create `packages/core/metadata/orchestration/property/operationTargets.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { fileItemCollectionTarget, namedCollectionTarget } from "./operationTargets"

describe("operation target declarations", () => {
  it("creates named collection target declarations", () => {
    expect(namedCollectionTarget({ kind: "attribute", migrationSegment: "Реквизит", requiresMigration: true })).toEqual({
      kind: "namedCollectionTarget",
      targetKind: "attribute",
      migrationSegment: "Реквизит",
      requiresMigration: true,
    })
  })

  it("creates file item target declarations", () => {
    expect(fileItemCollectionTarget({ role: "form", folderName: "Формы", yamlFileName: "Форма.yaml" })).toEqual({
      kind: "fileItemCollectionTarget",
      role: "form",
      folderName: "Формы",
      yamlFileName: "Форма.yaml",
      requiresMigration: false,
    })
  })
})
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/property/operationTargets.test.ts --no-isolate
```

Expected: FAIL because `operationTargets.ts` does not exist.

- [ ] **Step 3: Add declaration helpers**

Create `packages/core/metadata/orchestration/property/operationTargets.ts`:

```ts
import type { MetadataFileItemRole, MetadataNamedChildKind } from "~/metadata/operations/types"

export type PropertyOperationTargetDeclaration =
  | NamedCollectionOperationTargetDeclaration
  | FileItemCollectionOperationTargetDeclaration

export interface NamedCollectionOperationTargetDeclaration {
  kind: "namedCollectionTarget"
  targetKind: MetadataNamedChildKind
  migrationSegment: string
  requiresMigration: boolean
}

export interface FileItemCollectionOperationTargetDeclaration {
  kind: "fileItemCollectionTarget"
  role: MetadataFileItemRole
  folderName: string
  yamlFileName: string
  requiresMigration: false
}

export function namedCollectionTarget(params: {
  kind: MetadataNamedChildKind
  migrationSegment: string
  requiresMigration: boolean
}): NamedCollectionOperationTargetDeclaration {
  return {
    kind: "namedCollectionTarget",
    targetKind: params.kind,
    migrationSegment: params.migrationSegment,
    requiresMigration: params.requiresMigration,
  }
}

export function fileItemCollectionTarget(params: {
  role: MetadataFileItemRole
  folderName: string
  yamlFileName: string
}): FileItemCollectionOperationTargetDeclaration {
  return {
    kind: "fileItemCollectionTarget",
    role: params.role,
    folderName: params.folderName,
    yamlFileName: params.yamlFileName,
    requiresMigration: false,
  }
}
```

- [ ] **Step 4: Add declaration field to property rules**

Modify `packages/core/metadata/orchestration/property/types.ts`:

```ts
import type { PropertyOperationTargetDeclaration } from "./operationTargets"
```

Inside `BasePropertyRule`, after `syncArea?: SyncAreaDeclaration`, add:

```ts
  /** Нейтральное описание цели rename/delete для коллекции, которую задаёт это свойство. */
  operationTarget?: PropertyOperationTargetDeclaration
```

- [ ] **Step 5: Add structural-reference type-rule slot**

Modify `packages/core/metadata/orchestration/property/fn.ts` by adding near `ValidateMetadataTargetFunction`:

```ts
export interface StructuralReferenceCandidate {
  yamlPath: YamlPath
  canonical: string
  setCanonical(nextCanonical: string): void
}

export type StructuralReferencesFunction = (params: {
  filePath: string
  parsed: ParsedYaml
  yamlPath: YamlPath
  propRule: PropertyRule
  propertyName: string
  value: unknown
  owner?: MetadataTargetOwner
}) => StructuralReferenceCandidate[]
```

Then add to `TypeRule`:

```ts
  structuralReferences?: StructuralReferencesFunction
```

Add `"structuralReferences"` to `TypeRulesOperations`, and add this branch to `importExportFunction`:

```ts
                    : O extends "structuralReferences"
                      ? StructuralReferencesFunction | undefined
```

- [ ] **Step 6: Run declaration tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/property/operationTargets.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/core/metadata/orchestration/property
git commit -m "feat: ✨ добавить декларации целей metadata-операций"
```

Expected: commit created.

## Task 3: Register Operation Targets In Metadata Rules

**Files:**
- Modify: `packages/core/metadata/commonObjects/childFormNames/types.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/types.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataReport/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDataProcessor/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataExchangePlan/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataBusinessProcess/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataTask/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataAccountingRegister/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataAccumulationRegister/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataInformationRegister/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCalculationRegister/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfAccounts/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSequence/rules.ts`
- Test: `packages/core/metadata/operations/operationTargetRegistrations.test.ts`

- [ ] **Step 1: Write failing registration test**

Create `packages/core/metadata/operations/operationTargetRegistrations.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataDocumentRules } from "~/metadata/appliedObjects/metadataDocument/rules"
import { MetadataInformationRegisterRules } from "~/metadata/appliedObjects/metadataInformationRegister/rules"

describe("operation target registrations", () => {
  it("declares catalog attributes, tabular sections and file items", () => {
    expect(MetadataCatalogRules.properties.attributes.operationTarget).toMatchObject({
      kind: "namedCollectionTarget",
      targetKind: "attribute",
      migrationSegment: "Реквизит",
      requiresMigration: true,
    })
    expect(MetadataCatalogRules.properties.tabularSections.operationTarget).toMatchObject({
      kind: "namedCollectionTarget",
      targetKind: "tabularSection",
      migrationSegment: "ТабличнаяЧасть",
      requiresMigration: true,
    })
    expect(MetadataCatalogRules.properties.forms.operationTarget).toMatchObject({
      kind: "fileItemCollectionTarget",
      role: "form",
      folderName: "Формы",
      requiresMigration: false,
    })
  })

  it("declares document and register child identity collections", () => {
    expect(MetadataDocumentRules.properties.attributes.operationTarget?.requiresMigration).toBe(true)
    expect(MetadataDocumentRules.properties.tabularSections.operationTarget?.requiresMigration).toBe(true)
    expect(MetadataInformationRegisterRules.properties.dimensions.operationTarget).toMatchObject({
      targetKind: "dimension",
      migrationSegment: "Измерение",
    })
    expect(MetadataInformationRegisterRules.properties.resources.operationTarget).toMatchObject({
      targetKind: "resource",
      migrationSegment: "Ресурс",
    })
  })
})
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/operationTargetRegistrations.test.ts --no-isolate
```

Expected: FAIL because rules do not expose `operationTarget`.

- [ ] **Step 3: Inject file item targets in common helpers**

Modify `packages/core/metadata/commonObjects/childFormNames/types.ts`:

```ts
import { fileItemCollectionTarget } from "~/metadata/orchestration/property/operationTargets"
```

Replace the return in `childFormNamesRule` with:

```ts
  return defineWidePropertyRule("ChildFormNames", {
    ...params,
    operationTarget: fileItemCollectionTarget({
      role: "form",
      folderName: params.folderName,
      yamlFileName: "Форма.yaml",
    }),
  })
```

Modify `packages/core/metadata/commonObjects/childTemplateNames/types.ts` the same way, with `role: "template"` and `yamlFileName: "Шаблон.yaml"`.

- [ ] **Step 4: Add named collection targets to rules**

In each listed applied object rule file, import:

```ts
import { namedCollectionTarget } from "~/metadata/orchestration/property/operationTargets"
```

Add `operationTarget` to the relevant collection rule calls. Use these exact descriptors:

```ts
operationTarget: namedCollectionTarget({ kind: "attribute", migrationSegment: "Реквизит", requiresMigration: true })
operationTarget: namedCollectionTarget({ kind: "addressingAttribute", migrationSegment: "РеквизитАдресации", requiresMigration: true })
operationTarget: namedCollectionTarget({ kind: "tabularSection", migrationSegment: "ТабличнаяЧасть", requiresMigration: true })
operationTarget: namedCollectionTarget({ kind: "dimension", migrationSegment: "Измерение", requiresMigration: true })
operationTarget: namedCollectionTarget({ kind: "resource", migrationSegment: "Ресурс", requiresMigration: true })
operationTarget: namedCollectionTarget({ kind: "command", migrationSegment: "Команда", requiresMigration: false })
```

Apply them by property name:

```ts
attributes -> attribute / Реквизит / true
addressingAttributes -> addressingAttribute / РеквизитАдресации / true
tabularSections -> tabularSection / ТабличнаяЧасть / true
dimensions -> dimension / Измерение / true
resources -> resource / Ресурс / true
commands -> command / Команда / false
```

- [ ] **Step 5: Run registration test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/operationTargetRegistrations.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 6: Run existing boundary tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts packages/core/metadata/project/resources.test.ts --no-isolate
```

Expected: PASS and no new hard-coded folder checks in shared layers.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/core/metadata/commonObjects packages/core/metadata/appliedObjects packages/core/metadata/operations/operationTargetRegistrations.test.ts
git commit -m "feat: ✨ описать цели операций в metadata rules"
```

Expected: commit created.

## Task 4: Project Operation Target Discovery

**Files:**
- Modify: `packages/core/metadata/project/ruleResources.ts`
- Create: `packages/core/metadata/operations/listOperationTargets.ts`
- Create: `packages/core/metadata/operations/projectSnapshot.ts`
- Create: `packages/core/metadata/operations/context.ts`
- Modify: `packages/core/metadata/operations/index.ts`
- Test: `packages/core/metadata/operations/listOperationTargets.test.ts`

- [ ] **Step 1: Write failing list test**

Create `packages/core/metadata/operations/listOperationTargets.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { listMetadataOperationTargets } from "./listOperationTargets"

describe("listMetadataOperationTargets", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-operation-targets-"))
    tempDirs.push(dir)
    return dir
  }

  function writeProjectFile(projectDir: string, projectPath: string, lines: string[]): void {
    const filePath = join(projectDir, ...projectPath.split("/"))
    mkdirSync(join(filePath, ".."), { recursive: true })
    writeFileSync(filePath, lines.join("\n"))
  }

  it("lists object, named collection and file item targets without requiring full validation", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
      "ТабличныеЧасти:",
      "  Остатки:",
      "    Реквизиты:",
      "      Количество:",
      "        Тип: Число",
    ])
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
      "ЛишнееПоле: true",
      "Элементы: {}",
    ])

    const result = listMetadataOperationTargets({ projectDir })

    expect(result.ok).toBe(true)
    expect(result.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          displayPath: "Справочник.Товары",
          target: { kind: "object", itemTypePrefix: "Справочник", name: "Товары" },
          requiresMigration: true,
        }),
        expect.objectContaining({
          displayPath: "Справочник.Товары.Реквизит.Артикул",
          target: { kind: "attribute", owner: { itemTypePrefix: "Справочник", name: "Товары" }, name: "Артикул" },
          requiresMigration: true,
        }),
        expect.objectContaining({
          displayPath: "Справочник.Товары.Форма.ФормаЭлемента",
          target: {
            kind: "fileItem",
            owner: { itemTypePrefix: "Справочник", name: "Товары" },
            role: "form",
            name: "ФормаЭлемента",
          },
          requiresMigration: false,
        }),
      ]),
    )
  })

  it("filters by query, kind and owner", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ["Реквизиты:", "  Артикул:", "    Тип: Строка"])
    writeProjectFile(projectDir, "Справочник/Склады/Свойства.yaml", "")

    const result = listMetadataOperationTargets({
      projectDir,
      query: "арт",
      kind: "attribute",
      owner: { itemTypePrefix: "Справочник", name: "Товары" },
      limit: 5,
    })

    expect(result.ok).toBe(true)
    expect(result.targets.map((item) => item.displayPath)).toEqual(["Справочник.Товары.Реквизит.Артикул"])
  })
})
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/listOperationTargets.test.ts --no-isolate
```

Expected: FAIL because list operation does not exist.

- [ ] **Step 3: Export operation declarations from project rules**

Modify `packages/core/metadata/project/ruleResources.ts` by adding:

```ts
import type { PropertyOperationTargetDeclaration } from "~/metadata/orchestration/property/operationTargets"
```

Add:

```ts
export interface MetadataRuleOperationTargetDescriptor {
  propertyName: string
  propertyYaml?: string
  declaration: PropertyOperationTargetDeclaration
}

export function describeMetadataRuleOperationTargets(rule: MetadataItemRule): MetadataRuleOperationTargetDescriptor[] {
  return Object.entries(rule.properties).flatMap(([propertyName, propertyRule]) => {
    const declaration = propertyRule.operationTarget
    if (!declaration) return []
    return [
      {
        propertyName,
        propertyYaml: typeof propertyRule.yaml === "string" ? propertyRule.yaml : undefined,
        declaration,
      },
    ]
  })
}
```

- [ ] **Step 4: Add operations context**

Create `packages/core/metadata/operations/context.ts`:

```ts
import type { ConfigurationContext } from "~/metadata/context/types"

export function defaultMetadataOperationsContext(): ConfigurationContext {
  return {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false },
  }
}
```

- [ ] **Step 5: Implement target listing**

Create `packages/core/metadata/operations/listOperationTargets.ts` with these exported contracts:

```ts
import { join } from "path"
import type { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { describeMetadataRuleOperationTargets } from "~/metadata/project/ruleResources"
import { discoverMetadataProjectResources, type MetadataProjectPropertiesYamlRef } from "~/metadata/project/resources"
import { importFromYAMLFile } from "~/yaml/import"
import { defaultMetadataOperationsContext } from "./context"
import type { MetadataOperationTarget } from "./types"

export interface ListMetadataOperationTargetsParams {
  projectDir: string
  query?: string
  kind?: MetadataOperationTarget["kind"]
  owner?: {
    itemTypePrefix: string
    name: string
  }
  limit?: number
  context?: ConfigurationContext
}

export interface ListedMetadataOperationTarget {
  target: MetadataOperationTarget
  displayPath: string
  projectPath?: string
  canRename: boolean
  canDelete: boolean
  requiresMigration: boolean
}

export interface ListMetadataOperationTargetsResult {
  ok: true
  targets: ListedMetadataOperationTarget[]
}
```

Then implement `listMetadataOperationTargets(params)` so it:

```ts
export function listMetadataOperationTargets(params: ListMetadataOperationTargetsParams): ListMetadataOperationTargetsResult {
  const context = params.context ?? defaultMetadataOperationsContext()
  const targets: ListedMetadataOperationTarget[] = []
  const resources = discoverMetadataProjectResources(params.projectDir)

  for (const resource of resources) {
    if (resource.role !== "properties" || resource.nesting.length > 0 || resource.absolutePath === undefined) continue
    targets.push({
      target: { kind: "object", itemTypePrefix: resource.owner.dir, name: resource.owner.name },
      displayPath: `${resource.owner.dir}.${resource.owner.name}`,
      projectPath: resource.projectPath,
      canRename: true,
      canDelete: true,
      requiresMigration: true,
    })
    targets.push(...listChildTargets({ projectDir: params.projectDir, resource, context }))
  }

  return {
    ok: true,
    targets: targets
      .filter((target) => matchesTargetFilters(target, params))
      .sort((left, right) => left.displayPath.localeCompare(right.displayPath, "ru"))
      .slice(0, params.limit ?? 100),
  }
}
```

Add local helpers `listChildTargets`, `namedItems`, `matchesTargetFilters`. `listChildTargets` imports model with `importMetadataItemFromYAML({ context, yaml, rule: resource.owner.spec.rule, name: resource.owner.name })`; if import throws, catch and return `[]` because listing is best-effort. It must read child declarations with `describeMetadataRuleOperationTargets(resource.owner.spec.rule)`.

- [ ] **Step 6: Export listing**

Modify `packages/core/metadata/operations/index.ts`:

```ts
export * from "./listOperationTargets"
```

- [ ] **Step 7: Run list tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/listOperationTargets.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add packages/core/metadata/project/ruleResources.ts packages/core/metadata/operations
git commit -m "feat: ✨ добавить список целей metadata-операций"
```

Expected: commit created.

## Task 5: Strict Migration Chain In Core

**Files:**
- Create: `packages/core/metadata/operations/migrationChain.ts`
- Test: `packages/core/metadata/operations/migrationChain.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/readMigration.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/fileNames.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/stateFile.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/applyMigrations.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/types.ts`
- Modify: existing migration tests under `packages/core/metadata/appliedObjects/configuration/migrations/*.test.ts`

- [ ] **Step 1: Write strict chain tests**

Create `packages/core/metadata/operations/migrationChain.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { prepareMetadataMigrationChain } from "./migrationChain"

describe("prepareMetadataMigrationChain", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createDirs(): { yamlDir: string; xmlDir: string } {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-migrations-yaml-"))
    const xmlDir = mkdtempSync(join(tmpdir(), "nkdk-migrations-xml-"))
    tempDirs.push(yamlDir, xmlDir)
    mkdirSync(join(yamlDir, "Миграции"), { recursive: true })
    return { yamlDir, xmlDir }
  }

  it("applies rename files sequentially and returns from/to after previous files", () => {
    const { yamlDir, xmlDir } = createDirs()
    writeFileSync(join(yamlDir, "Миграции", "2026-06-30-120000.yaml"), '"Справочник.Товары": Номенклатура\n')
    writeFileSync(join(yamlDir, "Миграции", "2026-06-30-120001.yaml"), '"Справочник.Номенклатура.Реквизит.Артикул": КодПоставщика\n')

    const result = prepareMetadataMigrationChain({
      yamlDir,
      xmlDir,
      referencePaths: ["Справочник.Товары", "Справочник.Товары.Реквизит.Артикул"],
      yamlPaths: ["Справочник.Номенклатура", "Справочник.Номенклатура.Реквизит.КодПоставщика"],
      xmlAreaByMigrationPath: () => ({ kind: "owner", itemType: "MetadataCatalog", itemTypePrefix: "Справочник", itemName: "Номенклатура", xmlDir: "Catalogs" }),
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.migrationsToApply).toEqual([
      { fileName: "2026-06-30-120000.yaml", from: "Справочник.Товары", to: "Справочник.Номенклатура" },
      {
        fileName: "2026-06-30-120001.yaml",
        from: "Справочник.Номенклатура.Реквизит.Артикул",
        to: "Справочник.Номенклатура.Реквизит.КодПоставщика",
      },
    ])
    expect(result.referencePathByCurrentPath.get("Справочник.Номенклатура")).toBe("Справочник.Товары")
  })

  it("rejects delete and add service values as ordinary invalid migration files", () => {
    const { yamlDir, xmlDir } = createDirs()
    writeFileSync(join(yamlDir, "Миграции", "2026-06-30-120000.yaml"), '"Справочник.Товары": Удалить\n')

    const result = prepareMetadataMigrationChain({
      yamlDir,
      xmlDir,
      referencePaths: ["Справочник.Товары"],
      yamlPaths: [],
      xmlAreaByMigrationPath: () => undefined,
    })

    expect(result).toMatchObject({
      ok: false,
      code: "migration_chain_invalid",
      migrationErrors: [expect.objectContaining({ code: "missing_source_path" })],
    })
  })

  it("blocks duplicate claims and same-reference conflicts", () => {
    const { yamlDir, xmlDir } = createDirs()
    writeFileSync(join(yamlDir, "Миграции", "2026-06-30-120000.yaml"), '"Справочник.Товары": Номенклатура\n')
    writeFileSync(join(yamlDir, "Миграции", "2026-06-30-120001.yaml"), '"Справочник.Товары": Номенклатура2\n')

    const result = prepareMetadataMigrationChain({
      yamlDir,
      xmlDir,
      referencePaths: ["Справочник.Товары"],
      yamlPaths: ["Справочник.Номенклатура2"],
      xmlAreaByMigrationPath: () => undefined,
    })

    expect(result).toMatchObject({
      ok: false,
      code: "migration_chain_invalid",
      migrationErrors: [expect.objectContaining({ code: "missing_source_path" })],
    })
  })

  it("blocks invalid applied migrations state", () => {
    const { yamlDir, xmlDir } = createDirs()
    writeFileSync(join(xmlDir, ".nakidka-migrations.yaml"), "applied: 42\n")

    const result = prepareMetadataMigrationChain({
      yamlDir,
      xmlDir,
      referencePaths: [],
      yamlPaths: [],
      xmlAreaByMigrationPath: () => undefined,
    })

    expect(result).toMatchObject({
      ok: false,
      migrationErrors: [expect.objectContaining({ code: "invalid_applied_migrations_state" })],
    })
  })
})
```

- [ ] **Step 2: Run failing migration chain tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/migrationChain.test.ts --no-isolate
```

Expected: FAIL because `migrationChain.ts` does not exist.

- [ ] **Step 3: Implement strict chain API**

Create `packages/core/metadata/operations/migrationChain.ts` with exports:

```ts
import fs from "fs"
import { join } from "path"
import { parse } from "yaml"
import { areaKey, type XmlSyncArea } from "~/metadata/orchestration/appliedObject/xmlAreas"
import { APPLIED_MIGRATIONS_FILE, MIGRATIONS_DIR } from "~/metadata/appliedObjects/configuration/migrations"
import { buildRenameTargetPath, parseMigrationPath } from "~/metadata/appliedObjects/configuration/migrations/paths"
import { isMigrationFileName } from "~/metadata/appliedObjects/configuration/migrations/fileNames"
import type { MigrationChainError, MigrationChainInvalidResult, MigrationPlanItem } from "./types"

export interface PreparedMetadataMigrationChain {
  ok: true
  appliedState: { applied: string[] }
  pendingFileNames: string[]
  migrationsToApply: MigrationPlanItem[]
  referencePathByCurrentPath: Map<string, string>
  xmlAreas: XmlSyncArea[]
}

export interface PrepareMetadataMigrationChainParams {
  yamlDir: string
  xmlDir: string
  referencePaths: string[]
  yamlPaths: string[]
  xmlAreaByMigrationPath: (path: string) => XmlSyncArea | undefined
}
```

Implement `prepareMetadataMigrationChain(params)` so it:

```ts
export function prepareMetadataMigrationChain(
  params: PrepareMetadataMigrationChainParams,
): PreparedMetadataMigrationChain | MigrationChainInvalidResult {
  const errors: MigrationChainError[] = []
  const appliedState = readAppliedStateStrict(params.xmlDir, errors)
  const pending = readPendingMigrationFilesStrict(params.yamlDir, appliedState.applied, errors)
  if (errors.length > 0) return invalid(errors)

  const current = new Map(params.referencePaths.map((path) => [path, path]))
  const claimsByReference = new Map<string, { fileName: string; finalPath: string }>()
  const referencePathByCurrentPath = new Map<string, string>()
  const migrationsToApply: MigrationPlanItem[] = []
  const areas = new Map<string, XmlSyncArea>()

  for (const file of pending) {
    const targetPath = buildRenameTargetPath(file.path, file.value)
    const referencePath = current.get(file.path)
    if (referencePath === undefined) {
      errors.push({ fileName: file.fileName, code: "missing_source_path", message: `Исходный путь не найден: ${file.path}`, path: file.path })
      continue
    }
    if (targetPath === file.path) {
      errors.push({ fileName: file.fileName, code: "noop_migration", message: `Переименование в то же имя запрещено: ${file.path}`, path: file.path, value: file.value })
      continue
    }
    if (current.has(targetPath) || [...current.keys()].some((path) => path.startsWith(`${targetPath}.`))) {
      errors.push({ fileName: file.fileName, code: "name_conflict", message: `Целевой путь уже существует: ${targetPath}`, path: file.path, value: file.value })
      continue
    }
    const existingClaim = claimsByReference.get(referencePath)
    if (existingClaim) {
      errors.push({
        fileName: file.fileName,
        conflictingFileName: existingClaim.fileName,
        code: existingClaim.finalPath === targetPath ? "duplicate_migration" : "same_reference_conflict",
        message: `Повторная миграция identity ${referencePath}`,
        path: file.path,
        value: file.value,
      })
      continue
    }

    movePathWithDescendants(current, file.path, targetPath)
    claimsByReference.set(referencePath, { fileName: file.fileName, finalPath: targetPath })
    migrationsToApply.push({ fileName: file.fileName, from: file.path, to: targetPath })
    const area = params.xmlAreaByMigrationPath(targetPath)
    if (!area) {
      errors.push({ fileName: file.fileName, code: "missing_incremental_sync_rule", message: `Нет XML-области для ${targetPath}`, path: targetPath })
    } else {
      areas.set(areaKey(area), area)
    }
  }

  if (errors.length > 0) return invalid(errors)
  for (const [currentPath, referencePath] of current) {
    if (currentPath !== referencePath) referencePathByCurrentPath.set(currentPath, referencePath)
  }
  for (const currentPath of current.keys()) {
    if (!params.yamlPaths.includes(currentPath)) {
      errors.push({ code: "missing_source_path", message: `Итоговый путь миграции отсутствует в YAML: ${currentPath}`, path: currentPath })
    }
  }
  return errors.length > 0
    ? invalid(errors)
    : {
        ok: true,
        appliedState,
        pendingFileNames: pending.map((file) => file.fileName),
        migrationsToApply,
        referencePathByCurrentPath,
        xmlAreas: [...areas.values()],
      }
}
```

Use helper functions in the same file:

```ts
function invalid(errors: MigrationChainError[]): MigrationChainInvalidResult {
  return { ok: false, code: "migration_chain_invalid", message: "Цепочка миграций некорректна", migrationErrors: errors }
}
```

`readAppliedStateStrict` must enforce the spec: missing file means `{ applied: [] }`, unreadable or malformed YAML is `invalid_applied_migrations_state`, `applied` must be a list of unique timestamp `.yaml` names. `readPendingMigrationFilesStrict` must reject `.yaml` files in `Миграции` with invalid names, ignore non-`.yaml` files, skip applied names without reading them, require exactly one mapping entry per file, require string key, require string value that passes metadata name validation and has no dot.

- [ ] **Step 4: Update old migration exports to strict semantics**

Modify the old migration modules so callers still importing from `@nakidka/core` get the new contract:

```ts
// packages/core/metadata/appliedObjects/configuration/migrations/types.ts
export const MIGRATIONS_DIR = "Миграции" as const
export const APPLIED_MIGRATIONS_FILE = ".nakidka-migrations.yaml" as const
export type MigrationAction = string
export interface MigrationEntry {
  path: string
  value: string
}
```

Keep `DELETE_ACTION` and `ADD_ACTION` exports only if CLI tests still import them, but do not treat them specially in chain code.

- [ ] **Step 5: Update migration tests**

Update existing tests to assert new behavior:

```ts
expect(() =>
  applyMigrationEntries(state(["Справочник.Товары"]), [{ path: "Справочник.Товары", value: "Удалить" }]),
).not.toThrow()
```

The expected result is rename to `Справочник.Удалить`, not deletion. Remove old tests that expect `Добавить` to create nodes; replace them with `invalid_migration_file` assertions in `readMigration.test.ts`.

- [ ] **Step 6: Run migration tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/migrationChain.test.ts packages/core/metadata/appliedObjects/configuration/migrations --no-isolate
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/core/metadata/operations/migrationChain.ts packages/core/metadata/operations/migrationChain.test.ts packages/core/metadata/appliedObjects/configuration/migrations
git commit -m "feat: ✨ ужесточить цепочку metadata-миграций"
```

Expected: commit created.

## Task 6: Snapshot, Target Resolution And YAML Model IO

**Files:**
- Create: `packages/core/metadata/operations/projectSnapshot.ts`
- Create: `packages/core/metadata/operations/targetResolver.ts`
- Create: `packages/core/metadata/operations/nameRules.ts`
- Create: `packages/core/metadata/operations/yamlModelIO.ts`
- Test: `packages/core/metadata/operations/projectSnapshot.test.ts`
- Test: `packages/core/metadata/operations/targetResolver.test.ts`

- [ ] **Step 1: Write validation gate and resolver tests**

Create `packages/core/metadata/operations/projectSnapshot.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { buildMetadataOperationSnapshot } from "./projectSnapshot"

describe("buildMetadataOperationSnapshot", () => {
  const tempDirs: string[] = []
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("returns validation_failed before operation planning when project is invalid", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-operation-snapshot-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "НеизвестноеПоле: true\n")

    const result = buildMetadataOperationSnapshot({ projectDir, requireValidProject: true })

    expect(result).toMatchObject({
      ok: false,
      code: "validation_failed",
      diagnostics: [expect.objectContaining({ severity: "error" })],
    })
  })

  it("allows best-effort snapshot for listing targets", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-operation-snapshot-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "НеизвестноеПоле: true\n")

    const result = buildMetadataOperationSnapshot({ projectDir, requireValidProject: false })

    expect(result.ok).toBe(true)
  })
})
```

Create `packages/core/metadata/operations/targetResolver.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { buildMetadataOperationSnapshot } from "./projectSnapshot"
import { resolveMetadataOperationTarget } from "./targetResolver"

describe("resolveMetadataOperationTarget", () => {
  const tempDirs: string[] = []
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("resolves object and child targets with migration paths", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-target-resolver-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента"), { recursive: true })
    writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
    ].join("\n"))
    writeFileSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Форма.yaml"), "Элементы: {}\n")

    const snapshot = buildMetadataOperationSnapshot({ projectDir, requireValidProject: false })
    expect(snapshot.ok).toBe(true)
    if (!snapshot.ok) return

    expect(resolveMetadataOperationTarget(snapshot, { kind: "object", itemTypePrefix: "Справочник", name: "Товары" })).toMatchObject({
      ok: true,
      displayPath: "Справочник.Товары",
      migrationPath: "Справочник.Товары",
      requiresMigration: true,
    })
    expect(
      resolveMetadataOperationTarget(snapshot, {
        kind: "attribute",
        owner: { itemTypePrefix: "Справочник", name: "Товары" },
        name: "Артикул",
      }),
    ).toMatchObject({
      ok: true,
      displayPath: "Справочник.Товары.Реквизит.Артикул",
      migrationPath: "Справочник.Товары.Реквизит.Артикул",
      requiresMigration: true,
    })
    expect(
      resolveMetadataOperationTarget(snapshot, {
        kind: "fileItem",
        owner: { itemTypePrefix: "Справочник", name: "Товары" },
        role: "form",
        name: "ФормаЭлемента",
      }),
    ).toMatchObject({
      ok: true,
      displayPath: "Справочник.Товары.Форма.ФормаЭлемента",
      requiresMigration: false,
    })
  })
})
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/projectSnapshot.test.ts packages/core/metadata/operations/targetResolver.test.ts --no-isolate
```

Expected: FAIL because modules do not exist.

- [ ] **Step 3: Implement name rules**

Create `packages/core/metadata/operations/nameRules.ts`:

```ts
const metadataNameRegExp = /^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*$/

export function validateMetadataLocalName(name: string): { ok: true } | { ok: false; message: string } {
  if (!metadataNameRegExp.test(name)) {
    return {
      ok: false,
      message: "Имя должно начинаться с буквы или _, дальше допустимы буквы, цифры и _",
    }
  }
  return { ok: true }
}

export function sameNameIgnoreCase(left: string, right: string): boolean {
  return left.localeCompare(right, "ru", { sensitivity: "accent" }) === 0
}

export function hasCaseInsensitiveConflict(params: {
  existingNames: readonly string[]
  currentName: string
  nextName: string
}): boolean {
  if (sameNameIgnoreCase(params.currentName, params.nextName)) return false
  return params.existingNames.some((name) => sameNameIgnoreCase(name, params.nextName))
}
```

- [ ] **Step 4: Implement snapshot**

Create `packages/core/metadata/operations/projectSnapshot.ts` with:

```ts
import { join, resolve } from "path"
import type { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { discoverMetadataProjectResources, type MetadataProjectPropertiesYamlRef } from "~/metadata/project/resources"
import { validateProject } from "~/metadata/validation/validateProject"
import { importFromYAMLFile } from "~/yaml/import"
import { defaultMetadataOperationsContext } from "./context"
import type { MetadataOperationValidationFailed } from "./types"

export interface OperationSnapshotItem {
  resource: MetadataProjectPropertiesYamlRef
  filePath: string
  model: Record<string, unknown>
}

export interface MetadataOperationSnapshot {
  ok: true
  projectDir: string
  context: ConfigurationContext
  items: OperationSnapshotItem[]
}

export type MetadataOperationSnapshotResult = MetadataOperationSnapshot | MetadataOperationValidationFailed
```

Implement `buildMetadataOperationSnapshot({ projectDir, context, requireValidProject })` so `requireValidProject` runs `validateProject` first and returns `validation_failed` when any diagnostic has `severity: "error"`. For parsing, discover only top-level `properties` YAML resources; catch per-file import errors only when `requireValidProject` is false.

- [ ] **Step 5: Implement resolver**

Create `packages/core/metadata/operations/targetResolver.ts` with:

```ts
import { join } from "path"
import { describeMetadataRuleOperationTargets } from "~/metadata/project/ruleResources"
import type { MetadataOperationSnapshot } from "./projectSnapshot"
import type { MetadataOperationTarget } from "./types"

export interface ResolvedMetadataOperationTarget {
  ok: true
  target: MetadataOperationTarget
  displayPath: string
  item: import("./projectSnapshot").OperationSnapshotItem
  modelNode: Record<string, unknown>
  collectionProperty?: string
  collectionNames: string[]
  projectPath: string
  absolutePath: string
  resources: string[]
  requiresMigration: boolean
  migrationPath?: string
  targetPrefix: string
}

export interface ResolveMetadataOperationTargetFailure {
  ok: false
  code: "target_not_found" | "unsupported_target"
  message: string
}
```

Implement `resolveMetadataOperationTarget(snapshot, target)`:

```ts
export function resolveMetadataOperationTarget(
  snapshot: MetadataOperationSnapshot,
  target: MetadataOperationTarget,
): ResolvedMetadataOperationTarget | ResolveMetadataOperationTargetFailure {
  if (target.kind === "object") return resolveObjectTarget(snapshot, target)
  if (target.kind === "fileItem") return resolveFileItemTarget(snapshot, target)
  return resolveNamedCollectionTarget(snapshot, target)
}
```

`resolveObjectTarget` finds `item.resource.owner.dir/name`, returns `migrationPath = "${itemTypePrefix}.${name}"`, `resources = [owner directory]`, `requiresMigration: true`.

`resolveNamedCollectionTarget` reads `describeMetadataRuleOperationTargets(item.resource.owner.spec.rule)`, selects matching `targetKind`, finds model array item by `name`, and builds migration path:

```ts
const ownerPath = `${target.owner.itemTypePrefix}.${target.owner.name}`
const migrationPath = target.parent
  ? `${ownerPath}.ТабличнаяЧасть.${target.parent.name}.${declaration.migrationSegment}.${target.name}`
  : `${ownerPath}.${declaration.migrationSegment}.${target.name}`
```

`resolveFileItemTarget` selects matching `fileItemCollectionTarget`, checks directory `<projectDir>/<ownerPrefix>/<ownerName>/<folderName>/<name>/<yamlFileName>`, returns `resources` containing that file and its parent directory, `requiresMigration: false`.

- [ ] **Step 6: Implement model IO helpers**

Create `packages/core/metadata/operations/yamlModelIO.ts`:

```ts
import fs from "fs"
import type { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataItemToYAML } from "~/metadata/orchestration"
import { exportToYAML } from "~/yaml/export"
import type { OperationSnapshotItem } from "./projectSnapshot"

export function exportOperationItemToYamlText(item: OperationSnapshotItem, context: ConfigurationContext): string {
  const yaml = exportMetadataItemToYAML({
    context,
    data: item.model as never,
    rule: item.resource.owner.spec.rule as never,
  })
  return exportToYAML(yaml)
}

export function writeOperationYamlFile(item: OperationSnapshotItem, context: ConfigurationContext): void {
  fs.writeFileSync(item.filePath, exportOperationItemToYamlText(item, context), "utf-8")
}
```

- [ ] **Step 7: Run snapshot/resolver tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/projectSnapshot.test.ts packages/core/metadata/operations/targetResolver.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add packages/core/metadata/operations
git commit -m "feat: ✨ добавить снимок проекта для metadata-операций"
```

Expected: commit created.

## Task 7: Structural Reference Traversal

**Files:**
- Create: `packages/core/metadata/operations/references.ts`
- Create: `packages/core/metadata/operations/dataPathReferences.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts`
- Test: `packages/core/metadata/operations/references.test.ts`
- Test: `packages/core/metadata/operations/dataPathReferences.test.ts`

- [ ] **Step 1: Write failing reference tests**

Create `packages/core/metadata/operations/references.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { collectStructuralReferenceChanges } from "./references"

describe("collectStructuralReferenceChanges", () => {
  it("rewrites metadataTarget references to target and descendant paths", () => {
    const changes = collectStructuralReferenceChanges({
      projectDir: "/tmp/project",
      fromPrefix: "Catalog.Товары",
      toPrefix: "Catalog.Номенклатура",
      items: [
        {
          filePath: "/tmp/project/Справочник/Заказы/Свойства.yaml",
          yamlPath: ["ОсновнаяФорма"],
          canonical: "Catalog.Товары.Form.ФормаЭлемента",
          setCanonical: () => undefined,
        },
        {
          filePath: "/tmp/project/Справочник/Заказы/Свойства.yaml",
          yamlPath: ["Комментарий"],
          canonical: "Catalog.ТоварыТекст",
          setCanonical: () => undefined,
        },
      ],
    })

    expect(changes).toEqual([
      {
        filePath: "/tmp/project/Справочник/Заказы/Свойства.yaml",
        yamlPath: ["ОсновнаяФорма"],
        from: "Catalog.Товары.Form.ФормаЭлемента",
        to: "Catalog.Номенклатура.Form.ФормаЭлемента",
      },
    ])
  })
})
```

Create `packages/core/metadata/operations/dataPathReferences.test.ts` with a focused pure test for segment rewrite:

```ts
import { describe, expect, it } from "vitest"
import { rewriteDataPathSegments } from "./dataPathReferences"

describe("rewriteDataPathSegments", () => {
  it("rewrites only the resolved segment", () => {
    expect(rewriteDataPathSegments("Объект.Товары.Артикул", ["Объект", "Товары", "Артикул"], 2, "Код")).toBe(
      "Объект.Товары.Код",
    )
  })

  it("keeps indexed segments syntax around the changed segment", () => {
    expect(rewriteDataPathSegments("Товары[0].Артикул", ["Товары[0]", "Артикул"], 1, "Код")).toBe("Товары[0].Код")
  })
})
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/references.test.ts packages/core/metadata/operations/dataPathReferences.test.ts --no-isolate
```

Expected: FAIL because modules do not exist.

- [ ] **Step 3: Register structural references for metadataTarget values**

Modify `packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts` by adding handlers that parse model canonical values through `parseMetadataTargetFromModel` and return candidates:

```ts
registerTypeRule("MetadataItemLink", "structuralReferences", collectStringTargetReference)
registerTypeRule("string", "structuralReferences", collectStringTargetReference)
registerTypeRule("MetadataItemLinks", "structuralReferences", collectStringTargetReferenceList)
registerTypeRule("MetadataField", "structuralReferences", collectStringTargetReference)
registerTypeRule("MetadataFields", "structuralReferences", collectStringTargetReferenceList)
registerTypeRule("MetadataObjectRefCollection", "structuralReferences", collectStringTargetReferenceList)
registerTypeRule("MetadataValue", "structuralReferences", collectMetadataValueReference)
```

Use this exact behavior:

```ts
function collectStringTargetReference(params: Parameters<NonNullable<import("~/metadata/orchestration/property/fn").TypeRule["structuralReferences"]>>[0]) {
  if (!params.propRule.metadataTarget) return []
  if (typeof params.value !== "string" || params.value === "") return []
  const parsed = parseMetadataTargetFromModel({ canonical: params.value, constraint: params.propRule.metadataTarget, owner: params.owner })
  if (!parsed.ok) return []
  return [{ yamlPath: params.yamlPath, canonical: parsed.canonical, setCanonical: (nextCanonical: string) => setStringReference(params, nextCanonical) }]
}
```

`setStringReference` mutates the containing model record. For arrays, list handler passes the array item and index and assigns `array[index] = nextCanonical`.

- [ ] **Step 4: Implement reference change collector**

Create `packages/core/metadata/operations/references.ts`:

```ts
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { StructuralReferenceCandidate } from "~/metadata/orchestration/property/fn"
import type { OperationSnapshotItem } from "./projectSnapshot"
import type { MetadataOperationReferenceChange, MetadataOperationBlockedReference } from "./types"

export interface StructuralReferenceInput extends StructuralReferenceCandidate {
  filePath: string
}

export function collectStructuralReferenceChanges(params: {
  projectDir: string
  items: StructuralReferenceInput[]
  fromPrefix: string
  toPrefix: string
}): MetadataOperationReferenceChange[] {
  return params.items.flatMap((item) => {
    const to = rewriteCanonicalPrefix(item.canonical, params.fromPrefix, params.toPrefix)
    if (to === undefined) return []
    return [{ filePath: item.filePath, yamlPath: item.yamlPath, from: item.canonical, to }]
  })
}

export function collectBlockedReferences(params: {
  items: StructuralReferenceInput[]
  deletedPrefix: string
  isInsideDeletedTree: (filePath: string) => boolean
}): MetadataOperationBlockedReference[] {
  return params.items.flatMap((item) => {
    if (params.isInsideDeletedTree(item.filePath)) return []
    if (!canonicalMatchesPrefix(item.canonical, params.deletedPrefix)) return []
    return [{ filePath: item.filePath, yamlPath: item.yamlPath, value: item.canonical }]
  })
}

export function rewriteCanonicalPrefix(value: string, fromPrefix: string, toPrefix: string): string | undefined {
  if (value === fromPrefix) return toPrefix
  if (value.startsWith(`${fromPrefix}.`)) return `${toPrefix}${value.slice(fromPrefix.length)}`
  return undefined
}

function canonicalMatchesPrefix(value: string, prefix: string): boolean {
  return value === prefix || value.startsWith(`${prefix}.`)
}
```

Add traversal `collectStructuralReferencesForItem(item, owner)` in the same file. It must mirror `validateMetadataTargetsInModel`: recurse over `rule.properties`, use `propRule.yaml`, `getTypeRule(propRule.type, "structuralReferences")`, and recurse into `collectionItemRule`.

- [ ] **Step 5: Implement DataPath rewrite helpers**

Create `packages/core/metadata/operations/dataPathReferences.ts`:

```ts
export function rewriteDataPathSegments(
  value: string,
  resolvedSegments: readonly string[],
  segmentIndex: number,
  nextName: string,
): string {
  const sourceSegments = value.split(".")
  return sourceSegments
    .map((segment, index) => {
      if (index !== segmentIndex) return segment
      const suffix = segment.slice(resolvedSegments[index]!.length)
      return `${nextName}${suffix}`
    })
    .join(".")
}
```

Add `collectDataPathReferenceChanges(snapshot, resolvedTarget, nextName)` in the same file. It calls existing `resolveDataPath` for form `DataPath` values and returns rewrite candidates only when `ResolvedDataPathTargetSource` points to the target being renamed. Unknown DataPath remains covered by the required validation gate.

- [ ] **Step 6: Run reference tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/references.test.ts packages/core/metadata/operations/dataPathReferences.test.ts packages/core/metadata/validation/metadataTargetTraversal.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataTargets packages/core/metadata/operations packages/core/metadata/orchestration/property
git commit -m "feat: ✨ добавить обход структурных ссылок metadata"
```

Expected: commit created.

## Task 8: File Plan And Write Application

**Files:**
- Create: `packages/core/metadata/operations/filePlan.ts`
- Test: `packages/core/metadata/operations/filePlan.test.ts`

- [ ] **Step 1: Write file plan tests**

Create `packages/core/metadata/operations/filePlan.test.ts`:

```ts
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { applyMetadataOperationFilePlan } from "./filePlan"

describe("applyMetadataOperationFilePlan", () => {
  const tempDirs: string[] = []
  afterEach(() => {
    vi.restoreAllMocks()
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("applies writes, renames and deletes in order", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-file-plan-"))
    tempDirs.push(dir)
    mkdirSync(join(dir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(dir, "Справочник", "Товары", "Свойства.yaml"), "Комментарий: Старый\n")

    const result = applyMetadataOperationFilePlan({
      steps: [
        { kind: "writeFile", path: join(dir, "Справочник", "Товары", "Свойства.yaml"), content: "Комментарий: Новый\n" },
        { kind: "renamePath", from: join(dir, "Справочник", "Товары"), to: join(dir, "Справочник", "Номенклатура") },
      ],
    })

    expect(result.ok).toBe(true)
    expect(readFileSync(join(dir, "Справочник", "Номенклатура", "Свойства.yaml"), "utf-8")).toBe("Комментарий: Новый\n")
  })

  it("reports partial write failure without rollback", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-file-plan-"))
    tempDirs.push(dir)
    mkdirSync(dir, { recursive: true })
    const first = join(dir, "first.yaml")
    const second = join(dir, "missing", "second.yaml")

    const result = applyMetadataOperationFilePlan({
      steps: [
        { kind: "writeFile", path: first, content: "ok: true\n" },
        { kind: "writeFile", path: second, content: "ok: false\n" },
      ],
    })

    expect(result).toMatchObject({
      ok: false,
      failedStep: "writeFile",
      appliedFiles: [first],
      pendingFiles: [second],
    })
  })
})
```

- [ ] **Step 2: Run failing file plan tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/filePlan.test.ts --no-isolate
```

Expected: FAIL because `filePlan.ts` does not exist.

- [ ] **Step 3: Implement file plan**

Create `packages/core/metadata/operations/filePlan.ts`:

```ts
import fs from "fs"
import { dirname } from "path"

export type MetadataOperationFileStep =
  | { kind: "writeFile"; path: string; content: string }
  | { kind: "renamePath"; from: string; to: string }
  | { kind: "removePath"; path: string }
  | { kind: "mkdir"; path: string }

export interface MetadataOperationFilePlan {
  steps: MetadataOperationFileStep[]
}

export type MetadataOperationFilePlanResult =
  | { ok: true; changedFiles: string[] }
  | { ok: false; failedStep: MetadataOperationFileStep["kind"]; message: string; appliedFiles: string[]; pendingFiles: string[] }

export function applyMetadataOperationFilePlan(plan: MetadataOperationFilePlan): MetadataOperationFilePlanResult {
  const appliedFiles: string[] = []
  const pendingFiles = (fromStepIndex(plan.steps, 0))

  for (let index = 0; index < plan.steps.length; index += 1) {
    const step = plan.steps[index]!
    try {
      applyStep(step)
      appliedFiles.push(...filesForStep(step))
      pendingFiles.splice(0, filesForStep(step).length)
    } catch (caught) {
      return {
        ok: false,
        failedStep: step.kind,
        message: caught instanceof Error ? caught.message : String(caught),
        appliedFiles,
        pendingFiles: fromStepIndex(plan.steps, index),
      }
    }
  }

  return { ok: true, changedFiles: appliedFiles }
}

function applyStep(step: MetadataOperationFileStep): void {
  if (step.kind === "mkdir") {
    fs.mkdirSync(step.path, { recursive: true })
    return
  }
  if (step.kind === "writeFile") {
    fs.mkdirSync(dirname(step.path), { recursive: true })
    fs.writeFileSync(step.path, step.content, "utf-8")
    return
  }
  if (step.kind === "renamePath") {
    fs.mkdirSync(dirname(step.to), { recursive: true })
    fs.renameSync(step.from, step.to)
    return
  }
  fs.rmSync(step.path, { recursive: true, force: true })
}

function filesForStep(step: MetadataOperationFileStep): string[] {
  if (step.kind === "writeFile") return [step.path]
  if (step.kind === "renamePath") return [step.from, step.to]
  if (step.kind === "removePath") return [step.path]
  return []
}

function fromStepIndex(steps: readonly MetadataOperationFileStep[], index: number): string[] {
  return steps.slice(index).flatMap(filesForStep)
}
```

- [ ] **Step 4: Run file plan tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/filePlan.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/core/metadata/operations/filePlan.ts packages/core/metadata/operations/filePlan.test.ts
git commit -m "feat: ✨ добавить план записи metadata-операций"
```

Expected: commit created.

## Task 9: Core Rename Operation

**Files:**
- Create: `packages/core/metadata/operations/renameItem.ts`
- Modify: `packages/core/metadata/operations/index.ts`
- Test: `packages/core/metadata/operations/renameItem.test.ts`

- [ ] **Step 1: Write rename operation tests**

Create `packages/core/metadata/operations/renameItem.test.ts` with tests for:

1. `returns validation_failed before invalid_name when project has validation errors`: create `Справочник/Товары/Свойства.yaml` with `НеизвестноеПоле: true`, call `renameMetadataItem({ projectDir, target: { kind: "object", itemTypePrefix: "Справочник", name: "Товары" }, newName: "Некорректное имя" })`, assert `code: "validation_failed"` and that no `Миграции` directory exists.
2. `plans object rename with migration and descendant reference rewrite`: create `Справочник/Товары` with attribute `Артикул` and another object that references `Catalog.Товары.Attribute.Артикул`, call no-write rename to `Номенклатура`, assert `mode: "plan"`, `createdMigration.from === "Справочник.Товары"`, `createdMigration.to === "Справочник.Номенклатура"`, and one `rewrittenReferences` entry from `Catalog.Товары.Attribute.Артикул` to `Catalog.Номенклатура.Attribute.Артикул`.
3. `applies attribute rename through model export and writes a migration file`: create `Справочник/Товары/Свойства.yaml` with `Реквизиты/Артикул`, call `allowWrite: true` rename to `КодПоставщика`, assert YAML contains `КодПоставщика`, old key is absent, and `Миграции/<timestamp>.yaml` contains `"Справочник.Товары.Реквизит.Артикул": КодПоставщика`.
4. `allows case-only rename and blocks case-insensitive sibling conflicts`: create attributes `Артикул` and `Код`, assert `Артикул -> артикул` succeeds and `Артикул -> код` returns `name_conflict`.
5. `renames file item without migration and rewrites form references`: create `Формы/ФормаЭлемента/Форма.yaml`, reference it from owner properties, rename to `ФормаКарточки`, assert folder rename and `createdMigration` is absent.

Use tmp projects, write YAML files directly, and assert:

```ts
expect(result).toMatchObject({
  ok: true,
  mode: "plan",
  createdMigration: { from: "Справочник.Товары.Реквизит.Артикул", to: "Справочник.Товары.Реквизит.КодПоставщика" },
})
```

For apply mode assert the migration directory contains one timestamp file and YAML uses the new key after canonical export.

- [ ] **Step 2: Run failing rename tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/renameItem.test.ts --no-isolate
```

Expected: FAIL because `renameItem.ts` does not exist.

- [ ] **Step 3: Implement public rename function**

Create `packages/core/metadata/operations/renameItem.ts`:

```ts
import { join } from "path"
import { nextMigrationFileName, writeMigrationFile } from "~/metadata/appliedObjects/configuration/migrations"
import { buildMetadataOperationSnapshot } from "./projectSnapshot"
import { resolveMetadataOperationTarget } from "./targetResolver"
import { validateMetadataLocalName, hasCaseInsensitiveConflict } from "./nameRules"
import { applyMetadataOperationFilePlan, type MetadataOperationFileStep } from "./filePlan"
import type { MetadataOperationResult, MetadataOperationTarget } from "./types"

export interface RenameMetadataItemParams {
  projectDir: string
  target: MetadataOperationTarget
  newName: string
  allowWrite?: boolean
  now?: Date
}

export function renameMetadataItem(params: RenameMetadataItemParams): MetadataOperationResult {
  const snapshot = buildMetadataOperationSnapshot({ projectDir: params.projectDir, requireValidProject: true })
  if (!snapshot.ok) return snapshot

  const name = validateMetadataLocalName(params.newName)
  if (!name.ok) return failure("invalid_name", name.message)

  const resolved = resolveMetadataOperationTarget(snapshot, params.target)
  if (!resolved.ok) return failure(resolved.code, resolved.message)

  if (hasCaseInsensitiveConflict({ existingNames: resolved.collectionNames, currentName: localName(params.target), nextName: params.newName })) {
    return failure("name_conflict", `Имя "${params.newName}" уже занято в этой области имен`)
  }

  const plan = buildRenameFilePlan({ projectDir: params.projectDir, resolved, newName: params.newName, now: params.now })
  if (params.allowWrite !== true) return plan.result("plan")

  const applied = applyMetadataOperationFilePlan({ steps: plan.steps })
  if (!applied.ok) {
    return {
      ok: false,
      code: "write_failed",
      message: applied.message,
      changedFiles: applied.appliedFiles,
      rewrittenReferences: plan.rewrittenReferences,
      blockedReferences: [],
      failedStep: applied.failedStep,
      appliedFiles: applied.appliedFiles,
      pendingFiles: applied.pendingFiles,
    }
  }

  return plan.result("applied", applied.changedFiles)
}
```

Implement local helpers `buildRenameFilePlan`, `localName`, `failure`. `buildRenameFilePlan` must mutate the resolved model node name, apply structural reference rewrites, export every touched model through `yamlModelIO`, add directory rename for object/file item targets, and create migration through `writeMigrationFile` only in apply mode. In plan mode, `createdMigration.fileName` remains absent.

- [ ] **Step 4: Export rename**

Modify `packages/core/metadata/operations/index.ts`:

```ts
export * from "./renameItem"
```

- [ ] **Step 5: Run rename tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/renameItem.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add packages/core/metadata/operations
git commit -m "feat: ✨ добавить core-переименование metadata"
```

Expected: commit created.

## Task 10: Core Delete Operation

**Files:**
- Create: `packages/core/metadata/operations/deleteItem.ts`
- Modify: `packages/core/metadata/operations/index.ts`
- Test: `packages/core/metadata/operations/deleteItem.test.ts`

- [ ] **Step 1: Write delete operation tests**

Create `packages/core/metadata/operations/deleteItem.test.ts` with tests for:

1. `returns validation_failed before looking for references`: create invalid owner YAML, call delete, assert `code: "validation_failed"`.
2. `blocks external references to deleted object descendants`: create a reference from a surviving object to `Catalog.Товары.Attribute.Артикул`, delete `Справочник.Товары`, assert `code: "references_found"` and the blocking value.
3. `ignores references inside the deleted subtree`: put a reference in the same object being deleted, delete the owner, assert no blocked reference from files under the deleted directory.
4. `plans object deletion without migration`: no-write delete object with no external references, assert `mode: "plan"`, `createdMigration` is absent and `changedFiles` contains the owner directory or properties file.
5. `applies attribute deletion through model export`: delete `Реквизит.Артикул`, assert YAML no longer contains the key and no migration file is written.
6. `deletes file item resources without migration`: delete form target, assert form directory is removed and no migration file is written.

The blocked reference assertion must use:

```ts
expect(result).toMatchObject({
  ok: false,
  code: "references_found",
  changedFiles: [],
  rewrittenReferences: [],
  blockedReferences: [expect.objectContaining({ value: expect.stringContaining("Catalog.Товары") })],
})
```

- [ ] **Step 2: Run failing delete tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/deleteItem.test.ts --no-isolate
```

Expected: FAIL because `deleteItem.ts` does not exist.

- [ ] **Step 3: Implement public delete function**

Create `packages/core/metadata/operations/deleteItem.ts`:

```ts
import { buildMetadataOperationSnapshot } from "./projectSnapshot"
import { resolveMetadataOperationTarget } from "./targetResolver"
import { applyMetadataOperationFilePlan } from "./filePlan"
import type { MetadataOperationResult, MetadataOperationTarget } from "./types"

export interface DeleteMetadataItemParams {
  projectDir: string
  target: MetadataOperationTarget
  allowWrite?: boolean
}

export function deleteMetadataItem(params: DeleteMetadataItemParams): MetadataOperationResult {
  const snapshot = buildMetadataOperationSnapshot({ projectDir: params.projectDir, requireValidProject: true })
  if (!snapshot.ok) return snapshot

  const resolved = resolveMetadataOperationTarget(snapshot, params.target)
  if (!resolved.ok) {
    return {
      ok: false,
      code: resolved.code,
      message: resolved.message,
      changedFiles: [],
      rewrittenReferences: [],
      blockedReferences: [],
    }
  }

  const plan = buildDeleteFilePlan({ snapshot, resolved })
  if (plan.blockedReferences.length > 0) {
    return {
      ok: false,
      code: "references_found",
      message: "Удаление заблокировано структурными ссылками",
      changedFiles: [],
      rewrittenReferences: [],
      blockedReferences: plan.blockedReferences,
    }
  }

  if (params.allowWrite !== true) return plan.result("plan")

  const applied = applyMetadataOperationFilePlan({ steps: plan.steps })
  if (!applied.ok) {
    return {
      ok: false,
      code: "write_failed",
      message: applied.message,
      changedFiles: applied.appliedFiles,
      rewrittenReferences: [],
      blockedReferences: [],
      failedStep: applied.failedStep,
      appliedFiles: applied.appliedFiles,
      pendingFiles: applied.pendingFiles,
    }
  }

  return plan.result("applied", applied.changedFiles)
}
```

`buildDeleteFilePlan` removes object directories or file item directories, deletes named collection nodes from the imported model, exports touched YAML through `yamlModelIO`, and never creates migration entries.

- [ ] **Step 4: Export delete**

Modify `packages/core/metadata/operations/index.ts`:

```ts
export * from "./deleteItem"
```

- [ ] **Step 5: Run delete tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/deleteItem.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add packages/core/metadata/operations
git commit -m "feat: ✨ добавить core-удаление metadata"
```

Expected: commit created.

## Task 11: Sync To XML Migration Integration

**Files:**
- Create: `packages/core/metadata/operations/xmlChanges.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalPlan.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncState.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts`

- [ ] **Step 1: Add sync tests for migration output**

Extend sync tests with:

1. `returns migrationsApplied and changedXmlFiles only after successful full sync`: create one unapplied rename migration and matching YAML target, run full sync, assert `migrationsApplied` has `fileName/from/to` and `.nakidka-migrations.yaml` is updated.
2. `dry migration plan returns migrationsToApply without writing XML or applied state`: call the no-write core planning helper with the same project, assert XML files and `.nakidka-migrations.yaml` are unchanged.
3. `partial sync applies all unapplied migrations even when sync state has no YAML diff`: initialize sync state after YAML rename, add migration file, run partial sync, assert migration is applied.
4. `partial sync reports deleted XML files after top-level rename`: rename top-level object, run partial sync, assert old XML path appears with `change: "deleted"`.
5. `blocks whole sync on migration_chain_invalid before writing XML`: create invalid migration file, run sync, assert no XML content changes and no applied-state update.

Use existing temporary XML/YAML test style in `syncToXML.test.ts` and `incrementalSyncToXML.test.ts`; do not edit XML fixtures.

- [ ] **Step 2: Run failing sync tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts --no-isolate
```

Expected: FAIL on new expectations.

- [ ] **Step 3: Add XML change tracker**

Create `packages/core/metadata/operations/xmlChanges.ts`:

```ts
import fs from "fs"
import { join, relative, sep } from "path"
import type { MetadataOperationChangedXmlFile } from "./types"

export async function snapshotXmlTree(root: string): Promise<Map<string, string>> {
  const files = new Map<string, string>()
  await visit(root, async (path) => files.set(path, await fs.promises.readFile(path, "utf-8")))
  return files
}

export async function diffXmlTree(root: string, before: Map<string, string>): Promise<MetadataOperationChangedXmlFile[]> {
  const after = await snapshotXmlTree(root)
  const paths = new Set([...before.keys(), ...after.keys()])
  return [...paths]
    .sort((left, right) => left.localeCompare(right, "ru"))
    .flatMap((path) => {
      const previous = before.get(path)
      const current = after.get(path)
      if (previous === undefined && current !== undefined) return [{ path: rel(root, path), change: "added" as const }]
      if (previous !== undefined && current === undefined) return [{ path: rel(root, path), change: "deleted" as const }]
      if (previous !== current) return [{ path: rel(root, path), change: "changed" as const }]
      return []
    })
}

async function visit(path: string, onFile: (path: string) => Promise<void>): Promise<void> {
  if (!fs.existsSync(path)) return
  const stat = await fs.promises.stat(path)
  if (stat.isFile()) {
    await onFile(path)
    return
  }
  if (!stat.isDirectory()) return
  for (const entry of await fs.promises.readdir(path, { withFileTypes: true })) {
    await visit(join(path, entry.name), onFile)
  }
}

function rel(root: string, path: string): string {
  return relative(root, path).split(sep).join("/")
}
```

- [ ] **Step 4: Wire shared migration step into full sync**

In `syncConfigurationToXML`, replace direct calls to `readAppliedMigrationsState`, `readPendingMigrationEntries`, `applyPendingMigrationFiles`, `validateAppliedMigrationTarget`, `detectMigrationConflicts` with:

```ts
const migrationChain = prepareMetadataMigrationChain({
  yamlDir: inputDir,
  xmlDir: outputDir,
  referencePaths: [...referenceState.nodes.keys()],
  yamlPaths: [...yamlState.nodes.keys()],
  xmlAreaByMigrationPath: (path) => resolveXmlAreaForMigrationPath(path, inputDir),
})
if (!migrationChain.ok) {
  return {
    succeeded: 0,
    failed: [{ kind: "migration", name: "Миграции", error: new Error(JSON.stringify(migrationChain)) }],
    migrationChain,
  }
}
```

Use `migrationChain.referencePathByCurrentPath` where old code used `migrationResult.referencePathByCurrentPath`. Write `.nakidka-migrations.yaml` only after all XML sync work succeeds. Return:

```ts
{
  succeeded: batchResult.succeeded,
  failed: [],
  migrationsApplied: migrationChain.migrationsToApply,
  changedXmlFiles,
}
```

- [ ] **Step 5: Wire migration areas into partial sync**

In `syncConfigurationIncrementallyToXML`:

1. Prepare migration chain before the early "no diff" return.
2. If migration chain has errors, return failure before writing XML.
3. Add `migrationChain.xmlAreas` to the incremental plan.
4. Treat non-empty migration list as work even when sync state diff is empty.
5. After full success, write applied migration state and recalculate sync state over the whole YAML project.

Modify `buildIncrementalXmlSyncPlan` signature to:

```ts
export function buildIncrementalXmlSyncPlan(params: {
  diff: XmlSyncStateDiff
  rules: readonly MetadataItemRule[]
  extraAreas?: readonly XmlSyncArea[]
}): IncrementalXmlSyncPlan
```

Add `extraAreas` to the grouped plan by `areaKey(area)`.

- [ ] **Step 6: Keep migrations out of sync state**

In `packages/core/metadata/appliedObjects/configuration/syncState.ts`, ensure `hashProjectFiles` skips paths whose first segment is `Миграции`.

Add a test in `syncState.test.ts`:

```ts
expect(Object.keys(await hashProjectFiles(projectDir))).not.toEqual(expect.arrayContaining(["Миграции/2026-06-30-120000.yaml"]))
```

- [ ] **Step 7: Run sync tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts packages/core/metadata/appliedObjects/configuration/syncState.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration packages/core/metadata/operations
git commit -m "feat: ✨ применять metadata-миграции при XML-синхронизации"
```

Expected: commit created.

## Task 12: MCP Tools And Agent Guidance

**Files:**
- Modify: `packages/mcp/src/coreApi.ts`
- Create: `packages/mcp/src/contracts/operations.ts`
- Create: `packages/mcp/src/services/listOperationTargets.ts`
- Create: `packages/mcp/src/services/renameItem.ts`
- Create: `packages/mcp/src/services/deleteItem.ts`
- Modify: `packages/mcp/src/services/syncToXml.ts`
- Modify: `packages/mcp/src/contracts/syncToXml.ts`
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/mcp/src/guides/index.ts`
- Modify: `packages/mcp/src/prompts/index.ts`
- Test: `packages/mcp/src/services/listOperationTargets.test.ts`
- Test: `packages/mcp/src/services/renameItem.test.ts`
- Test: `packages/mcp/src/services/deleteItem.test.ts`
- Test: `packages/mcp/src/services/syncToXml.test.ts`
- Test: `packages/mcp/src/server.test.ts`
- Test: `packages/mcp/src/guides/index.test.ts`
- Test: `packages/mcp/src/prompts/index.test.ts`

- [ ] **Step 1: Add MCP service tests**

Create service tests that inject fake deps and assert the services only pass through arguments:

```ts
expect(core.renameMetadataItem).toHaveBeenCalledWith({
  projectDir: "/project",
  target: { kind: "object", itemTypePrefix: "Справочник", name: "Товары" },
  newName: "Номенклатура",
  allowWrite: true,
})
```

For `syncToXml` no-write:

```ts
const result = await syncToXml({ yamlDir: "/yaml", xmlDir: "/xml", allowWrite: false }, deps)
expect(result).toMatchObject({ ok: true, result: { mode: "plan", migrationsToApply: [] } })
expect(deps.planSyncToXml).toHaveBeenCalled()
```

- [ ] **Step 2: Run failing MCP tests**

Run:

```bash
pnpm --filter @nakidka/mcp test
```

Expected: FAIL on missing contracts/services/tools.

- [ ] **Step 3: Extend CoreApi**

Modify `packages/mcp/src/coreApi.ts`:

```ts
import type {
  MetadataOperationTarget,
  MetadataOperationResult,
  MigrationChainInvalidResult,
  MigrationPlanItem,
  MetadataOperationChangedXmlFile,
} from "@nakidka/core"
```

Add methods:

```ts
listMetadataOperationTargets(params: {
  projectDir: string
  query?: string
  kind?: MetadataOperationTarget["kind"]
  owner?: { itemTypePrefix: string; name: string }
  limit?: number
}): { ok: true; targets: unknown[] }
renameMetadataItem(params: { projectDir: string; target: MetadataOperationTarget; newName: string; allowWrite?: boolean }): MetadataOperationResult
deleteMetadataItem(params: { projectDir: string; target: MetadataOperationTarget; allowWrite?: boolean }): MetadataOperationResult
planSyncToXml(params: { inputDir: string; outputDir: string; referenceDir?: string }): Promise<
  | { ok: true; mode: "plan"; migrationsToApply: MigrationPlanItem[] }
  | MigrationChainInvalidResult
>
```

- [ ] **Step 4: Add operation contracts**

Create `packages/mcp/src/contracts/operations.ts`:

```ts
import { z } from "zod/v4"

const localName = z.string().min(1).regex(/^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*$/)
const ownerShape = z.object({ itemTypePrefix: localName, name: localName })

export const metadataOperationTargetShape = z.union([
  z.object({ kind: z.literal("object"), itemTypePrefix: localName, name: localName }),
  z.object({
    kind: z.union([
      z.literal("attribute"),
      z.literal("tabularSection"),
      z.literal("dimension"),
      z.literal("resource"),
      z.literal("addressingAttribute"),
      z.literal("command"),
    ]),
    owner: ownerShape,
    parent: z.object({ kind: z.literal("tabularSection"), name: localName }).optional(),
    name: localName,
  }),
  z.object({
    kind: z.literal("fileItem"),
    owner: ownerShape,
    role: z.union([z.literal("form"), z.literal("template"), z.literal("command")]),
    name: localName,
  }),
])

export const listOperationTargetsInputShape = {
  projectDir: z.string().min(1),
  query: z.string().min(1).optional(),
  kind: z.string().min(1).optional(),
  owner: ownerShape.optional(),
  limit: z.number().int().positive().max(500).optional(),
}

export const renameItemInputShape = {
  projectDir: z.string().min(1),
  target: metadataOperationTargetShape,
  newName: localName,
  allowWrite: z.boolean().optional(),
}

export const deleteItemInputShape = {
  projectDir: z.string().min(1),
  target: metadataOperationTargetShape,
  allowWrite: z.boolean().optional(),
}
```

- [ ] **Step 5: Add thin services**

Each service loads core and returns `toolSuccess(coreResult)` or `toolError("core_error", errorMessage(caught))` on thrown exceptions. `renameItem` and `deleteItem` must not require `allowWrite=true`; no-write is a valid plan mode.

- [ ] **Step 6: Register tools**

Modify `packages/mcp/src/tools/registerTools.ts` to register:

```ts
server.registerTool("nkdk.list_operation_targets", { title: "List NKDK metadata operation targets", description: "Возвращает готовые target-объекты для безопасного переименования и удаления metadata.", inputSchema: listOperationTargetsInputShape }, async (input) => jsonToolResult(await listOperationTargets(input)))
server.registerTool("nkdk.rename_item", { title: "Rename NKDK metadata item", description: "Единственный MCP-способ сохранить XML/reference identity при переименовании metadata-объекта или дочернего элемента.", inputSchema: renameItemInputShape }, async (input) => jsonToolResult(await renameItem(input)))
server.registerTool("nkdk.delete_item", { title: "Delete NKDK metadata item", description: "Удаляет metadata-объект или дочерний элемент в YAML. Миграцию не пишет; отсутствующий YAML-узел будет удален при XML-синхронизации.", inputSchema: deleteItemInputShape }, async (input) => jsonToolResult(await deleteItem(input)))
```

- [ ] **Step 7: Update guide and prompt**

In `packages/mcp/src/guides/index.ts`, add to `nkdk://guides/config-edit-yaml`:

```md
Если пользователь хочет переименовать metadata-объект или дочерний элемент с сохранением XML/reference identity, не правь YAML руками. Сначала вызови `nkdk.list_operation_targets`, затем `nkdk.rename_item`. Удаление выполняй через `nkdk.delete_item`, потому что tool проверяет структурные ссылки.
```

In `packages/mcp/src/prompts/index.ts`, add the same rule before generic YAML editing instructions.

- [ ] **Step 8: Run MCP tests**

Run:

```bash
pnpm --filter @nakidka/mcp test
```

Expected: PASS.

- [ ] **Step 9: Commit**

Run:

```bash
git add packages/mcp/src
git commit -m "feat: ✨ добавить MCP tools для metadata-операций"
```

Expected: commit created.

## Task 13: CLI Thin Commands

**Files:**
- Modify: `packages/cli/src/commands/migration.ts`
- Modify: `packages/cli/src/commands/migration.test.ts`
- Modify: `packages/cli/src/cli.ts`
- Modify: `packages/cli/src/cli.test.ts`

- [ ] **Step 1: Update CLI tests**

Change `rename` expectations from “create migration only” to “call core operation”. Add tests:

1. `prints no-write rename plan by default`: call `createProgram({ exitOnUnhandledError: false })` with `rename <yaml-dir> Справочник.Товары Номенклатура`, spy stdout, assert JSON includes `"mode": "plan"`.
2. `applies rename only with --write`: call the same command with `--write`, assert files changed and JSON includes `"mode": "applied"`.
3. `delete prints blocked references and exits non-zero`: create a blocking structural reference, call `delete --write`, assert stdout JSON includes `"code": "references_found"` and `process.exitCode === 1`.

Keep `generate-migration` tests for strict migration review, but remove expectations for `Добавить`/`Удалить` service values.

- [ ] **Step 2: Run failing CLI tests**

Run:

```bash
pnpm --filter @nakidka/cli test
```

Expected: FAIL on old command behavior.

- [ ] **Step 3: Parse human path into structured target**

In `packages/cli/src/commands/migration.ts`, add:

```ts
export function parseOperationTargetPath(path: string) {
  const parts = path.split(".")
  if (parts.length === 2) return { kind: "object" as const, itemTypePrefix: parts[0]!, name: parts[1]! }
  if (parts.length === 4 && parts[2] === "Реквизит") {
    return { kind: "attribute" as const, owner: { itemTypePrefix: parts[0]!, name: parts[1]! }, name: parts[3]! }
  }
  if (parts.length === 4 && parts[2] === "ТабличнаяЧасть") {
    return { kind: "tabularSection" as const, owner: { itemTypePrefix: parts[0]!, name: parts[1]! }, name: parts[3]! }
  }
  if (parts.length === 6 && parts[2] === "ТабличнаяЧасть" && parts[4] === "Реквизит") {
    return {
      kind: "attribute" as const,
      owner: { itemTypePrefix: parts[0]!, name: parts[1]! },
      parent: { kind: "tabularSection" as const, name: parts[3]! },
      name: parts[5]!,
    }
  }
  if (parts.length === 4 && parts[2] === "Форма") {
    return { kind: "fileItem" as const, owner: { itemTypePrefix: parts[0]!, name: parts[1]! }, role: "form" as const, name: parts[3]! }
  }
  throw new Error(`Неподдерживаемый путь metadata-операции: ${path}`)
}
```

- [ ] **Step 4: Call core operations**

Replace `renameMigration`/`deleteMigration` implementation with:

```ts
export function renameMigration(yamlDir: string, path: string, newName: string, allowWrite = false): void {
  const result = renameMetadataItem({ projectDir: yamlDir, target: parseOperationTargetPath(path), newName, allowWrite })
  process.stdout.write(JSON.stringify(result, null, 2) + "\n")
  if (!result.ok) process.exitCode = 1
}

export function deleteMigration(yamlDir: string, path: string, allowWrite = false): void {
  const result = deleteMetadataItem({ projectDir: yamlDir, target: parseOperationTargetPath(path), allowWrite })
  process.stdout.write(JSON.stringify(result, null, 2) + "\n")
  if (!result.ok) process.exitCode = 1
}
```

- [ ] **Step 5: Add `--write` option**

Modify `packages/cli/src/cli.ts`:

```ts
program
  .command("rename")
  .description("Переименовать metadata-объект или дочерний элемент")
  .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
  .argument("<path>", "полный путь элемента")
  .argument("<new-name>", "новое локальное имя")
  .option("--write", "записать изменения; без флага печатается план")
  .action((yamlDir: string, path: string, newName: string, opts: { write?: boolean }) => {
    run(() => Promise.resolve(renameMigration(yamlDir, path, newName, opts.write === true)), options)
  })
```

Apply the same `--write` option for `delete`.

- [ ] **Step 6: Run CLI tests**

Run:

```bash
pnpm --filter @nakidka/cli test
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/cli/src
git commit -m "feat: ✨ перевести CLI rename/delete на core-операции"
```

Expected: commit created.

## Task 14: Cross-Package Verification

**Files:**
- All touched files.

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations packages/core/metadata/appliedObjects/configuration --no-isolate
```

Expected: PASS.

- [ ] **Step 2: Run MCP and CLI tests**

Run:

```bash
pnpm --filter @nakidka/mcp test
```

Expected: PASS.

Run:

```bash
pnpm --filter @nakidka/cli test
```

Expected: PASS.

- [ ] **Step 3: Run type checks**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

Run:

```bash
pnpm --filter @nakidka/mcp type-check
```

Expected: PASS.

- [ ] **Step 4: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 5: Run diff check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 6: Final commit if verification changed snapshots or docs**

Run:

```bash
git status --short
```

Expected: either clean, or only intended files remain. If intended files remain:

```bash
git add <intended-files>
git commit -m "test: ✅ проверить metadata rename/delete операции"
```

Expected: commit created or clean tree.

## Self-Review

Spec coverage:

- Core owns business logic: Tasks 4, 6, 9, 10.
- MCP and CLI thin: Tasks 12, 13.
- Structured target and target listing: Tasks 1, 4, 12.
- Whole-project validation before rename/delete: Task 6 and integration in Tasks 9, 10.
- Rename writes YAML/model/file changes, migration when required, and structural references: Tasks 7, 8, 9.
- Delete blocks external structural references and writes no migration: Tasks 7, 8, 10.
- Migration file format, applied state, conflicts and sequential collapse: Task 5.
- Full and partial `sync_to_xml` migration behavior, no-write migration preview, `migrationsApplied`, `changedXmlFiles`: Task 11 and Task 12.
- `Миграции/**` ignored by sync state: Task 11.
- File write failure without rollback promise: Task 8 and operation integration in Tasks 9, 10.
- DataPath first-step support where resolution is confident: Task 7.
- No validation requirement for `list_operation_targets`: Task 4.

Marker scan: the document avoids deferred-work markers and keeps code-changing steps tied to concrete file paths and code shape.

Type consistency:

- Public core names are `listMetadataOperationTargets`, `renameMetadataItem`, `deleteMetadataItem`.
- MCP tool names are `nkdk.list_operation_targets`, `nkdk.rename_item`, `nkdk.delete_item`.
- Operation target type is `MetadataOperationTarget` everywhere.
- Migration error top code is `migration_chain_invalid`; validation top code is `validation_failed`.
