# Standard Members DataPath Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a declarative `standardMembers` registry for DataPath standard attributes, standard tabular sections, and standard tabular section columns.

**Architecture:** Concrete metadata objects declare their platform members in colocated `standardMembers.ts` files. Shared DataPath code only executes generic rule families and never hardcodes concrete object kinds or XML/YAML names. Existing imperative resolvers are migrated gradually behind the same registry contract.

**Tech Stack:** TypeScript, Vitest, existing `packages/core/metadata/validation/dataPath/*` resolver/registry, applied object `register.ts` entrypoints.

## Global Constraints

- Ответы и документация проекта пишутся на русском языке.
- `packages/core/metadata/orchestration`, `packages/core/metadata/validation` и `packages/core/metadata/project` не знают про конкретные реализации метаданных.
- Правила конкретных объектов описывают связи YAML/XML, структуру проекта, маршруты синхронизации и внешние обработчики декларативно через `rules.ts`, регистрацию property/item-типов и нейтральные договоры.
- Не выводить стандартные табличные части в YAML как секции объекта на первом этапе; использовать их только для перевода и валидации `DataPath`.
- `AccountingRegister.ExtDimension1..50` и `AccountingRegister.ExtDimensionType1..50` на первом этапе запрещены для использования и раскрытия.
- Декларации стандартных членов хранятся рядом с конкретными объектами: `metadata*/standardMembers.ts`.
- Перед закрытием issue обязательно прогнать `pnpm test` из корня.

---

## File Structure

- Create `packages/core/metadata/validation/dataPath/standardMembers.ts`.
  Defines the neutral declaration types, registration functions, lookup helpers, and generic executors for `index-time`, `traversal-time`, and table-column members.
- Modify `packages/core/metadata/validation/dataPath/registry.ts`.
  Re-export `standardMembers` registry hooks only as neutral contracts; do not add concrete object names.
- Modify `packages/core/metadata/validation/dataPath/objectFields.ts`.
  Use `standardMembers` declarations when building standard attributes and virtual standard tables.
- Modify `packages/core/metadata/validation/dataPath/resolver.ts`.
  Let `traversal-time` standard members participate before ordinary field lookup and return existing `DataPathTypeInfo` states.
- Modify `packages/core/metadata/appliedObjects/dataPathCommon/register.ts`.
  Move common primitive, self-object, owner, register-record-set column, and table-column behavior to declarations.
- Create or modify colocated `standardMembers.ts` files under applied objects:
  `metadataCatalog`, `metadataDocument`, `metadataEnumeration`, `metadataChartOfAccounts`, `metadataChartOfCharacteristicTypes`, `metadataChartOfCalculationTypes`, `metadataExchangePlan`, `metadataDocumentJournal`, `metadataBusinessProcess`, `metadataTask`, `metadataInformationRegister`, `metadataAccumulationRegister`, `metadataAccountingRegister`, `metadataCalculationRegister`.
- Modify each touched applied object `register.ts`.
  Import its `standardMembers.ts` so declarations register during existing applied object registration.
- Test files:
  `packages/core/metadata/validation/dataPath/standardMembers.test.ts`
  `packages/core/metadata/validation/dataPath/objectFields.test.ts`
  `packages/core/metadata/validation/dataPath/resolver.test.ts`
  `packages/core/metadata/validation/validateForm.test.ts`
  `packages/core/metadata/importBoundaries.test.ts`

---

### Task 1: Add the Neutral `standardMembers` Contract

**Files:**
- Create: `packages/core/metadata/validation/dataPath/standardMembers.ts`
- Modify: `packages/core/metadata/validation/dataPath/registry.ts`
- Test: `packages/core/metadata/validation/dataPath/standardMembers.test.ts`

**Interfaces:**
- Produces:
  `registerStandardMembers(ownerKind: string, members: readonly StandardMemberDeclaration[]): void`
  `getStandardMembers(ownerKind: string): readonly StandardMemberDeclaration[]`
  `resolveIndexTimeStandardMember(params: ResolveIndexTimeStandardMemberParams): ResolvedStandardMember | undefined`
  `resolveTraversalTimeStandardMember(params: ResolveTraversalTimeStandardMemberParams): ResolvedTraversalStandardMember | undefined`
  `resolveStandardTableColumn(params: ResolveStandardTableColumnParams): FormDataPathColumnSource | undefined`

- Consumes: existing `OwnerMetadata`, `OwnerMetadataCache`, `DataPathTypeInfo`, `FormDataPathColumnSource`, `DataPathTableInfo`.

- [ ] **Step 1: Write the failing registry test**

Add this test file:

```ts
import { describe, expect, it } from "vitest"
import {
  getStandardMembers,
  registerStandardMembers,
  resolveIndexTimeStandardMember,
} from "./standardMembers"

describe("standardMembers registry", () => {
  it("registers declarations by owner kind and resolves primitive members", () => {
    registerStandardMembers("ТестовыйОбъект", [
      {
        memberKind: "standardAttribute",
        names: { internal: "Flag", yaml: "Флаг" },
        family: "primitive",
        phase: "index-time",
        sourceScope: "self",
        kind: "boolean",
      },
    ])

    expect(getStandardMembers("ТестовыйОбъект")).toHaveLength(1)
    expect(
      resolveIndexTimeStandardMember({
        owner: { ref: { kind: "ТестовыйОбъект" }, model: {}, rule: { itemType: "Test", properties: {} } },
        internalName: "Flag",
        yamlName: "Флаг",
      })
    ).toMatchObject({
      name: "Флаг",
      typeInfo: { kinds: ["boolean"], nextTypes: [] },
    })
  })
})
```

- [ ] **Step 2: Run the focused failing test**

Run: `pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/standardMembers.test.ts`

Expected: FAIL with module not found for `./standardMembers`.

- [ ] **Step 3: Implement declaration types and primitive executor**

Create `packages/core/metadata/validation/dataPath/standardMembers.ts`:

```ts
import type { MetadataItemRule } from "../../orchestration/property/types"
import type { OwnerMetadata, OwnerMetadataCache } from "./ownerCache"
import type { DataPathTableInfo, DataPathTypeInfo, FormDataPathColumnSource, OwnerTypeRef } from "./types"

export type StandardMemberKind = "standardAttribute" | "standardTabularSection" | "standardTabularSectionColumn"
export type StandardMemberPhase = "index-time" | "traversal-time" | "deferred"
export type StandardMemberSourceScope = "self" | "ownerModel" | "rules" | "projectIndex"

export type PrimitiveKind = "boolean" | "string" | "dateTime" | "number"

export interface StandardMemberNames {
  internal: string
  yaml: string
}

interface BaseStandardMemberDeclaration {
  memberKind: StandardMemberKind
  names: StandardMemberNames
  phase: StandardMemberPhase
  sourceScope: StandardMemberSourceScope
}

export interface PrimitiveStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  family: "primitive"
  kind: PrimitiveKind
  terminal?: true
  allowNestedProperties?: false
}

export type StandardMemberDeclaration = PrimitiveStandardMemberDeclaration

export interface ResolveIndexTimeStandardMemberParams {
  owner: Pick<OwnerMetadata, "ref" | "model" | "rule">
  internalName: string
  yamlName: string
  explicitTypeInfo?: DataPathTypeInfo
}

export interface ResolvedStandardMember {
  name: string
  targetName: string
  typeInfo: DataPathTypeInfo
}

export interface ResolveTraversalTimeStandardMemberParams {
  owner: OwnerMetadata
  segment: string
  ownerCache: OwnerMetadataCache
}

export interface ResolvedTraversalStandardMember {
  name: string
  typeInfo: DataPathTypeInfo
  tableSource?: {
    table: DataPathTableInfo
    columns: Map<string, FormDataPathColumnSource>
    hasColumns: boolean
  }
}

export interface ResolveStandardTableColumnParams {
  owner: OwnerMetadata
  table: DataPathTableInfo
  segment: string
}

const membersByOwnerKind = new Map<string, StandardMemberDeclaration[]>()

export function registerStandardMembers(ownerKind: string, members: readonly StandardMemberDeclaration[]): void {
  const existing = membersByOwnerKind.get(ownerKind) ?? []
  membersByOwnerKind.set(ownerKind, [...existing, ...members])
}

export function getStandardMembers(ownerKind: string): readonly StandardMemberDeclaration[] {
  return membersByOwnerKind.get(ownerKind) ?? []
}

export function resolveIndexTimeStandardMember(
  params: ResolveIndexTimeStandardMemberParams
): ResolvedStandardMember | undefined {
  for (const member of getStandardMembers(params.owner.ref.kind)) {
    if (member.phase !== "index-time") continue
    if (!matchesStandardMember(member, params.internalName, params.yamlName)) continue
    if (params.explicitTypeInfo !== undefined) {
      return { name: member.names.yaml, targetName: member.names.internal, typeInfo: params.explicitTypeInfo }
    }
    if (member.family === "primitive") {
      return {
        name: member.names.yaml,
        targetName: member.names.internal,
        typeInfo: primitiveTypeInfo(member.kind, `${params.owner.ref.kind}.${member.names.internal}`),
      }
    }
  }
  return undefined
}

export function resolveTraversalTimeStandardMember(
  _params: ResolveTraversalTimeStandardMemberParams
): ResolvedTraversalStandardMember | undefined {
  return undefined
}

export function resolveStandardTableColumn(_params: ResolveStandardTableColumnParams): FormDataPathColumnSource | undefined {
  return undefined
}

function matchesStandardMember(member: StandardMemberDeclaration, internalName: string, yamlName: string): boolean {
  return member.names.internal === internalName || member.names.yaml === yamlName
}

function primitiveTypeInfo(kind: PrimitiveKind, sourceText: string): DataPathTypeInfo {
  const dataPathKind = kind === "string" || kind === "number" ? "scalar" : kind
  return { kinds: [dataPathKind], nextTypes: [], sourceText }
}
```

- [ ] **Step 4: Export neutral hooks from registry**

Add exports to `packages/core/metadata/validation/dataPath/registry.ts`:

```ts
export {
  getStandardMembers,
  registerStandardMembers,
  resolveIndexTimeStandardMember,
  resolveStandardTableColumn,
  resolveTraversalTimeStandardMember,
} from "./standardMembers"
export type {
  PrimitiveKind,
  StandardMemberDeclaration,
  StandardMemberKind,
  StandardMemberNames,
  StandardMemberPhase,
  StandardMemberSourceScope,
} from "./standardMembers"
```

- [ ] **Step 5: Run focused test**

Run: `pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/standardMembers.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/validation/dataPath/standardMembers.ts packages/core/metadata/validation/dataPath/standardMembers.test.ts packages/core/metadata/validation/dataPath/registry.ts
git commit -m "feat: :sparkles: добавить реестр standardMembers"
```

---

### Task 2: Use `standardMembers` for Index-Time Standard Attributes

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/objectFields.ts`
- Modify: `packages/core/metadata/appliedObjects/dataPathCommon/register.ts`
- Test: `packages/core/metadata/validation/dataPath/objectFields.test.ts`

**Interfaces:**
- Consumes: `resolveIndexTimeStandardMember(params)`.
- Produces: existing `ObjectFieldIndex.fields` entries still have `kind: "standardAttribute"`, `name` as YAML name, and `targetName` as internal name.

- [ ] **Step 1: Add a failing object field test for declarative primitives**

Append to `packages/core/metadata/validation/dataPath/objectFields.test.ts`:

```ts
it("resolves declarative primitive standard members", () => {
  const index = buildObjectFieldIndex(
    owner({
      ref: { kind: "ТестовыйОбъект", name: "Объект1" },
      rule: {
        itemType: "TestObject",
        properties: {
          standardAttributes: {
            type: "StandardAttributeDescriptions",
            yaml: "СтандартныеРеквизиты",
            standartAttributeNames: { Flag: "Флаг" },
          },
        },
      },
    })
  )

  expect(resolveObjectFieldSegment({ index, segment: "Flag" })?.typeInfo.kinds).toEqual(["boolean"])
  expect(resolveObjectFieldSegment({ index, segment: "Флаг" })?.typeInfo.kinds).toEqual(["boolean"])
})
```

In the same test file, register the test member near other setup imports:

```ts
import { registerStandardMembers } from "./standardMembers"

registerStandardMembers("ТестовыйОбъект", [
  {
    memberKind: "standardAttribute",
    names: { internal: "Flag", yaml: "Флаг" },
    family: "primitive",
    phase: "index-time",
    sourceScope: "self",
    kind: "boolean",
  },
])
```

- [ ] **Step 2: Run test to verify current path ignores declarations**

Run: `pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/objectFields.test.ts -t "declarative primitive standard members"`

Expected: FAIL because the index returns unknown type.

- [ ] **Step 3: Wire `objectFields.ts` to `standardMembers`**

Change imports in `objectFields.ts`:

```ts
import {
  getObjectFieldCollectionDescriptors,
  resolveIndexTimeStandardMember,
  resolveStandardAttributeType,
} from "./registry"
```

Change `standardAttributeTypeInfo`:

```ts
function standardAttributeTypeInfo(params: {
  owner: ObjectFieldIndexOwner
  internalName: string
  yamlName: string
  explicit: NamedTypedItem | undefined
}): DataPathTypeInfo {
  const explicitTypeInfo =
    params.explicit?.type === undefined ? undefined : typeDescriptionToDataPathTypeInfo(params.explicit.type)

  const declarative = resolveIndexTimeStandardMember({
    owner: params.owner as OwnerMetadata,
    internalName: params.internalName,
    yamlName: params.yamlName,
    ...(explicitTypeInfo !== undefined ? { explicitTypeInfo } : {}),
  })
  if (declarative !== undefined) return declarative.typeInfo

  return (
    resolveStandardAttributeType({
      owner: params.owner as OwnerMetadata,
      internalName: params.internalName,
      yamlName: params.yamlName,
      ...(explicitTypeInfo !== undefined ? { explicitTypeInfo } : {}),
    }) ?? unknownDataPathTypeInfo
  )
}
```

- [ ] **Step 4: Keep existing tests green**

Run: `pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/objectFields.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/validation/dataPath/objectFields.ts packages/core/metadata/validation/dataPath/objectFields.test.ts
git commit -m "feat: :sparkles: подключить standardMembers к индексу"
```

---

### Task 3: Implement Index-Time Families and Common Declarations

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/standardMembers.ts`
- Modify: `packages/core/metadata/appliedObjects/dataPathCommon/register.ts`
- Create: `packages/core/metadata/appliedObjects/metadataCatalog/standardMembers.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/register.ts`
- Test: `packages/core/metadata/validation/dataPath/resolver.test.ts`

**Interfaces:**
- Produces family support:
  `sameOwnerObject`, `objectRefsFromProperty`, `codeByProperty`, `numberByProperty`, `standardEnum`, `typeDescription`, `opaque`, `unsupported`.
- Consumes metadata links through existing `getOwnerKindByMetadataLinkPrefix`.

- [ ] **Step 1: Add failing resolver tests for declarative catalog Owner and unsupported member**

Append to `packages/core/metadata/validation/dataPath/resolver.test.ts`:

```ts
it("resolves Owner through declarative standardMembers", () => {
  const result = resolve("Объект.Owner.Валюта", {
    index: indexWithRootObject({ kind: "Справочник", name: "Контрагенты" }),
    ownerCache: ownerCache([
      testOwner({
        ref: { kind: "Справочник", name: "Контрагенты" },
        model: { owners: ["Справочник.Владельцы"] },
      }),
      testOwner({
        ref: { kind: "Справочник", name: "Владельцы" },
        model: {
          attributes: [{ name: "Валюта", type: { types: ["CatalogRef.Валюты"] } }],
        },
      }),
    ]),
  })

  expect(result.status).toBe("ok")
  if (result.status !== "ok") return
  expect(result.target?.source).toMatchObject({ kind: "objectField", name: "Валюта" })
})

it("reports unsupported standard members as unsupported intermediate types", () => {
  const result = resolve("Объект.ExtDimension1.Name", {
    index: indexWithRootObject({ kind: "РегистрБухгалтерии", name: "Хозрасчетный" }),
    ownerCache: ownerCache([
      testOwner({
        ref: { kind: "РегистрБухгалтерии", name: "Хозрасчетный" },
      }),
    ]),
  })

  expect(result).toMatchObject({
    status: "error",
    diagnostics: [
      {
        message: 'ПутьКДанным "Объект.ExtDimension1.Name": промежуточный реквизит "ExtDimension1" имеет неподдерживаемый тип',
      },
    ],
  })
})
```

- [ ] **Step 2: Run tests and confirm missing declarative behavior**

Run: `pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/resolver.test.ts -t "declarative standardMembers|unsupported standard members"`

Expected: FAIL because declarations/families are not implemented yet.

- [ ] **Step 3: Extend declaration union**

In `standardMembers.ts`, replace `StandardMemberDeclaration` with this union:

```ts
export type StandardMemberDeclaration =
  | PrimitiveStandardMemberDeclaration
  | SameOwnerObjectStandardMemberDeclaration
  | ObjectRefsFromPropertyStandardMemberDeclaration
  | MetadataPropertyScalarStandardMemberDeclaration
  | StandardEnumStandardMemberDeclaration
  | TypeDescriptionStandardMemberDeclaration
  | OpaqueStandardMemberDeclaration
  | UnsupportedStandardMemberDeclaration

export interface SameOwnerObjectStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  family: "sameOwnerObject"
}

export interface ObjectRefsFromPropertyStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  family: "objectRefsFromProperty"
  property: string
  compositePolicy: "errorOnTraversal"
}

export interface MetadataPropertyScalarStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  family: "codeByProperty" | "numberByProperty"
  property: string
}

export interface StandardEnumStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  family: "standardEnum"
  name: string
}

export interface TypeDescriptionStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  family: "typeDescription"
  allowNestedProperties: false
}

export interface OpaqueStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  family: "opaque"
  allowNestedProperties: false
}

export interface UnsupportedStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  family: "unsupported"
  reason: string
}
```

- [ ] **Step 4: Implement family executors**

Add these helpers to `standardMembers.ts`:

```ts
function indexTimeTypeInfo(
  member: StandardMemberDeclaration,
  owner: Pick<OwnerMetadata, "ref" | "model" | "rule">
): DataPathTypeInfo | undefined {
  switch (member.family) {
    case "primitive":
      return primitiveTypeInfo(member.kind, `${owner.ref.kind}.${member.names.internal}`)
    case "sameOwnerObject":
      return { kinds: ["object"], nextTypes: [sameOwnerRef(owner.ref)], sourceText: `${owner.ref.kind}.${member.names.internal}` }
    case "objectRefsFromProperty":
      return objectRefsFromProperty(owner, member.property)
    case "codeByProperty":
    case "numberByProperty":
      return scalarFromMetadataProperty(owner, member.property, `${owner.ref.kind}.${member.names.internal}`)
    case "standardEnum":
      return { kinds: ["scalar"], nextTypes: [], sourceText: member.name }
    case "typeDescription":
      return { kinds: ["typeDescription"], nextTypes: [], sourceText: `${owner.ref.kind}.${member.names.internal}` }
    case "opaque":
      return { kinds: ["unsupportedIntermediate"], nextTypes: [], sourceText: `${owner.ref.kind}.${member.names.internal}` }
    case "unsupported":
      return { kinds: ["unsupportedIntermediate"], nextTypes: [], sourceText: member.reason }
  }
}

function objectRefsFromProperty(owner: Pick<OwnerMetadata, "model">, property: string): DataPathTypeInfo | undefined {
  const links = metadataRecord(owner.model)[property]
  if (!Array.isArray(links)) return undefined
  const nextTypes = links.flatMap((link) => (typeof link === "string" ? [ownerTypeRefFromMetadataLink(link)] : []))
    .filter((item): item is OwnerTypeRef => item !== undefined)
  if (nextTypes.length === 0) return undefined
  return {
    kinds: ["object"],
    nextTypes: uniqueOwnerRefs(nextTypes),
    ...(nextTypes.length > 1 ? { isComposite: true } : {}),
    sourceText: links.filter((link): link is string => typeof link === "string").join(" | "),
  }
}

function scalarFromMetadataProperty(
  owner: Pick<OwnerMetadata, "model">,
  property: string,
  sourceText: string
): DataPathTypeInfo | undefined {
  return metadataRecord(owner.model)[property] === undefined
    ? undefined
    : { kinds: ["scalar"], nextTypes: [], sourceText }
}
```

Move `ownerTypeRefFromMetadataLink`, `splitMetadataLink`, `sameOwnerRef`, `metadataRecord`, and `uniqueOwnerRefs` into `standardMembers.ts`, using `getOwnerKindByMetadataLinkPrefix` from `registry.ts`.

Update `resolveIndexTimeStandardMember` to call `indexTimeTypeInfo`.

- [ ] **Step 5: Register common and catalog declarations**

In `metadataCatalog/standardMembers.ts`:

```ts
import { registerStandardMembers } from "../../validation/dataPath/registry"

const catalogMembers = [
  { memberKind: "standardAttribute", names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject", phase: "index-time", sourceScope: "self" },
  { memberKind: "standardAttribute", names: { internal: "Parent", yaml: "Родитель" }, family: "sameOwnerObject", phase: "index-time", sourceScope: "self" },
  { memberKind: "standardAttribute", names: { internal: "Owner", yaml: "Владелец" }, family: "objectRefsFromProperty", phase: "index-time", sourceScope: "ownerModel", property: "owners", compositePolicy: "errorOnTraversal" },
  { memberKind: "standardAttribute", names: { internal: "Code", yaml: "Код" }, family: "codeByProperty", phase: "index-time", sourceScope: "ownerModel", property: "codeType" },
  { memberKind: "standardAttribute", names: { internal: "Description", yaml: "Наименование" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "string" },
  { memberKind: "standardAttribute", names: { internal: "IsFolder", yaml: "ЭтоГруппа" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "DeletionMark", yaml: "ПометкаУдаления" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "Predefined", yaml: "Предопределенный" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "PredefinedDataName", yaml: "ИмяПредопределенныхДанных" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "string" },
] as const

registerStandardMembers("Справочник", catalogMembers)
registerStandardMembers("СправочникОбъект", catalogMembers)
```

Import it in `metadataCatalog/register.ts`:

```ts
import "./standardMembers"
```

Add `AccountingRegister.ExtDimension*` unsupported declarations in `metadataAccountingRegister/standardMembers.ts` and import from `metadataAccountingRegister/register.ts`.

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/standardMembers.test.ts packages/core/metadata/validation/dataPath/objectFields.test.ts packages/core/metadata/validation/dataPath/resolver.test.ts -t "Owner|unsupported standard members|standard attribute"
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/validation/dataPath packages/core/metadata/appliedObjects/metadataCatalog packages/core/metadata/appliedObjects/metadataAccountingRegister
git commit -m "feat: :sparkles: описать index-time standardMembers"
```

---

### Task 4: Move Existing Object-Specific Virtual Standard Members to Declarations

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataChartOfAccounts/standardMembers.ts`
- Create: `packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/standardMembers.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfAccounts/register.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/register.ts`
- Modify: `packages/core/metadata/validation/dataPath/standardMembers.ts`
- Test: `packages/core/metadata/validation/dataPath/resolver.test.ts`

**Interfaces:**
- Produces standard tabular sections as `tableSource`.
- Produces standard table columns through `resolveStandardTableColumn`.

- [ ] **Step 1: Add assertions that declarations still resolve current virtual tables**

Keep existing tests named:

- `resolves ChartOfAccounts ExtDimensionTypes as a virtual table`
- `resolves ChartOfAccounts ExtDimensionTypes virtual columns`
- `resolves ChartOfCalculationTypes virtual tables`

Add this assertion to the ExtDimensionTypes column test:

```ts
expect(
  resolve("Объект.ExtDimensionTypes.ПризнакУчетаСубконтоВсеСвойства", {
    index: indexWithRootObject({ kind: "ПланСчетов", name: "Хозрасчетный" }),
    ownerCache: chartOfAccountsOwners(),
  })
).toMatchObject({
  status: "ok",
  target: {
    typeInfo: { kinds: ["boolean"], nextTypes: [] },
  },
})
```

- [ ] **Step 2: Extend standard table declarations**

Add to `standardMembers.ts`:

```ts
export interface StandardTableDeclaration extends BaseStandardMemberDeclaration {
  memberKind: "standardTabularSection"
  family: "standardTable"
  tableKind: "ValueTable"
  columns: readonly StandardTableColumnDeclaration[]
}

export type StandardTableColumnDeclaration =
  | PrimitiveStandardTableColumnDeclaration
  | SameOwnerObjectStandardTableColumnDeclaration
  | ObjectRefFromOwnerPropertyStandardTableColumnDeclaration

export interface PrimitiveStandardTableColumnDeclaration {
  memberKind: "standardTabularSectionColumn"
  names: StandardMemberNames
  family: "primitive"
  kind: PrimitiveKind
  discoveredFrom?: string
}

export interface SameOwnerObjectStandardTableColumnDeclaration {
  memberKind: "standardTabularSectionColumn"
  names: StandardMemberNames
  family: "sameOwnerObject"
}

export interface ObjectRefFromOwnerPropertyStandardTableColumnDeclaration {
  memberKind: "standardTabularSectionColumn"
  names: StandardMemberNames
  family: "objectRefFromOwnerProperty"
  property: string
}
```

Include `StandardTableDeclaration` in `StandardMemberDeclaration`.

- [ ] **Step 3: Implement table and column executors**

In `resolveTraversalTimeStandardMember`, return a table source for `standardTable` declarations:

```ts
if (member.memberKind === "standardTabularSection" && member.phase === "traversal-time" && matchesSegment(member, params.segment)) {
  const table = { kind: member.tableKind } satisfies DataPathTableInfo
  return {
    name: member.names.yaml,
    typeInfo: { kinds: ["tableSource"], nextTypes: [], table, sourceText: `${params.owner.ref.kind}.${member.names.internal}` },
    tableSource: {
      table,
      columns: columnsFromStandardTable({ owner: params.owner, table: member }),
      hasColumns: true,
    },
  }
}
```

Implement `columnsFromStandardTable` so primitive columns return boolean/scalar/date types, `sameOwnerObject` returns `{ kinds: ["object"], nextTypes: [owner.ref] }`, and `objectRefFromOwnerProperty` converts `ChartOfCharacteristicTypes.<name>` to `{ kind: "ПланВидовХарактеристик", name }`.

- [ ] **Step 4: Use traversal declarations in resolver**

In `resolver.ts`, before `resolveVirtualOwnerField`, call:

```ts
const standardMember = resolveTraversalTimeStandardMember({
  owner: ownerResult.owner,
  segment: lookupSegment,
  ownerCache: params.ownerCache,
})
if (standardMember !== undefined) {
  state = {
    typeInfo: standardMember.typeInfo,
    source: { kind: "objectField", owner: ownerResult.owner.ref, name: standardMember.name },
    ...(standardMember.tableSource !== undefined ? { tableSource: standardMember.tableSource } : {}),
  }
  if (isLast) return okTarget({ value, segments, state })
  continue
}
```

- [ ] **Step 5: Declare ChartOfAccounts and ChartOfCalculationTypes standard tables**

Create `metadataChartOfAccounts/standardMembers.ts` with `ExtDimensionTypes` and columns:

```ts
import { registerStandardMembers } from "../../validation/dataPath/registry"

registerStandardMembers("ПланСчетов", [
  {
    memberKind: "standardTabularSection",
    names: { internal: "ExtDimensionTypes", yaml: "ВидыСубконто" },
    family: "standardTable",
    phase: "traversal-time",
    sourceScope: "ownerModel",
    tableKind: "ValueTable",
    columns: [
      { memberKind: "standardTabularSectionColumn", names: { internal: "ExtDimensionType", yaml: "ВидСубконто" }, family: "objectRefFromOwnerProperty", property: "extDimensionTypes" },
      { memberKind: "standardTabularSectionColumn", names: { internal: "TurnoversOnly", yaml: "ТолькоОбороты" }, family: "primitive", kind: "boolean" },
      { memberKind: "standardTabularSectionColumn", names: { internal: "ТолькоСальдо", yaml: "ТолькоСальдо" }, family: "primitive", kind: "boolean" },
      { memberKind: "standardTabularSectionColumn", names: { internal: "LineNumber", yaml: "НомерСтроки" }, family: "primitive", kind: "number" },
      { memberKind: "standardTabularSectionColumn", names: { internal: "Predefined", yaml: "Предопределенный" }, family: "primitive", kind: "boolean" },
      { memberKind: "standardTabularSectionColumn", names: { internal: "*", yaml: "*" }, family: "primitive", kind: "boolean", discoveredFrom: "extDimensionAccountingFlags" },
    ],
  },
])
```

Create `metadataChartOfCalculationTypes/standardMembers.ts` with three standard tables and columns `CalculationType`, `LineNumber`, `Predefined`.

Import both files from their `register.ts`.

- [ ] **Step 6: Remove duplicate virtual table code**

After tests pass with declarations, delete table-specific branches from `metadataChartOfAccounts/register.ts` and `metadataChartOfCalculationTypes/register.ts`, leaving only owner kind registrations and any non-standard-member behavior still needed.

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/resolver.test.ts -t "ChartOfAccounts ExtDimensionTypes|ChartOfCalculationTypes"
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/validation/dataPath packages/core/metadata/appliedObjects/metadataChartOfAccounts packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes
git commit -m "feat: :sparkles: описать стандартные табличные части"
```

---

### Task 5: Implement Traversal-Time Reverse Lookup Members

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/standardMembers.ts`
- Modify: `packages/core/metadata/validation/dataPath/resolver.ts`
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.ts`
- Modify: `packages/core/metadata/validation/projectValidationObjectTable.ts`
- Create: `packages/core/metadata/appliedObjects/metadataTask/standardMembers.ts`
- Create: `packages/core/metadata/appliedObjects/metadataInformationRegister/standardMembers.ts`
- Create: `packages/core/metadata/appliedObjects/metadataAccumulationRegister/standardMembers.ts`
- Create: `packages/core/metadata/appliedObjects/metadataAccountingRegister/standardMembers.ts`
- Create: `packages/core/metadata/appliedObjects/metadataCalculationRegister/standardMembers.ts`
- Modify corresponding `register.ts` files
- Test: `packages/core/metadata/validation/dataPath/resolver.test.ts`

**Interfaces:**
- Produces `reverseLookup` and `closedReverseLookup`.
- Empty reverse lookup returns an error diagnostic, not fallback.

- [ ] **Step 1: Add failing tests for `Recorder` and empty reverse lookup**

Append to `resolver.test.ts`:

```ts
it("resolves register Recorder through document registerRecords", () => {
  const result = resolve("Объект.Recorder.Date", {
    index: indexWithRootObject({ kind: "РегистрСведений", name: "Цены" }),
    ownerCache: ownerCache([
      testOwner({ ref: { kind: "РегистрСведений", name: "Цены" } }),
      testOwner({
        ref: { kind: "Документ", name: "УстановкаЦен" },
        model: { registerRecords: ["InformationRegister.Цены"] },
      }),
    ]),
  })

  expect(result.status).toBe("ok")
  if (result.status !== "ok") return
  expect(result.target?.source).toMatchObject({ kind: "objectField", name: "Дата" })
})

it("reports missing Recorder candidates as metadata link errors", () => {
  const result = resolve("Объект.Recorder", {
    index: indexWithRootObject({ kind: "РегистрСведений", name: "Цены" }),
    ownerCache: ownerCache([testOwner({ ref: { kind: "РегистрСведений", name: "Цены" } })]),
  })

  expect(result).toMatchObject({
    status: "error",
    diagnostics: [{ message: 'ПутьКДанным "Объект.Recorder": для стандартного реквизита "Recorder" не найдены связанные объекты' }],
  })
})
```

- [ ] **Step 2: Add owner listing support for reverse lookups**

In `packages/core/metadata/validation/dataPath/ownerCache.ts`, change the interface:

```ts
export interface OwnerMetadataCache {
  get(ref: OwnerTypeRef): OwnerMetadataResult
  listRefs(kind: OwnerTypeRef["kind"]): readonly OwnerTypeRef[]
}
```

Add `readdirSync` to the first import:

```ts
import { readdirSync } from "fs"
```

In `createOwnerMetadataCache`, add this method next to `get`:

```ts
listRefs(kind) {
  const ownerKind = getDataPathOwnerKind(kind)
  if (ownerKind === undefined) return []
  const dir = join(rootDir, ownerKind.projectDir)
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({ kind, name: entry.name }))
  } catch {
    return []
  }
}
```

In `packages/core/metadata/validation/projectValidationObjectTable.ts`, extend `ValidationObjectTable`:

```ts
listOwners(kind: OwnerTypeRef["kind"]): readonly OwnerTypeRef[]
```

Add the implementation inside `createValidationObjectTable`:

```ts
listOwners(kind) {
  return [...recordsByOwner.values()]
    .map((record) => record.ownerRef)
    .filter((ref): ref is OwnerTypeRef => ref !== undefined && ref.kind === kind)
}
```

In `createOwnerMetadataCacheFromValidationTable`, add:

```ts
listRefs(kind) {
  const ownerKind = getDataPathOwnerKind(kind)
  const tableKind = ownerKind?.projectDir ?? kind
  return params.table.listOwners(tableKind).map((ref) => ({
    kind,
    ...(ref.name !== undefined ? { name: ref.name } : {}),
  }))
}
```

Update the `ownerCache(owners)` helper in `resolver.test.ts`:

```ts
listRefs(kind) {
  return owners.map((owner) => owner.ref).filter((ref) => ref.kind === kind)
}
```

- [ ] **Step 3: Extend traversal resolver result to support errors**

In `registry.ts`, extend `TraversalTransitionResolver`-like handling only for standard members by adding:

```ts
export interface StandardMemberError {
  kind: "error"
  message: string
}
```

Change `resolveTraversalTimeStandardMember` return type to `ResolvedTraversalStandardMember | StandardMemberError | undefined`.

In `resolver.ts`, after calling `resolveTraversalTimeStandardMember`, handle:

```ts
if (standardMember?.kind === "error") {
  return error(params, `ПутьКДанным "${value}": ${standardMember.message}`)
}
```

- [ ] **Step 4: Implement reverse lookup declarations**

Add declaration interfaces:

```ts
export interface ReverseLookupStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  family: "reverseLookup"
  phase: "traversal-time"
  sourceScope: "projectIndex"
  target: string
  property: string
  emptyPolicy: "error"
  compositePolicy: "errorOnTraversal"
}

export interface ClosedReverseLookupStandardMemberDeclaration extends BaseStandardMemberDeclaration {
  family: "closedReverseLookup"
  phase: "traversal-time"
  sourceScope: "projectIndex"
  result: string
  source: string
  emptyPolicy: "error"
  allowNestedProperties: false
}
```

Implement `reverseLookupCandidates` with `ownerCache.listRefs(member.target)`:

```ts
function reverseLookupCandidates(params: {
  owner: OwnerMetadata
  ownerCache: OwnerMetadataCache
  target: string
  property: string
}): OwnerTypeRef[] {
  const currentLink = metadataLinkForOwnerRef(params.owner.ref)
  if (currentLink === undefined) return []

  const result: OwnerTypeRef[] = []
  for (const ref of params.ownerCache.listRefs(params.target)) {
    const ownerResult = params.ownerCache.get(ref)
    if (ownerResult.status !== "ok") continue

    const links = metadataRecord(ownerResult.owner.model)[params.property]
    if (!Array.isArray(links)) continue
    if (links.some((link) => link === currentLink)) result.push(ref)
  }
  return result
}
```

Add this helper in `standardMembers.ts`:

```ts
function metadataLinkForOwnerRef(ref: OwnerTypeRef): string | undefined {
  const prefix = getMetadataLinkPrefixesByOwnerKind(ref.kind)[0]
  if (prefix === undefined || ref.name === undefined) return undefined
  return `${prefix}.${ref.name}`
}
```

When `reverseLookupCandidates` returns an empty array for a matched `reverseLookup` or `closedReverseLookup` member, return:

```ts
{
  kind: "error",
  message: `для стандартного реквизита "${member.names.internal}" не найдены связанные объекты`,
}
```

- [ ] **Step 5: Register task and register declarations**

In `metadataTask/standardMembers.ts`:

```ts
import { registerStandardMembers } from "../../validation/dataPath/registry"

const taskMembers = [
  {
    memberKind: "standardAttribute",
    names: { internal: "BusinessProcess", yaml: "БизнесПроцесс" },
    family: "reverseLookup",
    phase: "traversal-time",
    sourceScope: "projectIndex",
    target: "BusinessProcess",
    property: "tasks",
    emptyPolicy: "error",
    compositePolicy: "errorOnTraversal",
  },
  {
    memberKind: "standardAttribute",
    names: { internal: "RoutePoint", yaml: "ТочкаМаршрута" },
    family: "closedReverseLookup",
    phase: "traversal-time",
    sourceScope: "projectIndex",
    result: "BusinessProcessRoutePoint",
    source: "businessProcessesByTask",
    emptyPolicy: "error",
    allowNestedProperties: false,
  },
] as const

registerStandardMembers("Задача", taskMembers)
registerStandardMembers("ЗадачаОбъект", taskMembers)
```

For register objects, register `Recorder` with `target: "Document"`, `property: "registerRecords"`.

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/resolver.test.ts -t "Recorder|BusinessProcess|RoutePoint"
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/validation/dataPath packages/core/metadata/appliedObjects/metadataTask packages/core/metadata/appliedObjects/metadataInformationRegister packages/core/metadata/appliedObjects/metadataAccumulationRegister packages/core/metadata/appliedObjects/metadataAccountingRegister packages/core/metadata/appliedObjects/metadataCalculationRegister
git commit -m "feat: :sparkles: добавить обратные standardMembers"
```

---

### Task 6: Complete Object Declarations and Remove Duplicated Imperative Resolvers

**Files:**
- Create remaining `standardMembers.ts` files listed in File Structure.
- Modify corresponding `register.ts` files.
- Modify `packages/core/metadata/appliedObjects/dataPathCommon/register.ts`
- Test: `packages/core/metadata/validation/dataPath/resolver.test.ts`
- Test: `packages/core/metadata/validation/validateForm.test.ts`

**Interfaces:**
- Produces complete coverage for all rows in the spec.
- Existing `registerStandardAttributeTypeResolver` remains only as fallback for explicit `Тип` and truly generic table columns.

- [ ] **Step 1: Add coverage test for all known spec members**

Create `packages/core/metadata/validation/dataPath/standardMembers.coverage.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { getStandardMembers } from "./standardMembers"

describe("standardMembers declarations coverage", () => {
  it.each([
    ["Справочник", ["Ref", "Owner", "Code", "Description", "Parent", "IsFolder", "DeletionMark", "Predefined", "PredefinedDataName"]],
    ["Документ", ["Ref", "Date", "Number", "Posted", "DeletionMark"]],
    ["Перечисление", ["Ref", "Order"]],
    ["ПланСчетов", ["Ref", "Code", "Description", "Parent", "Type", "OffBalance", "Order", "DeletionMark", "Predefined", "PredefinedDataName", "ExtDimensionTypes"]],
    ["ПланВидовХарактеристик", ["Ref", "ValueType", "Code", "Description", "Parent", "IsFolder", "DeletionMark", "Predefined", "PredefinedDataName"]],
    ["ПланВидовРасчета", ["Ref", "Code", "Description", "ActionPeriodIsBasic", "DeletionMark", "Predefined", "PredefinedDataName", "LeadingCalculationTypes", "DisplacingCalculationTypes", "BaseCalculationTypes"]],
    ["ПланОбмена", ["Ref", "Code", "Description", "ThisNode", "ExchangeDate", "SentNo", "ReceivedNo", "DeletionMark"]],
    ["ЖурналДокументов", ["Ref", "Type", "Date", "Number", "Posted", "DeletionMark"]],
    ["БизнесПроцесс", ["Ref", "Date", "Number", "Started", "Completed", "HeadTask", "DeletionMark"]],
    ["Задача", ["Ref", "Date", "Number", "Executed", "BusinessProcess", "RoutePoint", "Description", "DeletionMark"]],
    ["РегистрСведений", ["Active", "LineNumber", "Recorder", "Period"]],
    ["РегистрНакопления", ["RecordType", "Active", "LineNumber", "Recorder", "Period"]],
    ["РегистрБухгалтерии", ["PeriodAdjustment", "Account", "Active", "LineNumber", "Recorder", "Period", "ExtDimension1", "ExtDimensionType1"]],
    ["РегистрРасчета", ["RegistrationPeriod", "ReversingEntry", "Active", "BegOfActionPeriod", "EndOfActionPeriod", "ActionPeriod", "BegOfBasePeriod", "EndOfBasePeriod", "CalculationType", "LineNumber", "Recorder"]],
  ])("%s has declared standard members", (ownerKind, expectedNames) => {
    const actualNames = getStandardMembers(ownerKind).map((member) => member.names.internal)
    for (const name of expectedNames) expect(actualNames).toContain(name)
  })
})
```

- [ ] **Step 2: Run coverage test and see missing declarations**

Run: `pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/standardMembers.coverage.test.ts`

Expected: FAIL listing missing declarations.

- [ ] **Step 3: Add remaining object declaration files**

For each object, create `standardMembers.ts` with declarations matching the spec. Example for document:

```ts
import { registerStandardMembers } from "../../validation/dataPath/registry"

const documentMembers = [
  { memberKind: "standardAttribute", names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject", phase: "index-time", sourceScope: "self" },
  { memberKind: "standardAttribute", names: { internal: "Date", yaml: "Дата" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "dateTime" },
  { memberKind: "standardAttribute", names: { internal: "Number", yaml: "Номер" }, family: "numberByProperty", phase: "index-time", sourceScope: "ownerModel", property: "numberType" },
  { memberKind: "standardAttribute", names: { internal: "Posted", yaml: "Проведен" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "DeletionMark", yaml: "ПометкаУдаления" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
] as const

registerStandardMembers("Документ", documentMembers)
registerStandardMembers("ДокументОбъект", documentMembers)
```

Import each file from the matching `register.ts`.

- [ ] **Step 4: Replace object-specific imperative code when covered by declarations**

Remove branches from old `registerStandardAttributeTypeResolver` and `registerVirtualOwnerFieldResolver` that are now represented by declarations. Keep:

- `registerObjectFieldCollectionProvider`
- generic table column resolvers for `RowsCount`, `Total*`, `ValueList`, `GanttChart`
- `RegisterRecordSet` table column resolver until standard member coverage fully replaces it in a later pass

- [ ] **Step 5: Run focused validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/resolver.test.ts packages/core/metadata/validation/validateForm.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/appliedObjects packages/core/metadata/validation/dataPath packages/core/metadata/validation/validateForm.test.ts
git commit -m "feat: :sparkles: перенести стандартные члены в декларации"
```

---

### Task 7: Add YAML/DataPath Alias Translation Through `standardMembers`

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/roots.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/format.ts`
- Modify or create: `packages/core/metadata/operations/dataPathReferences.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`

**Interfaces:**
- Consumes `standardMembers` declarations for alias mapping.
- Produces internal-to-YAML translation for standard attributes and standard tabular sections used in `DataPath`.

- [ ] **Step 1: Add failing parse/format tests**

In `metadataTargets/parse.test.ts`, add:

```ts
it("parses and formats standard member YAML aliases from declarations", () => {
  expect(parseMetadataTarget("Catalog.Номенклатура.StandardAttribute.Владелец", { source: "yaml" })).toMatchObject({
    canonical: "Catalog.Номенклатура.StandardAttribute.Owner",
  })

  expect(formatMetadataTarget("Catalog.Номенклатура.StandardAttribute.Owner", { target: "yaml" })).toBe(
    "Catalog.Номенклатура.StandardAttribute.Владелец"
  )
})
```

- [ ] **Step 2: Run failing test**

Run: `pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/metadataTargets/parse.test.ts -t "standard member YAML aliases"`

Expected: FAIL because current maps are static.

- [ ] **Step 3: Add neutral alias lookup helpers**

In `standardMembers.ts`, export:

```ts
export function standardMemberInternalToYaml(internalName: string): string | undefined {
  for (const members of allStandardMemberGroups()) {
    const member = members.find((item) => item.names.internal === internalName)
    if (member !== undefined) return member.names.yaml
  }
  return undefined
}

export function standardMemberYamlToInternal(yamlName: string): string | undefined {
  for (const members of allStandardMemberGroups()) {
    const member = members.find((item) => item.names.yaml === yamlName)
    if (member !== undefined) return member.names.internal
  }
  return undefined
}

function allStandardMemberGroups(): StandardMemberDeclaration[][] {
  return [...membersByOwnerKind.values()]
}
```

- [ ] **Step 4: Use alias helpers in metadata target parse/format**

Replace static standard attribute map calls in `metadataTargets/parse.ts` and `format.ts` with fallback to `standardMemberYamlToInternal` / `standardMemberInternalToYaml`.

Keep the existing static maps as fallback until all imports are proven initialized in tests.

- [ ] **Step 5: Run parse/format tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/metadataTargets/parse.test.ts packages/core/metadata/operations/dataPathReferences.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataTargets packages/core/metadata/operations packages/core/metadata/validation/dataPath
git commit -m "feat: :sparkles: переводить DataPath через standardMembers"
```

---

### Task 8: Boundary Tests, Cleanup, and Full Verification

**Files:**
- Modify: `packages/core/metadata/importBoundaries.test.ts`
- Modify: `docs/superpowers/specs/2026-07-07-standard-attributes-datapath-table-design.md` only if implementation reveals a spec correction.
- Test: project-wide.

**Interfaces:**
- Produces enforced boundary: validation core stays generic; applied object declarations stay colocated.

- [ ] **Step 1: Add import boundary tests**

In `importBoundaries.test.ts`, add assertions:

```ts
it("standardMembers core не содержит concrete owner kinds", () => {
  const files = [
    "metadata/validation/dataPath/standardMembers.ts",
    "metadata/validation/dataPath/objectFields.ts",
    "metadata/validation/dataPath/resolver.ts",
  ]
  for (const file of files) {
    const source = readFileSync(join(process.cwd(), file), "utf-8")
    expect(source).not.toMatch(/Справочник|Документ|ПланСчетов|Регистр/)
  }
})

it("standardMembers declarations live with applied objects", () => {
  expect(existsSync(join(METADATA_DIR, "appliedObjects", "metadataCatalog", "standardMembers.ts"))).toBe(true)
  expect(existsSync(join(METADATA_DIR, "appliedObjects", "metadataTask", "standardMembers.ts"))).toBe(true)
})
```

- [ ] **Step 2: Run boundary tests**

Run: `pnpm --filter @nakidka/core exec vitest run packages/core/metadata/importBoundaries.test.ts`

Expected: PASS.

- [ ] **Step 3: Run complete core validation/dataPath tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath packages/core/metadata/validation/validateForm.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run full project tests**

Run: `pnpm test`

Expected: PASS.

- [ ] **Step 5: Commit final cleanup**

```bash
git add packages/core/metadata docs/superpowers/specs/2026-07-07-standard-attributes-datapath-table-design.md
git commit -m "test: :white_check_mark: закрепить границы standardMembers"
```

---

## Self-Review

- Spec coverage: covered standard attributes, standard tabular sections, standard tabular section columns, `standardMembers` location, unsupported `ExtDimension*`, reverse lookup empty errors, and YAML/DataPath aliasing.
- Placeholder scan: no forbidden placeholder markers; every task has exact files, commands, and expected results.
- Type consistency: central names are `StandardMemberDeclaration`, `registerStandardMembers`, `resolveIndexTimeStandardMember`, `resolveTraversalTimeStandardMember`, and `resolveStandardTableColumn`; all later tasks use these names.
