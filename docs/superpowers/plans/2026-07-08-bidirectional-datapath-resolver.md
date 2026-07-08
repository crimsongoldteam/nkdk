# Bidirectional DataPath Resolver Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one shared bidirectional DataPath resolver for validation, XML -> YAML formatting, YAML -> XML formatting, and rename/delete reference detection.

**Architecture:** Extract the path traversal logic from `validation/dataPath/resolver.ts` into a YAML-position-free core resolver that returns structured target, type, issue, and replacement information. Keep validation diagnostics as a wrapper around that core, and add a small formatter service that uses the core resolver to convert only confidently resolved standard-member segments. Replace `commonObjects/metadataPath/dataPathStandardMembers.ts` name-root heuristics with the formatter.

**Tech Stack:** TypeScript, Vitest, existing metadata validation/dataPath modules, existing form import/export contexts.

## Global Constraints

- Resolver must be one shared mechanism for validation, XML -> YAML, YAML -> XML, and rename/delete.
- Resolver must resolve DataPath to arbitrary depth.
- Resolver must not infer meaning from root names such as `Объект`, `Запись`, or `Список`.
- Resolver must use form attributes, their types, owner metadata, metadata paths, and registered standard members.
- Round-trip formatting must leave the original DataPath unchanged when resolution is not confident.
- Validation remains responsible for `filePath`, `ParsedYaml`, `yamlPath`, diagnostics, severity, and policy checks.
- `validateResolvedDataPathPolicy` must consume `target.typeInfo`; it must not recompute DataPath types.
- Do not enable full validation as part of `nkdk sync`.
- Do not create separate XML and YAML resolvers.
- Keep existing XML fixtures unchanged.

---

## File Structure

- Create `packages/core/metadata/validation/dataPath/coreResolver.ts`: YAML-position-free resolver core and shared result types.
- Modify `packages/core/metadata/validation/dataPath/resolver.ts`: turn current validation resolver into diagnostics wrapper over `resolveDataPathCore`.
- Create `packages/core/metadata/validation/dataPath/formatter.ts`: bidirectional formatter for standard-member segment replacements.
- Create `packages/core/metadata/validation/dataPath/formatter.test.ts`: tests for table columns, dynamic lists, object refs, deep paths, and unknown paths.
- Modify `packages/core/metadata/validation/dataPath/resolver.test.ts`: keep existing validation resolver behavior passing; add one assertion that validation diagnostics still include YAML locations after extraction.
- Modify `packages/core/metadata/commonObjects/metadataPath/dataPathStandardMembers.ts`: remove root-name heuristics and call the formatter when context has enough form/owner data.
- Modify `packages/core/metadata/context/types.ts`: replace the reduced `FormDataPathAttributeContext` with enough form attribute data to build `FormDataPathIndex`.
- Modify `packages/core/metadata/appliedObjects/configuration/convertFromXML.ts`: set `exportToYAML.projectDir` from `outputDir`.
- Modify `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`: set `importFromYAML.projectDir` from `inputDir`.
- Modify `packages/core/metadata/forms/clientApplicationForm/fromYAML.ts`: pass full form attributes from YAML into context for DataPath import.
- Modify `packages/core/metadata/forms/clientApplicationForm/toYAML.ts`: pass full form attributes from model into context for DataPath export.
- Modify `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`: cover `ValueTable` `Список.Код` remaining unchanged and object standard member converting back to internal.
- Modify `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`: cover `ValueTable` `Список.Code` remaining unchanged and object standard member converting to YAML.

### Task 1: Define Resolver Core Contract

**Files:**
- Create: `packages/core/metadata/validation/dataPath/coreResolver.ts`
- Test: `packages/core/metadata/validation/dataPath/resolver.test.ts`

**Interfaces:**
- Produces:

```ts
export type DataPathNameMode = "internal" | "yaml"

export interface TableContext {
  dataPath: string
}

export interface ResolvedDataPathTarget {
  value: string
  segments: readonly string[]
  typeInfo: DataPathTypeInfo
  source: ResolvedDataPathTargetSource
}

export type ResolvedDataPathTargetSource =
  | { kind: "formAttribute"; name: string }
  | { kind: "tableColumn"; table: string; name: string }
  | { kind: "objectField"; owner: OwnerTypeRef; name: string }
  | { kind: "constant"; name: string }
  | { kind: "registerRecords"; owner: OwnerTypeRef; name: string }
  | { kind: "registerRecordSet"; owner: OwnerTypeRef; name: string }
  | { kind: "standardPeriodField"; name: string }

export interface ResolveDataPathCoreParams {
  value: string
  nameMode: DataPathNameMode
  index: FormDataPathIndex
  ownerCache: OwnerMetadataCache
  tableContext?: TableContext
}

export interface ResolvedDataPathSegmentReplacement {
  segmentIndex: number
  from: string
  to: string
  reason: "standardMember"
}

export type ResolveDataPathCoreIssueCode =
  | "current_data_unsupported"
  | "tilde_variant"
  | "platform_source"
  | "table_context_mismatch"
  | "unknown_root"
  | "unknown_column"
  | "unknown_field"
  | "unknown_type"
  | "unsupported_intermediate"
  | "scalar_intermediate"
  | "composite_intermediate"
  | "owner_error"

export interface ResolveDataPathCoreIssue {
  code: ResolveDataPathCoreIssueCode
  severity: "warning" | "error"
  message: string
  ownerDiagnostics?: Diagnostic[]
}

export type ResolveDataPathCoreResult =
  | {
      status: "ok"
      value: string
      segments: readonly string[]
      target?: ResolvedDataPathTarget
      replacements: ResolvedDataPathSegmentReplacement[]
      issues: []
    }
  | {
      status: "warning" | "error"
      value: string
      segments: readonly string[]
      target?: ResolvedDataPathTarget
      replacements: ResolvedDataPathSegmentReplacement[]
      issues: ResolveDataPathCoreIssue[]
    }

export function resolveDataPathCore(params: ResolveDataPathCoreParams): ResolveDataPathCoreResult
```

- [ ] **Step 1: Add compile-only imports in resolver test**

In `packages/core/metadata/validation/dataPath/resolver.test.ts`, add this import:

```ts
import type {
  DataPathNameMode,
  ResolveDataPathCoreParams,
  ResolveDataPathCoreResult,
} from "./coreResolver"
```

Add this type-only test near the top of `describe("resolveDataPath", () => {`:

```ts
  it("exposes a YAML-position-free core resolver contract", () => {
    const nameMode: DataPathNameMode = "yaml"
    const params = {} as ResolveDataPathCoreParams
    const result = {} as ResolveDataPathCoreResult

    expect(nameMode).toBe("yaml")
    expect(params).toBeDefined()
    expect(result).toBeDefined()
  })
```

- [ ] **Step 2: Run focused test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/resolver.test.ts -t "core resolver contract"
```

Expected: FAIL because `./coreResolver` does not exist.

- [ ] **Step 3: Create the core contract file**

Create `packages/core/metadata/validation/dataPath/coreResolver.ts` with:

```ts
import type { Diagnostic } from "../types"
import type { FormDataPathIndex } from "./formIndex"
import type { OwnerMetadataCache } from "./ownerCache"
import type { DataPathTypeInfo, OwnerTypeRef } from "./types"

export type DataPathNameMode = "internal" | "yaml"

export interface TableContext {
  dataPath: string
}

export interface ResolvedDataPathTarget {
  value: string
  segments: readonly string[]
  typeInfo: DataPathTypeInfo
  source: ResolvedDataPathTargetSource
}

export type ResolvedDataPathTargetSource =
  | { kind: "formAttribute"; name: string }
  | { kind: "tableColumn"; table: string; name: string }
  | { kind: "objectField"; owner: OwnerTypeRef; name: string }
  | { kind: "constant"; name: string }
  | { kind: "registerRecords"; owner: OwnerTypeRef; name: string }
  | { kind: "registerRecordSet"; owner: OwnerTypeRef; name: string }
  | { kind: "standardPeriodField"; name: string }

export interface ResolveDataPathCoreParams {
  value: string
  nameMode: DataPathNameMode
  index: FormDataPathIndex
  ownerCache: OwnerMetadataCache
  tableContext?: TableContext
}

export interface ResolvedDataPathSegmentReplacement {
  segmentIndex: number
  from: string
  to: string
  reason: "standardMember"
}

export type ResolveDataPathCoreIssueCode =
  | "current_data_unsupported"
  | "tilde_variant"
  | "platform_source"
  | "table_context_mismatch"
  | "unknown_root"
  | "unknown_column"
  | "unknown_field"
  | "unknown_type"
  | "unsupported_intermediate"
  | "scalar_intermediate"
  | "composite_intermediate"
  | "owner_error"

export interface ResolveDataPathCoreIssue {
  code: ResolveDataPathCoreIssueCode
  severity: "warning" | "error"
  message: string
  ownerDiagnostics?: Diagnostic[]
}

export type ResolveDataPathCoreResult =
  | {
      status: "ok"
      value: string
      segments: readonly string[]
      target?: ResolvedDataPathTarget
      replacements: ResolvedDataPathSegmentReplacement[]
      issues: []
    }
  | {
      status: "warning" | "error"
      value: string
      segments: readonly string[]
      target?: ResolvedDataPathTarget
      replacements: ResolvedDataPathSegmentReplacement[]
      issues: ResolveDataPathCoreIssue[]
    }

export function resolveDataPathCore(params: ResolveDataPathCoreParams): ResolveDataPathCoreResult {
  const segments = params.value.split(".")
  return {
    status: "ok",
    value: params.value,
    segments,
    replacements: [],
    issues: [],
  }
}
```

- [ ] **Step 4: Run focused test to verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/resolver.test.ts -t "core resolver contract"
```

Expected: PASS.

### Task 2: Move Traversal Into Core Without Changing Validation Behavior

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/coreResolver.ts`
- Modify: `packages/core/metadata/validation/dataPath/resolver.ts`
- Test: `packages/core/metadata/validation/dataPath/resolver.test.ts`

**Interfaces:**
- Consumes: `resolveDataPathCore(params): ResolveDataPathCoreResult`
- Produces: existing `resolveDataPath(params): ResolveDataPathResult` as diagnostics wrapper

- [ ] **Step 1: Add validation-location regression test**

In `packages/core/metadata/validation/dataPath/resolver.test.ts`, add:

Use the existing local helpers `resolve` and `indexWithAttributes`. The `resolve` helper currently builds `ParsedYaml` from the value itself, so place the DataPath at the root YAML path `["ПутьКДанным"]`:

```ts
  it("keeps YAML-position diagnostics in the validation wrapper", () => {
    const result = resolve("НеизвестныйКорень.Код", {
      index: indexWithAttributes([]),
      yamlPath: ["ПутьКДанным"],
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          line: 1,
          col: 1,
          source: "structure",
          message: 'ПутьКДанным "НеизвестныйКорень.Код": неизвестный корень "НеизвестныйКорень"',
        }),
      ],
    })
  })
```

- [ ] **Step 2: Run resolver tests before extraction**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/resolver.test.ts
```

Expected: PASS before refactor. This confirms the new test describes current wrapper behavior.

- [ ] **Step 3: Move traversal types to core**

In `packages/core/metadata/validation/dataPath/coreResolver.ts`, move or duplicate these exports from `resolver.ts`:

```ts
export interface TableContext {
  dataPath: string
}

export interface ResolvedDataPathTarget {
  value: string
  segments: readonly string[]
  typeInfo: DataPathTypeInfo
  source: ResolvedDataPathTargetSource
}

export type ResolvedDataPathTargetSource =
  | { kind: "formAttribute"; name: string }
  | { kind: "tableColumn"; table: string; name: string }
  | { kind: "objectField"; owner: OwnerTypeRef; name: string }
  | { kind: "constant"; name: string }
  | { kind: "registerRecords"; owner: OwnerTypeRef; name: string }
  | { kind: "registerRecordSet"; owner: OwnerTypeRef; name: string }
  | { kind: "standardPeriodField"; name: string }
```

Update imports in `formTraversal.ts`, `dataPathReferences.ts`, `policies.ts`, and `projectValidationPendingChecks.ts` to import `TableContext` or `ResolvedDataPathTarget` from `./coreResolver` / `../validation/dataPath/coreResolver` instead of `./resolver`.

- [ ] **Step 4: Extract `resolveDataPathCore` body**

Move the body of current `resolveDataPath(params)` from `resolver.ts` into `resolveDataPathCore(params)` in `coreResolver.ts`.

Mechanical changes during the move:

- remove `filePath`, `parsed`, `yamlPath` from core params;
- replace `warning(params, message)` with:

```ts
return issueResult({ status: "warning", params, code: "platform_source", message })
```

- replace `error(params, message)` with:

```ts
return issueResult({ status: "error", params, code: "unknown_field", message })
```

- replace owner metadata errors with:

```ts
return {
  status: "error",
  value: params.value,
  segments,
  replacements,
  issues: [{ code: "owner_error", severity: "error", message: "Не удалось прочитать владельца DataPath", ownerDiagnostics: result.diagnostics }],
}
```

Add these helpers to `coreResolver.ts`:

```ts
function okTarget(params: {
  value: string
  segments: readonly string[]
  state: TraversalState
  replacements: ResolvedDataPathSegmentReplacement[]
}): ResolveDataPathCoreResult {
  return {
    status: "ok",
    value: params.value,
    segments: params.segments,
    target: {
      value: params.value,
      segments: params.segments,
      typeInfo: params.state.typeInfo,
      source: params.state.source,
    },
    replacements: params.replacements,
    issues: [],
  }
}

function issueResult(params: {
  status: "warning" | "error"
  coreParams: ResolveDataPathCoreParams
  segments: readonly string[]
  replacements: ResolvedDataPathSegmentReplacement[]
  code: ResolveDataPathCoreIssueCode
  message: string
}): ResolveDataPathCoreResult {
  return {
    status: params.status,
    value: params.coreParams.value,
    segments: params.segments,
    replacements: params.replacements,
    issues: [{ code: params.code, severity: params.status, message: params.message }],
  }
}
```

Keep `nameMode` unused in this task except passing it through; replacement collection is added in Task 3.

- [ ] **Step 5: Make validation resolver a wrapper**

In `packages/core/metadata/validation/dataPath/resolver.ts`, keep `ResolveDataPathParams`, `ResolveDataPathResult`, and `resolveDataPath`.

Implement `resolveDataPath` as:

```ts
export function resolveDataPath(params: ResolveDataPathParams): ResolveDataPathResult {
  const core = resolveDataPathCore({
    value: params.value,
    nameMode: "yaml",
    index: params.index,
    ownerCache: params.ownerCache,
    ...(params.tableContext !== undefined ? { tableContext: params.tableContext } : {}),
  })

  const diagnostics = core.issues.flatMap((issue) =>
    issue.ownerDiagnostics ??
    [
      diagnosticAtYamlPath({
        filePath: params.filePath,
        parsed: params.parsed,
        path: params.yamlPath,
        severity: issue.severity,
        source: "structure",
        message: issue.message,
      }),
    ]
  )

  if (core.status === "ok") return { status: "ok", target: core.target, diagnostics }
  if (core.status === "warning") return { status: "warning", target: core.target, diagnostics }
  return { status: "error", diagnostics }
}
```

- [ ] **Step 6: Run resolver tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/resolver.test.ts metadata/validation/dataPath/policies.test.ts metadata/validation/dataPath/formTraversal.test.ts
```

Expected: PASS.

### Task 3: Add Standard-Member Replacement Tracking

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/coreResolver.ts`
- Modify: `packages/core/metadata/validation/dataPath/standardMembers.ts`
- Test: `packages/core/metadata/validation/dataPath/resolver.test.ts`

**Interfaces:**
- Produces: `ResolveDataPathCoreResult.replacements` for standard-member segments

- [ ] **Step 1: Add core replacement tests**

In `packages/core/metadata/validation/dataPath/resolver.test.ts`, import runtime core function:

```ts
import { resolveDataPathCore } from "./coreResolver"
```

Add tests:

```ts
  it("reports yaml-to-internal replacement for a standard owner member", () => {
    const result = resolveDataPathCore({
      value: "Объект.Код",
      nameMode: "yaml",
      index: indexWithAttributes([attribute("Объект", { type: ["CatalogRef.Товары"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Справочник", name: "Товары" },
          rule: MetadataCatalogRules,
          model: { itemType: "MetadataCatalog" },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      replacements: [{ segmentIndex: 1, from: "Код", to: "Code", reason: "standardMember" }],
      target: { source: { kind: "objectField", name: "Code" } },
    })
  })

  it("does not report standard-member replacement for a ValueTable column", () => {
    const result = resolveDataPathCore({
      value: "Список.Код",
      nameMode: "yaml",
      index: indexWithAttributes([
        attribute("Список", { type: ["ValueTable"] }, [column("Код", { type: ["string"] })]),
      ]),
      ownerCache: ownerCache([]),
    })

    expect(result).toMatchObject({
      status: "ok",
      replacements: [],
      target: { source: { kind: "tableColumn", table: "Список", name: "Код" } },
    })
  })
```

Use existing test helpers in `resolver.test.ts`: `attribute`, `column`, `ownerCache`, and `owner`. For the object-owner case, pass:

```ts
ownerCache([
  owner({
    ref: { kind: "Справочник", name: "Товары" },
    rule: MetadataCatalogRules,
    model: { itemType: "MetadataCatalog" },
  }),
])
```

For empty cache, pass `ownerCache([])`.

- [ ] **Step 2: Run focused tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/resolver.test.ts -t "replacement"
```

Expected: FAIL because core returns no replacements.

- [ ] **Step 3: Return both names from traversal standard members**

In `packages/core/metadata/validation/dataPath/standardMembers.ts`, change:

```ts
export interface ResolvedTraversalStandardMember {
  name: string
  typeInfo: DataPathTypeInfo
  tableSource?: { ... }
}
```

to:

```ts
export interface ResolvedTraversalStandardMember {
  name: string
  internalName: string
  yamlName: string
  typeInfo: DataPathTypeInfo
  tableSource?: { ... }
}
```

For every return in `resolveTraversalTimeStandardMember`, set:

```ts
name: member.names.internal,
internalName: member.names.internal,
yamlName: member.names.yaml,
```

For reverse lookup helpers, pass `member` through and return the same three name fields.

- [ ] **Step 4: Record replacements in core traversal**

In `coreResolver.ts`, maintain:

```ts
const replacements: ResolvedDataPathSegmentReplacement[] = []
```

When `resolveTraversalTimeStandardMember` returns a standard member, add:

```ts
recordStandardMemberReplacement({
  replacements,
  nameMode: params.nameMode,
  segmentIndex: index,
  input: segment,
  internalName: standardMember.internalName,
  yamlName: standardMember.yamlName,
})
```

Add helper:

```ts
function recordStandardMemberReplacement(params: {
  replacements: ResolvedDataPathSegmentReplacement[]
  nameMode: DataPathNameMode
  segmentIndex: number
  input: string
  internalName: string
  yamlName: string
}): void {
  const to = params.nameMode === "yaml" ? params.internalName : params.yamlName
  if (params.input === to) return
  params.replacements.push({
    segmentIndex: params.segmentIndex,
    from: params.input,
    to,
    reason: "standardMember",
  })
}
```

Ensure every `okTarget` and `issueResult` receives the current `replacements`.

- [ ] **Step 5: Run replacement tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/resolver.test.ts -t "replacement"
```

Expected: PASS.

- [ ] **Step 6: Run full resolver tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/resolver.test.ts
```

Expected: PASS.

### Task 4: Add Bidirectional DataPath Formatter

**Files:**
- Create: `packages/core/metadata/validation/dataPath/formatter.ts`
- Create: `packages/core/metadata/validation/dataPath/formatter.test.ts`

**Interfaces:**
- Produces:

```ts
export type DataPathFormatDirection = "internal-to-yaml" | "yaml-to-internal"

export interface FormatDataPathStandardMembersParams {
  value: string
  direction: DataPathFormatDirection
  index: FormDataPathIndex
  ownerCache: OwnerMetadataCache
  tableContext?: TableContext
}

export function formatDataPathStandardMembers(params: FormatDataPathStandardMembersParams): string
```

- [ ] **Step 1: Write formatter tests**

Create `packages/core/metadata/validation/dataPath/formatter.test.ts` with these tests:

```ts
import { describe, expect, it } from "vitest"
import type { FormAttribute } from "../../forms/commonObjects/formAttribute/types"
import { buildFormDataPathIndex } from "./formIndex"
import { formatDataPathStandardMembers } from "./formatter"
import type { OwnerMetadataCache } from "./ownerCache"

describe("formatDataPathStandardMembers", () => {
  it("keeps ValueTable columns unchanged in both directions", () => {
    const index = indexWithAttributes([
      attribute("Список", { type: ["ValueTable"] }, [column("Код", { type: ["string"] })]),
    ])

    expect(formatDataPathStandardMembers({
      value: "Список.Код",
      direction: "yaml-to-internal",
      index,
      ownerCache: ownerCache([]),
    })).toBe("Список.Код")
    expect(formatDataPathStandardMembers({
      value: "Список.Код",
      direction: "internal-to-yaml",
      index,
      ownerCache: ownerCache([]),
    })).toBe("Список.Код")
  })

  it("formats object standard members in both directions", () => {
    const index = indexWithAttributes([attribute("Объект", { type: ["CatalogRef.Товары"] })])
    const ownerCache = ownerCache([
      owner({
        ref: { kind: "Справочник", name: "Товары" },
        rule: MetadataCatalogRules,
        model: { itemType: "MetadataCatalog" },
      }),
    ])

    expect(formatDataPathStandardMembers({
      value: "Объект.Код",
      direction: "yaml-to-internal",
      index,
      ownerCache,
    })).toBe("Объект.Code")
    expect(formatDataPathStandardMembers({
      value: "Объект.Code",
      direction: "internal-to-yaml",
      index,
      ownerCache,
    })).toBe("Объект.Код")
  })
})

function indexWithAttributes(attributes: FormAttribute[]) {
  return buildFormDataPathIndex({
    filePath: "Форма.yaml",
    parsed: { data: {}, syntaxErrors: [], locations: { keyOccurrences: () => [] } } as never,
    form: { itemType: "ClientApplicationForm", attributes },
  })
}
```

Add local `attribute`, `column`, `ownerCache`, and `owner` helpers by copying the minimal existing patterns from `resolver.test.ts`. The test owner for `CatalogRef.Товары` must use `MetadataCatalogRules` and model `{ itemType: "MetadataCatalog" }`. Empty cache is `ownerCache([])`.

- [ ] **Step 2: Run formatter tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/formatter.test.ts
```

Expected: FAIL because `formatter.ts` does not exist.

- [ ] **Step 3: Implement formatter**

Create `packages/core/metadata/validation/dataPath/formatter.ts`:

```ts
import type { FormDataPathIndex } from "./formIndex"
import type { OwnerMetadataCache } from "./ownerCache"
import { resolveDataPathCore, type TableContext } from "./coreResolver"

export type DataPathFormatDirection = "internal-to-yaml" | "yaml-to-internal"

export interface FormatDataPathStandardMembersParams {
  value: string
  direction: DataPathFormatDirection
  index: FormDataPathIndex
  ownerCache: OwnerMetadataCache
  tableContext?: TableContext
}

export function formatDataPathStandardMembers(params: FormatDataPathStandardMembersParams): string {
  const result = resolveDataPathCore({
    value: params.value,
    nameMode: params.direction === "yaml-to-internal" ? "yaml" : "internal",
    index: params.index,
    ownerCache: params.ownerCache,
    ...(params.tableContext !== undefined ? { tableContext: params.tableContext } : {}),
  })

  if (result.status === "error" || result.replacements.length === 0) return params.value

  const segments = params.value.split(".")
  for (const replacement of result.replacements) {
    const segment = segments[replacement.segmentIndex]
    if (segment === undefined) continue
    const suffix = segment.slice(replacement.from.length)
    segments[replacement.segmentIndex] = `${replacement.to}${suffix}`
  }
  return segments.join(".")
}
```

- [ ] **Step 4: Run formatter tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/formatter.test.ts
```

Expected: PASS.

### Task 5: Replace Round-Trip DataPath Heuristics

**Files:**
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/dataPathStandardMembers.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toYAML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`

**Interfaces:**
- Consumes: `formatDataPathStandardMembers`
- Produces: DataPath import/export formatting through resolver core

- [ ] **Step 1: Update context type to carry full attributes**

In `packages/core/metadata/context/types.ts`, change `FormDataPathAttributeContext` to:

```ts
export type FormDataPathAttributeContext = import("../forms/commonObjects/formAttribute/types").FormAttribute
```

If direct import type syntax is not accepted by the local TypeScript config, add a top-level type-only import:

```ts
import type { FormAttribute } from "../forms/commonObjects/formAttribute/types"
```

and define:

```ts
export type FormDataPathAttributeContext = FormAttribute
```

- [ ] **Step 2: Pass full attributes from YAML**

In `packages/core/metadata/forms/clientApplicationForm/fromYAML.ts`, remove `formDataPathAttributesFromYAML` reduced mapping and parse form attributes before importing all properties:

```ts
const contextWithAttributes: ConfigurationContext = context.importFromYAML
  ? {
      ...context,
      importFromYAML: {
        ...context.importFromYAML,
        formAttributes: importFormAttributesForDataPath(context, data.Реквизиты),
      },
    }
  : context
```

Implement a local partial rule constant and use it for the attribute-only import:

```ts
const FormAttributesOnlyRules = {
  ...ClientApplicationFormRules,
  properties: {
    attributes: ClientApplicationFormRules.properties.attributes,
  },
}
```

```ts
function importFormAttributesForDataPath(
  context: ConfigurationContext,
  attributes: FormAttributesYAML | undefined
): FormDataPathAttributeContext[] {
  if (attributes === undefined) return []
  const imported = importMetadataItemFromYAML({
    context,
    yaml: { Реквизиты: attributes },
    rule: FormAttributesOnlyRules as typeof ClientApplicationFormRules,
  }) as { attributes?: FormDataPathAttributeContext[] } | undefined
  return imported?.attributes ?? []
}
```

- [ ] **Step 3: Keep full attributes from model export**

In `packages/core/metadata/forms/clientApplicationForm/toYAML.ts`, keep:

```ts
formAttributes: data.attributes,
```

No behavior change should be needed after Task 5 Step 1 because `data.attributes` already has full `FormAttribute[]`.

- [ ] **Step 4: Replace heuristic implementation**

In `packages/core/metadata/commonObjects/metadataPath/dataPathStandardMembers.ts`, remove:

```ts
const DATA_OBJECT_ROOTS = new Set(["Объект", "Запись", "Список"])
```

Remove `translateDirectObjectMember`, `currentDataPathOwnerKind`, `isDynamicListDataPathRoot`, and their helper imports.

Implement:

```ts
import { buildFormDataPathIndex } from "../../validation/dataPath/formIndex"
import { formatDataPathStandardMembers } from "../../validation/dataPath/formatter"
import { createOwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import { createProjectYamlCache } from "../../validation/projectYamlCache"

export function exportDataPathStandardMembersToYAML(context: ConfigurationContext, value: unknown): unknown {
  if (typeof value !== "string") return value
  return formatWithResolver({ context, value, direction: "internal-to-yaml" })
}

export function importDataPathStandardMembersFromYAML(context: ConfigurationContext, value: unknown): unknown {
  if (typeof value !== "string") return value
  return formatWithResolver({ context, value, direction: "yaml-to-internal" })
}

function formatWithResolver(params: {
  context: ConfigurationContext
  value: string
  direction: "internal-to-yaml" | "yaml-to-internal"
}): string {
  const formAttributes = currentFormAttributes(params.context)
  const projectDir = params.context.importFromYAML?.projectDir ?? params.context.exportToYAML?.projectDir
  if (formAttributes.length === 0 || projectDir === undefined) return params.value

  const index = buildFormDataPathIndex({
    filePath: "",
    parsed: emptyParsedYaml(),
    form: { itemType: "ClientApplicationForm", attributes: formAttributes },
  })
  const ownerCache = createOwnerMetadataCache({
    projectDir,
    yamlCache: createProjectYamlCache(),
    context: params.context,
  })

  return formatDataPathStandardMembers({
    value: params.value,
    direction: params.direction,
    index,
    ownerCache,
  })
}
```

Add `projectDir?: string` to `FormExportToYAMLContext` and `FormimportFromYAMLContext`, then pass it from configuration-level import/export contexts in the next step.

- [ ] **Step 5: Pass projectDir into configuration contexts**

In `packages/core/metadata/appliedObjects/configuration/convertFromXML.ts`, create a context with project dir before root and object conversion:

```ts
const contextWithProjectDir: ConfigurationContextFromXML = {
  ...context,
  exportToYAML: {
    ...context.exportToYAML,
    projectDir: outputDir,
  },
}
```

Use `contextWithProjectDir` for `readConfigurationFromXML`, `writeConfigurationToYAML`, `syncRootConfigurationExternalFilesFromXML`, and `convertAppliedObjectFromXML`.

In `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`, include project dir in `syncContext`:

```ts
const syncContext: ConfigurationContextWithExportToXML = {
  ...context,
  importFromYAML: {
    ...(context.importFromYAML ?? {}),
    projectDir: inputDir,
  },
  exportToXML: {
    ...context.exportToXML,
    configDumpInfo,
    externalMetadataCollector:
      context.exportToXML.externalMetadataCollector ?? createConfigDumpInfoExternalMetadataCollector(configDumpInfo),
  },
}
```

In `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`, before incremental writes, create:

```ts
const contextWithProjectDir: ConfigurationContextWithExportToXML = {
  ...params.context,
  importFromYAML: {
    ...(params.context.importFromYAML ?? {}),
    projectDir: params.inputDir,
  },
}
```

Use `contextWithProjectDir` wherever the incremental sync currently passes `params.context` into `writeConfigurationArea`, `syncAppliedObjectAreaToXML`, `syncAppliedObjectToXML`, and property writers.

- [ ] **Step 6: Write fromYAML tests**

In `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`, add:

```ts
  it("keeps ValueTable field data paths in YAML spelling", () => {
    const context = contextWithProjectDir()

    expect(
      importClientApplicationFormFromYAML(context, {
        Реквизиты: {
          Список: {
            Тип: "ТаблицаЗначений",
            Колонки: {
              Код: { Тип: "Строка" },
            },
          },
        },
        Элементы: {
          Код: { Вид: "ПолеВвода", ПутьКДанным: "Список.Код" },
        },
      })
    ).toMatchObject({
      childItems: [{ dataPath: "Список.Код" }],
    })
  })
```

Add a second test for object standard member:

```ts
  it("imports object standard member data paths to internal spelling", () => {
    const context = contextWithProjectDir()

    expect(
      importClientApplicationFormFromYAML(context, {
        Реквизиты: {
          Объект: { Тип: "Справочник.Товары" },
        },
        Элементы: {
          Код: { Вид: "ПолеВвода", ПутьКДанным: "Объект.Код" },
        },
      })
    ).toMatchObject({
      childItems: [{ dataPath: "Объект.Code" }],
    })
  })
```

Create `contextWithProjectDir` helper in this test file:

```ts
function contextWithProjectDir(): ConfigurationContext {
  const projectDir = mkdtempSync(join(tmpdir(), "nkdk-datapath-form-"))
  dirs.push(projectDir)
  mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
  writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "Имя: Товары\n", "utf-8")
  return {
    ...mockContext,
    importFromYAML: {
      ...(mockContext.importFromYAML ?? {}),
      projectDir,
      metadataTargetOwners: [{ itemType: "MetadataCatalog", name: "Товары" }],
    },
  }
}
```

Add `dirs: string[]`, `afterEach` cleanup, and imports for `mkdtempSync`, `mkdirSync`, `rmSync`, `writeFileSync`, `tmpdir`, and `join` if the file does not already have them.

- [ ] **Step 7: Write toYAML tests**

In `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`, add matching tests:

```ts
  it("keeps ValueTable field data paths in internal-to-yaml formatting", () => {
    const context = contextWithProjectDir()
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      attributes: [
        {
          itemType: "FormAttribute",
          name: "Список",
          type: { type: ["ValueTable"] },
          columns: [{ name: "Код", type: { type: ["string"] } }],
        },
      ],
      childItems: [{ itemType: "InputField", name: "Код", dataPath: "Список.Код" }],
    }

    const { yaml } = exportClientApplicationFormToYAML(context, form)

    expect(yaml?.Элементы?.Код).toMatchObject({ ПутьКДанным: "Список.Код" })
  })
```

Add object standard member export:

```ts
  it("exports object standard member data paths to YAML spelling", () => {
    const context = contextWithProjectDir()
    const form: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      attributes: [
        { itemType: "FormAttribute", name: "Объект", type: { type: ["CatalogRef.Товары"] } },
      ],
      childItems: [{ itemType: "InputField", name: "Код", dataPath: "Объект.Code" }],
    }

    const { yaml } = exportClientApplicationFormToYAML(context, form)

    expect(yaml?.Элементы?.Код).toMatchObject({ ПутьКДанным: "Объект.Код" })
  })
```

- [ ] **Step 8: Run form tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromYAML.test.ts metadata/forms/clientApplicationForm/toYAML.test.ts
```

Expected: PASS.

### Task 6: Verify Validation and Round-Trip Regression

**Files:**
- Modify only if tests reveal integration issues in files from earlier tasks.

**Interfaces:**
- Consumes all previous tasks.
- Produces verified shared resolver behavior.

- [ ] **Step 1: Run validation/dataPath tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath
```

Expected: PASS.

- [ ] **Step 2: Run operation reference tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/operations/dataPathReferences.test.ts metadata/operations/renameItem.test.ts metadata/operations/deleteItem.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run full client form tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm
```

Expected: PASS.

- [ ] **Step 4: Run all project tests**

Run:

```bash
pnpm test
```

Expected: PASS in all packages.

- [ ] **Step 5: Run round-trip-yaml small**

Run from `/Users/nikita/git/nkdk`:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip NKDK_XML_DIR=/Users/nikita/git/round-trip/small ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: `nkdk import` and `nkdk sync` both finish with `0 с ошибкой`, and `Список.Код -> Список.Code` no longer appears in the selected diff or `git -C /Users/nikita/git/round-trip diff -- small`.

## Self-Review

- Spec coverage: tasks cover shared resolver core, validation wrapper, bidirectional formatting, removal of root-name heuristics, validation policy separation, rename/delete reuse, and `small` round-trip verification.
- Placeholder scan: no placeholder patterns or unspecified tests remain.
- Type consistency: `resolveDataPathCore`, `ResolveDataPathCoreResult`, `formatDataPathStandardMembers`, `DataPathNameMode`, and `DataPathFormatDirection` are named consistently across tasks.
