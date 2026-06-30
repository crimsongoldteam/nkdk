# DataPath Resolver And Form Validation Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Оставить в `validation/dataPath` нейтральный обход и диагностики, а платформенные owner kinds, TypeDescription mappings, поля объектов, стандартные реквизиты, виртуальные поля, table columns и form validators вынести в регистрации.

**Architecture:** Вводится `DataPathResolverRegistry` с малыми независимыми capabilities. `resolveDataPath(...)` остаётся проходчиком по сегментам, `ownerCache` загружает владельцев через registered owner kinds, `typeDescription.ts` спрашивает registry про base types, а `validateForm` становится запускателем зарегистрированного validator-а формы.

**Tech Stack:** TypeScript 5.9, Vitest, pnpm, existing `ProjectYamlCache`, `OwnerMetadataCache`, YAML diagnostics, TypeDescription rules.

---

## Scope Check

Этот план покрывает пункты 5 и 7 спеки. Он зависит от project specs/resolvers из планов 2 и 4. Он не удаляет центральные `PropertyTypeRegistry`/`MetadataItemTypeRegistry`; это отдельный финальный план.

## File Structure

- Create: `packages/core/metadata/validation/dataPath/registry.ts`
  - Owner kind, TypeDescription, object field, standard attribute, virtual owner field, table column and traversal transition registries.
- Modify: `packages/core/metadata/validation/dataPath/types.ts`
  - Replace central concrete `KnownOwnerTypeKind` union with string owner kind.
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.ts`
  - Load owner metadata through registered owner kinds.
- Modify: `packages/core/metadata/validation/dataPath/typeDescription.ts`
  - Resolve base types through registry.
- Modify: `packages/core/metadata/validation/dataPath/objectFields.ts`
  - Build object fields through registered collection providers and standard attribute resolvers.
- Modify: `packages/core/metadata/validation/dataPath/resolver.ts`
  - Resolve virtual fields, table columns and special transitions through registry.
- Modify: `packages/core/metadata/validation/dataPath/formIndex.ts`
  - Move platform form sources to registry.
- Modify: `packages/core/metadata/validation/validateForm.ts`
  - Delegate form validation to a registered validator.
- Create: `packages/core/metadata/validation/formValidationRegistry.ts`
  - Registry for form validators and form warning providers.
- Modify/create: `register.ts` files for relevant applied/common/form objects.
- Test: `packages/core/metadata/validation/dataPath/registry.test.ts`
- Test: `packages/core/metadata/validation/dataPath/ownerCache.test.ts`
- Test: `packages/core/metadata/validation/dataPath/typeDescription.test.ts`
- Test: `packages/core/metadata/validation/dataPath/objectFields.test.ts`
- Test: `packages/core/metadata/validation/validateForm.test.ts`
- Test: `packages/core/metadata/importBoundaries.test.ts`

## Task 0: Preflight

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `docs/superpowers/specs/2026-06-28-metadata-layer-boundary-violations-spec.md`
- Read: `packages/core/metadata/validation/dataPath/resolver.ts`
- Read: `packages/core/metadata/validation/validateForm.ts`

- [ ] **Step 1: Check metadata knowledge**

Run:

```bash
test -f .agents/knowledge/metadata/INDEX.md && sed -n '1,260p' .agents/knowledge/metadata/INDEX.md || echo "metadata knowledge index is missing"
```

Expected: the file is read, or the command prints `metadata knowledge index is missing`.

- [ ] **Step 2: Read dataPath/form validation sections**

Run:

```bash
sed -n '340,560p' docs/superpowers/specs/2026-06-28-metadata-layer-boundary-violations-spec.md
```

Expected: output includes `validation/dataPath` and `Form validation`.

## Task 1: Add DataPath Resolver Registry

**Files:**
- Create: `packages/core/metadata/validation/dataPath/registry.ts`
- Modify: `packages/core/metadata/validation/dataPath/types.ts`
- Test: `packages/core/metadata/validation/dataPath/registry.test.ts`

- [ ] **Step 1: Write registry tests**

Create `packages/core/metadata/validation/dataPath/registry.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import {
  clearDataPathResolverRegistryForTests,
  getDataPathOwnerKind,
  getOwnerKindByTypeDescriptionBase,
  getOwnerKindByMetadataLinkPrefix,
  registerDataPathOwnerKind,
} from "./registry"

const SampleRule = {
  itemType: "MetadataCatalog",
  itemTypePrefix: "Справочник",
  properties: {},
} as const satisfies MetadataItemRule

describe("DataPathResolverRegistry", () => {
  beforeEach(() => clearDataPathResolverRegistryForTests())

  it("registers owner kind by visible kind, TypeDescription base and metadata link prefix", () => {
    registerDataPathOwnerKind({
      kind: "Справочник",
      projectDir: "Справочник",
      rule: SampleRule,
      typeDescriptionBases: ["CatalogRef", "CatalogObject"],
      metadataLinkPrefixes: ["Catalog"],
    })

    expect(getDataPathOwnerKind("Справочник")).toMatchObject({ projectDir: "Справочник", rule: SampleRule })
    expect(getOwnerKindByTypeDescriptionBase("CatalogRef")).toBe("Справочник")
    expect(getOwnerKindByTypeDescriptionBase("CatalogObject")).toBe("Справочник")
    expect(getOwnerKindByMetadataLinkPrefix("Catalog")).toBe("Справочник")
  })
})
```

- [ ] **Step 2: Run and confirm failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/registry.test.ts --no-isolate
```

Expected: FAIL because `registry.ts` does not exist.

- [ ] **Step 3: Replace concrete owner union**

In `packages/core/metadata/validation/dataPath/types.ts`, replace the `KnownOwnerTypeKind` union and `OwnerTypeRef` with:

```ts
export type OwnerTypeKind = string & {}

export interface OwnerTypeRef {
  kind: OwnerTypeKind
  name?: string
}
```

- [ ] **Step 4: Implement registry base**

Create `packages/core/metadata/validation/dataPath/registry.ts`:

```ts
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { Diagnostic } from "../types"
import type { OwnerMetadata } from "./ownerCache"
import type {
  DataPathTableInfo,
  DataPathTypeInfo,
  FormDataPathColumnSource,
  FormDataPathIndex,
  OwnerTypeRef,
} from "./types"

export interface DataPathOwnerKindRegistration {
  kind: OwnerTypeRef["kind"]
  projectDir: string
  rule: MetadataItemRule
  typeDescriptionBases?: readonly string[]
  registerRecordSetBases?: readonly string[]
  metadataLinkPrefixes?: readonly string[]
  aliases?: readonly OwnerTypeRef["kind"][]
}

export type DataPathTypeResolver = (params: { baseType: string; name?: string }) => DataPathTypeInfo | undefined
export type ObjectFieldCollectionProvider = (params: { owner: OwnerMetadata }) => readonly ObjectFieldCollectionDescriptor[]
export interface ObjectFieldCollectionDescriptor {
  collection: string
  kind: "attribute" | "standardAttribute" | "tabularSection" | "dimension" | "resource" | "addressingAttribute"
}

export type StandardAttributeTypeResolver = (params: {
  owner: OwnerMetadata
  internalName: string
  yamlName: string
  explicitTypeInfo?: DataPathTypeInfo
}) => DataPathTypeInfo | undefined

export type VirtualOwnerFieldResolver = (params: {
  owner: OwnerMetadata
  segment: string
}) => { name: string; typeInfo: DataPathTypeInfo; tableSource?: { table: DataPathTableInfo; columns: Map<string, FormDataPathColumnSource>; hasColumns: boolean } } | undefined

export type TableColumnResolver = (params: {
  table: DataPathTableInfo
  segment: string
  index: FormDataPathIndex
}) => FormDataPathColumnSource | undefined

export type TraversalTransitionResolver = (params: {
  owner: OwnerMetadata
  segment: string
}) => { typeInfo: DataPathTypeInfo; sourceName: string; tableSource?: { table: DataPathTableInfo; columns: Map<string, FormDataPathColumnSource>; hasColumns: boolean } } | undefined

const ownerKinds = new Map<string, DataPathOwnerKindRegistration>()
const ownerKindByTypeBase = new Map<string, string>()
const ownerKindByRegisterRecordSetBase = new Map<string, string>()
const ownerKindByMetadataLinkPrefix = new Map<string, string>()
const typeResolvers: DataPathTypeResolver[] = []
const objectFieldCollectionProviders: ObjectFieldCollectionProvider[] = []
const standardAttributeTypeResolvers: StandardAttributeTypeResolver[] = []
const virtualOwnerFieldResolvers: VirtualOwnerFieldResolver[] = []
const tableColumnResolvers: TableColumnResolver[] = []
const traversalTransitionResolvers: TraversalTransitionResolver[] = []

export function registerDataPathOwnerKind(registration: DataPathOwnerKindRegistration): void {
  ownerKinds.set(registration.kind, registration)
  for (const alias of registration.aliases ?? []) ownerKinds.set(alias, registration)
  for (const base of registration.typeDescriptionBases ?? []) ownerKindByTypeBase.set(base, registration.kind)
  for (const base of registration.registerRecordSetBases ?? []) ownerKindByRegisterRecordSetBase.set(base, registration.kind)
  for (const prefix of registration.metadataLinkPrefixes ?? []) ownerKindByMetadataLinkPrefix.set(prefix, registration.kind)
}

export function getDataPathOwnerKind(kind: string): DataPathOwnerKindRegistration | undefined {
  return ownerKinds.get(kind)
}

export function getOwnerKindByTypeDescriptionBase(baseType: string): string | undefined {
  return ownerKindByTypeBase.get(baseType)
}

export function getOwnerKindByRegisterRecordSetBase(baseType: string): string | undefined {
  return ownerKindByRegisterRecordSetBase.get(baseType)
}

export function getOwnerKindByMetadataLinkPrefix(prefix: string): string | undefined {
  return ownerKindByMetadataLinkPrefix.get(prefix)
}

export function registerDataPathTypeResolver(resolver: DataPathTypeResolver): void {
  typeResolvers.push(resolver)
}

export function resolveRegisteredDataPathType(params: { baseType: string; name?: string }): DataPathTypeInfo | undefined {
  for (const resolver of typeResolvers) {
    const result = resolver(params)
    if (result !== undefined) return result
  }
  return undefined
}

export function registerObjectFieldCollectionProvider(provider: ObjectFieldCollectionProvider): void {
  objectFieldCollectionProviders.push(provider)
}

export function getObjectFieldCollectionDescriptors(owner: OwnerMetadata): readonly ObjectFieldCollectionDescriptor[] {
  return objectFieldCollectionProviders.flatMap((provider) => [...provider({ owner })])
}

export function registerStandardAttributeTypeResolver(resolver: StandardAttributeTypeResolver): void {
  standardAttributeTypeResolvers.push(resolver)
}

export function resolveStandardAttributeType(params: Parameters<StandardAttributeTypeResolver>[0]): DataPathTypeInfo | undefined {
  for (const resolver of standardAttributeTypeResolvers) {
    const result = resolver(params)
    if (result !== undefined) return result
  }
  return undefined
}

export function registerVirtualOwnerFieldResolver(resolver: VirtualOwnerFieldResolver): void {
  virtualOwnerFieldResolvers.push(resolver)
}

export function resolveVirtualOwnerField(params: Parameters<VirtualOwnerFieldResolver>[0]): ReturnType<VirtualOwnerFieldResolver> {
  for (const resolver of virtualOwnerFieldResolvers) {
    const result = resolver(params)
    if (result !== undefined) return result
  }
  return undefined
}

export function registerTableColumnResolver(resolver: TableColumnResolver): void {
  tableColumnResolvers.push(resolver)
}

export function resolveRegisteredTableColumn(params: Parameters<TableColumnResolver>[0]): FormDataPathColumnSource | undefined {
  for (const resolver of tableColumnResolvers) {
    const result = resolver(params)
    if (result !== undefined) return result
  }
  return undefined
}

export function registerTraversalTransitionResolver(resolver: TraversalTransitionResolver): void {
  traversalTransitionResolvers.push(resolver)
}

export function resolveTraversalTransition(params: Parameters<TraversalTransitionResolver>[0]): ReturnType<TraversalTransitionResolver> {
  for (const resolver of traversalTransitionResolvers) {
    const result = resolver(params)
    if (result !== undefined) return result
  }
  return undefined
}

export function clearDataPathResolverRegistryForTests(): void {
  ownerKinds.clear()
  ownerKindByTypeBase.clear()
  ownerKindByRegisterRecordSetBase.clear()
  ownerKindByMetadataLinkPrefix.clear()
  typeResolvers.length = 0
  objectFieldCollectionProviders.length = 0
  standardAttributeTypeResolvers.length = 0
  virtualOwnerFieldResolvers.length = 0
  tableColumnResolvers.length = 0
  traversalTransitionResolvers.length = 0
}
```

Remove the unused `Diagnostic` import if TypeScript reports it.

- [ ] **Step 5: Run registry test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/registry.test.ts --no-isolate
```

Expected: PASS.

## Task 2: Move Owner Kind Loading to Registry

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.ts`
- Modify/create: applied object `register.ts` files for owner kinds
- Test: `packages/core/metadata/validation/dataPath/ownerCache.test.ts`

- [ ] **Step 1: Add owner kind registrations**

Register these owner kinds in the corresponding object `register.ts` files:

```ts
registerDataPathOwnerKind({ kind: "Справочник", projectDir: "Справочник", rule: MetadataCatalogRules, typeDescriptionBases: ["CatalogRef"], metadataLinkPrefixes: ["Catalog"], aliases: ["СправочникОбъект"] })
registerDataPathOwnerKind({ kind: "Документ", projectDir: "Документ", rule: MetadataDocumentRules, typeDescriptionBases: ["DocumentRef"], metadataLinkPrefixes: ["Document"], aliases: ["ДокументОбъект"] })
registerDataPathOwnerKind({ kind: "Перечисление", projectDir: "Перечисление", rule: MetadataEnumerationRules, typeDescriptionBases: ["EnumRef"], metadataLinkPrefixes: ["Enum"] })
registerDataPathOwnerKind({ kind: "РегистрСведений", projectDir: "РегистрСведений", rule: MetadataInformationRegisterRules, typeDescriptionBases: ["InformationRegisterRecordManager"], registerRecordSetBases: ["InformationRegisterRecordSet"], metadataLinkPrefixes: ["InformationRegister"] })
registerDataPathOwnerKind({ kind: "РегистрНакопления", projectDir: "РегистрНакопления", rule: MetadataAccumulationRegisterRules, typeDescriptionBases: ["AccumulationRegisterRecordManager"], registerRecordSetBases: ["AccumulationRegisterRecordSet"], metadataLinkPrefixes: ["AccumulationRegister"] })
registerDataPathOwnerKind({ kind: "РегистрБухгалтерии", projectDir: "РегистрБухгалтерии", rule: MetadataAccountingRegisterRules, typeDescriptionBases: ["AccountingRegisterRecordManager"], registerRecordSetBases: ["AccountingRegisterRecordSet"], metadataLinkPrefixes: ["AccountingRegister"] })
registerDataPathOwnerKind({ kind: "РегистрРасчета", projectDir: "РегистрРасчета", rule: MetadataCalculationRegisterRules, typeDescriptionBases: ["CalculationRegisterRecordManager"], registerRecordSetBases: ["CalculationRegisterRecordSet"], metadataLinkPrefixes: ["CalculationRegister"] })
registerDataPathOwnerKind({ kind: "ПланОбмена", projectDir: "ПланОбмена", rule: MetadataExchangePlanRules, typeDescriptionBases: ["ExchangePlanRef"], metadataLinkPrefixes: ["ExchangePlan"], aliases: ["ПланОбменаОбъект"] })
registerDataPathOwnerKind({ kind: "ПланВидовРасчета", projectDir: "ПланВидовРасчета", rule: MetadataChartOfCalculationTypesRules, typeDescriptionBases: ["ChartOfCalculationTypesRef"], metadataLinkPrefixes: ["ChartOfCalculationTypes"], aliases: ["ПланВидовРасчетаОбъект"] })
registerDataPathOwnerKind({ kind: "ПланВидовХарактеристик", projectDir: "ПланВидовХарактеристик", rule: MetadataChartOfCharacteristicTypesRules, typeDescriptionBases: ["ChartOfCharacteristicTypesRef"], metadataLinkPrefixes: ["ChartOfCharacteristicTypes"], aliases: ["ПланВидовХарактеристикОбъект"] })
registerDataPathOwnerKind({ kind: "ПланСчетов", projectDir: "ПланСчетов", rule: MetadataChartOfAccountsRules, typeDescriptionBases: ["ChartOfAccountsRef", "ChartOfAccountObject", "ChartOfAccountsObject"], metadataLinkPrefixes: ["ChartOfAccounts"], aliases: ["ПланСчетовОбъект"] })
registerDataPathOwnerKind({ kind: "Обработка", projectDir: "Обработка", rule: MetadataDataProcessorRules, typeDescriptionBases: ["DataProcessorObject"], metadataLinkPrefixes: ["DataProcessor"], aliases: ["ОбработкаОбъект"] })
registerDataPathOwnerKind({ kind: "Отчет", projectDir: "Отчет", rule: MetadataReportRules, typeDescriptionBases: ["ReportObject"], metadataLinkPrefixes: ["Report"], aliases: ["ОтчетОбъект"] })
registerDataPathOwnerKind({ kind: "БизнесПроцесс", projectDir: "БизнесПроцесс", rule: MetadataBusinessProcessRules, typeDescriptionBases: ["BusinessProcessRef", "BusinessProcessObject"], metadataLinkPrefixes: ["BusinessProcess"], aliases: ["БизнесПроцессОбъект"] })
registerDataPathOwnerKind({ kind: "Задача", projectDir: "Задача", rule: MetadataTaskRules, typeDescriptionBases: ["TaskRef", "TaskObject"], metadataLinkPrefixes: ["Task"], aliases: ["ЗадачаОбъект"] })
registerDataPathOwnerKind({ kind: "ОбщийРеквизит", projectDir: "ОбщийРеквизит", rule: MetadataCommonAttributeRules })
registerDataPathOwnerKind({ kind: "КритерийОтбора", projectDir: "КритерийОтбора", rule: MetadataFilterCriterionRules })
registerDataPathOwnerKind({ kind: "ХранилищеНастроек", projectDir: "ХранилищеНастроек", rule: MetadataSettingsStorageRules })
registerDataPathOwnerKind({ kind: "НумераторДокументов", projectDir: "Нумератор", rule: MetadataDocumentNumeratorRules })
registerDataPathOwnerKind({ kind: "Константа", projectDir: "Константа", rule: MetadataConstantRules })
registerDataPathOwnerKind({ kind: "ОпределяемыйТип", projectDir: "ОпределяемыйТип", rule: MetadataDefinedTypeRules })
```

- [ ] **Step 2: Replace owner dir/spec maps**

In `ownerCache.ts`, delete `ownerDirByRefKind`, all `constantOwnerSpec`/`definedTypeOwnerSpec` local specs, `createLocalOwnerSpec(...)`, `getOwnerProjectSpecByDir(...)`, and `ownerDirForRefKind(...)`.

Use registry:

```ts
const ownerKind = getDataPathOwnerKind(ref.kind)
const dir = ownerKind?.projectDir
const spec = ownerKind === undefined
  ? undefined
  : createValidationSpecFromOwnerKind(ownerKind)
```

Add:

```ts
function createValidationSpecFromOwnerKind(ownerKind: DataPathOwnerKindRegistration): ValidationProjectSpec {
  return {
    kind: ownerKind.kind,
    dir: ownerKind.projectDir,
    rule: ownerKind.rule,
    exportSchema: () => Type.Object({}),
    importModel: ({ context, parsed, name }) => {
      const model: unknown = importMetadataItemFromYAML({ context, yaml: parsed.data, rule: ownerKind.rule, name })
      return isMetadataItem(model) ? model : undefined
    },
  }
}
```

- [ ] **Step 3: Run owner cache tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/ownerCache.test.ts --no-isolate
```

Expected: PASS.

## Task 3: Move TypeDescription Mapping to Registry

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/typeDescription.ts`
- Modify: owner kind registrations from Task 2
- Test: `packages/core/metadata/validation/dataPath/typeDescription.test.ts`

- [ ] **Step 1: Add source guard**

Add to `typeDescription.test.ts`:

```ts
  it("does not hard-code owner base type maps", () => {
    const source = readFileSync(join(process.cwd(), "metadata/validation/dataPath/typeDescription.ts"), "utf-8")

    expect(source).not.toContain("ownerKindsByBaseType")
    expect(source).not.toContain("registerRecordSetOwnerKindsByBaseType")
    expect(source).toContain("getOwnerKindByTypeDescriptionBase")
    expect(source).toContain("getOwnerKindByRegisterRecordSetBase")
  })
```

Add imports:

```ts
import { readFileSync } from "fs"
import { join } from "path"
```

- [ ] **Step 2: Replace maps with registry calls**

In `typeDescription.ts`, delete `ownerKindsByBaseType` and `registerRecordSetOwnerKindsByBaseType`.

Replace `ownerTypeRefFromType(...)` with:

```ts
function ownerTypeRefFromType(type: string): OwnerTypeRef | undefined {
  const [baseType, name] = splitType(type)
  const kind = getOwnerKindByTypeDescriptionBase(baseType)
  return kind === undefined ? undefined : { kind, ...(name ? { name } : {}) }
}
```

Replace `registerRecordSetOwnerTypeRefFromType(...)` with:

```ts
function registerRecordSetOwnerTypeRefFromType(type: string): OwnerTypeRef | undefined {
  const [baseType, name] = splitType(type)
  const kind = getOwnerKindByRegisterRecordSetBase(baseType)
  return kind === undefined ? undefined : { kind, ...(name ? { name } : {}) }
}
```

After scalar/platform built-ins, allow custom type resolvers:

```ts
const registered = resolveRegisteredDataPathType({ baseType: splitType(type)[0], name: splitType(type)[1] })
if (registered !== undefined) return { kind: registered.kinds[0] ?? "unknown", table: registered.table, nextType: registered.nextTypes[0] }
```

- [ ] **Step 3: Run typeDescription tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/typeDescription.test.ts --no-isolate
```

Expected: PASS.

## Task 4: Move Object Fields and Standard Attributes to Registry

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/objectFields.ts`
- Modify: owner object `register.ts` files
- Test: `packages/core/metadata/validation/dataPath/objectFields.test.ts`
- Test: `packages/core/metadata/validation/validateForm.test.ts`

- [ ] **Step 1: Register object field collections**

Add collection providers:

```ts
registerObjectFieldCollectionProvider(({ owner }) => {
  const descriptors = []
  for (const collection of ["attributes", "tabularSections", "dimensions", "resources", "addressingAttributes"] as const) {
    if (owner.rule.properties[collection] === undefined) continue
    descriptors.push({
      collection,
      kind: collection === "tabularSections"
        ? "tabularSection"
        : collection === "dimensions"
          ? "dimension"
          : collection === "resources"
            ? "resource"
            : collection === "addressingAttributes"
              ? "addressingAttribute"
              : "attribute",
    } as const)
  }
  return descriptors
})
```

Place this in a neutral dataPath registration module imported by `metadata/register`.

- [ ] **Step 2: Register standard attribute type resolvers**

Add:

```ts
registerStandardAttributeTypeResolver(({ owner, internalName, yamlName, explicitTypeInfo }) => {
  if (explicitTypeInfo !== undefined) return explicitTypeInfo
  if (internalName === "Ref" || yamlName === "Ссылка") return { kinds: ["object"], nextTypes: [{ ...owner.ref }] }
  if (internalName === "Parent" || yamlName === "Родитель") return { kinds: ["object"], nextTypes: [{ ...owner.ref }], sourceText: `${owner.ref.kind}.Parent` }
  if (internalName === "ValueType" || yamlName === "ТипЗначения") return { kinds: ["typeDescription"], nextTypes: [], sourceText: `${owner.ref.kind}.ValueType` }
  if (internalName === "SentNo" || internalName === "ReceivedNo") return { kinds: ["scalar"], nextTypes: [], sourceText: `${owner.ref.kind}.SentReceivedNo` }
  if (["DeletionMark", "Posted", "Executed", "Completed", "Started"].includes(internalName)) return { kinds: ["boolean"], nextTypes: [], sourceText: `${owner.ref.kind}.${internalName}` }
  if (internalName === "BusinessProcess") return { kinds: ["object"], nextTypes: [{ kind: "БизнесПроцесс" }], sourceText: `${owner.ref.kind}.BusinessProcess` }
  if (internalName === "RoutePoint") return { kinds: ["object"], nextTypes: [{ kind: "БизнесПроцесс" }], sourceText: `${owner.ref.kind}.RoutePoint` }
  if (internalName === "Predefined" || yamlName === "Предопределенный") return { kinds: ["boolean"], nextTypes: [], sourceText: `${owner.ref.kind}.Predefined` }
  return undefined
})
```

Add owner attribute resolver:

```ts
registerStandardAttributeTypeResolver(({ owner, internalName, yamlName }) => {
  if (internalName !== "Owner" && yamlName !== "Владелец") return undefined
  const ownerLinks = metadataRecord(owner.model).owners
  if (!Array.isArray(ownerLinks)) return undefined
  const nextTypes = ownerLinks
    .map((link) => typeof link === "string" ? ownerTypeRefFromMetadataLink(link) : undefined)
    .filter((ref): ref is OwnerTypeRef => ref !== undefined)
  return nextTypes.length === 0 ? undefined : { kinds: ["object"], nextTypes, isComposite: nextTypes.length > 1, sourceText: ownerLinks.join(" | ") }
})
```

Use `getOwnerKindByMetadataLinkPrefix(...)` inside `ownerTypeRefFromMetadataLink(...)`.

- [ ] **Step 3: Replace object field internals**

In `objectFields.ts`, replace `dataCollectionKinds` with:

```ts
for (const descriptor of getObjectFieldCollectionDescriptors(owner)) {
  const items = getNamedItems(model[descriptor.collection])
  for (const item of items) {
    if (typeof item.name !== "string" || item.name.length === 0) continue
    if (descriptor.kind === "tabularSection") {
      fields.set(item.name, buildTabularSectionField(owner, item, descriptor.collection))
      continue
    }
    fields.set(item.name, {
      name: item.name,
      kind: descriptor.kind,
      sourceCollection: descriptor.collection,
      typeInfo: typeDescriptionToDataPathTypeInfo(item.type),
    })
  }
}
```

Replace `standardAttributeTypeInfo(...)` body with:

```ts
const explicitTypeInfo = params.explicit?.type === undefined ? undefined : typeDescriptionToDataPathTypeInfo(params.explicit.type)
return resolveStandardAttributeType({
  owner: params.owner as OwnerMetadata,
  internalName: params.internalName,
  yamlName: params.yamlName,
  explicitTypeInfo,
}) ?? unknownDataPathTypeInfo
```

- [ ] **Step 4: Run object fields and form tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/objectFields.test.ts packages/core/metadata/validation/validateForm.test.ts --no-isolate
```

Expected: PASS.

## Task 5: Move Virtual Fields, Table Columns and Special Transitions

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/resolver.ts`
- Modify: dataPath registration module
- Test: `packages/core/metadata/validation/validateForm.test.ts`

- [ ] **Step 1: Register virtual owner fields**

Register the four virtual owner field groups with `registerVirtualOwnerFieldResolver(...)` calls.

Example registration:

```ts
registerVirtualOwnerFieldResolver(({ owner, segment }) => {
  if (owner.ref.kind !== "ПланОбмена" && owner.ref.kind !== "ПланОбменаОбъект") return undefined
  if (segment === "ThisNode") return { name: "ThisNode", typeInfo: { kinds: ["object"], nextTypes: [{ ...owner.ref }], sourceText: "ExchangePlan.ThisNode" } }
  if (segment === "ОбластьДанныхОсновныеДанные") return { name: segment, typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "ExchangePlan.DataSeparation" } }
  return undefined
})
```

Add separate `registerVirtualOwnerFieldResolver(...)` calls for these cases:

```ts
registerVirtualOwnerFieldResolver(({ owner, segment }) => {
  if (owner.ref.kind !== "РегистрСведений") return undefined
  if (segment !== "ОбластьДанныхВспомогательныеДанные") return undefined
  return { name: segment, typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "InformationRegister.DataSeparation" } }
})

registerVirtualOwnerFieldResolver(({ owner, segment }) => {
  if (owner.ref.kind !== "ПланСчетов" && owner.ref.kind !== "ПланСчетовОбъект") return undefined
  if (segment === "ExtDimensionTypes") {
    const table = { kind: "ValueTable" as const }
    return { name: segment, typeInfo: { kinds: ["tableSource"], nextTypes: [], table, sourceText: "ChartOfAccounts.ExtDimensionTypes" }, tableSource: { table, columns: new Map(), hasColumns: true } }
  }
  if (["Order", "Type"].includes(segment)) return { name: segment, typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: `ChartOfAccounts.${segment}` } }
  if (segment === "OffBalance") return { name: segment, typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText: "ChartOfAccounts.OffBalance" } }
  return undefined
})

registerVirtualOwnerFieldResolver(({ owner, segment }) => {
  if (owner.ref.kind !== "ПланВидовРасчета" && owner.ref.kind !== "ПланВидовРасчетаОбъект") return undefined
  if (segment === "ActionPeriodIsBasic") return { name: segment, typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText: "ChartOfCalculationTypes.ActionPeriodIsBasic" } }
  if (["BaseCalculationTypes", "LeadingCalculationTypes", "DisplacingCalculationTypes"].includes(segment)) {
    const table = { kind: "ValueTable" as const }
    return { name: segment, typeInfo: { kinds: ["tableSource"], nextTypes: [], table, sourceText: `ChartOfCalculationTypes.${segment}` }, tableSource: { table, columns: new Map(), hasColumns: true } }
  }
  return undefined
})
```

- [ ] **Step 2: Register table columns**

Move `virtualTableColumn(...)` and `resolveRegisterRecordSetColumn(...)` cases into `registerTableColumnResolver(...)` by returning the `FormDataPathColumnSource` objects listed below from registration functions.

Register at least:

```ts
ValueList -> Value, Presentation, Check
GanttChart -> StartDate, EndDate, Text, Value
RegisterRecordSet -> Active, Recorder, LineNumber, Period
AccountingRegister RegisterRecordSet -> debit/credit special columns: DebitAccount, CreditAccount, DebitQuantity, CreditQuantity
```

Use these stable `DataPathTypeInfo` shapes for the moved scalar/boolean/date columns:

```ts
const scalarColumn = (name: string): FormDataPathColumnSource => ({
  name,
  typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: name },
})
const booleanColumn = (name: string): FormDataPathColumnSource => ({
  name,
  typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText: name },
})
const dateTimeColumn = (name: string): FormDataPathColumnSource => ({
  name,
  typeInfo: { kinds: ["dateTime"], nextTypes: [], sourceText: name },
})
```

- [ ] **Step 3: Register special traversal transitions**

Move these branches into `registerTraversalTransitionResolver(...)`:

```ts
Документ + RegisterRecords/НаборЗаписей -> register records table source
Отчет/ОтчетОбъект + SettingsComposer/КомпоновщикНастроек -> platformSource warning
ConstantsSet/КонстантыНабор -> owner kind Константа
DefinedType -> owner kind ОпределяемыйТип
ОбщийРеквизит -> applicable common attribute field
```

Use return shape:

```ts
{
  typeInfo: { kinds: ["tableSource"], nextTypes: [], table, sourceText: `RegisterRecords.${segment}` },
  sourceName: segment,
  tableSource: { table, columns: new Map(), hasColumns: true },
}
```

- [ ] **Step 4: Delegate in `resolver.ts`**

Replace direct virtual field call:

```ts
const virtualField = resolveVirtualOwnerField({ owner: ownerResult.owner, segment: lookupSegment })
```

Replace table column fallback:

```ts
resolveRegisteredTableColumn({ table: tableSource.table, segment: lookupSegment, index: params.params.index })
```

Before built-in owner field lookup, call:

```ts
const transition = resolveTraversalTransition({ owner: ownerResult.owner, segment: lookupSegment })
if (transition !== undefined) {
  state = {
    typeInfo: transition.typeInfo,
    source: { kind: "objectField", owner: ownerResult.owner.ref, name: transition.sourceName },
    ...(transition.tableSource !== undefined ? { tableSource: transition.tableSource } : {}),
  }
  if (isLast) return okTarget({ value, segments, state })
  continue
}
```

- [ ] **Step 5: Run form validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/validateForm.test.ts --no-isolate
```

Expected: PASS.

## Task 6: Move Form Sources and Form Validation to Registries

**Files:**
- Create: `packages/core/metadata/validation/formValidationRegistry.ts`
- Modify: `packages/core/metadata/validation/dataPath/formIndex.ts`
- Modify: `packages/core/metadata/validation/validateForm.ts`
- Modify: form/client application form registration files
- Test: `packages/core/metadata/validation/validateForm.test.ts`

- [ ] **Step 1: Add form validation registry**

Create `packages/core/metadata/validation/formValidationRegistry.ts`:

```ts
import type { ConfigurationContext } from "~/metadata/context/types"
import type { ProjectYamlCache } from "./projectYamlCache"
import type { Diagnostic } from "./types"

export interface RegisteredFormValidatorParams {
  projectDir: string
  formDir: string
  formName: string
  owner: { dir: string; name: string }
  cache: ProjectYamlCache
  context?: ConfigurationContext
  suppressFormImportDiagnostics?: boolean
}

export type RegisteredFormValidator = (params: RegisteredFormValidatorParams) => Diagnostic[]
export type FormPlatformSourceMatcher = (path: string) => { kind: "platformSource"; path: string; matchedSource: string; match: "exact" | "prefix" } | undefined

let formValidator: RegisteredFormValidator | undefined
const platformSourceMatchers: FormPlatformSourceMatcher[] = []

export function registerFormValidator(validator: RegisteredFormValidator): void {
  formValidator = validator
}

export function getRegisteredFormValidator(): RegisteredFormValidator | undefined {
  return formValidator
}

export function registerFormPlatformSourceMatcher(matcher: FormPlatformSourceMatcher): void {
  platformSourceMatchers.push(matcher)
}

export function matchRegisteredFormPlatformSource(path: string): ReturnType<FormPlatformSourceMatcher> {
  for (const matcher of platformSourceMatchers) {
    const result = matcher(path)
    if (result !== undefined) return result
  }
  return undefined
}
```

- [ ] **Step 2: Move known platform form sources**

In `formIndex.ts`, delete `knownPlatformFormSources` and replace `getKnownPlatformFormSource(...)` with:

```ts
export function getKnownPlatformFormSource(path: string): KnownPlatformFormSource | undefined {
  return matchRegisteredFormPlatformSource(path)
}
```

Register these platform sources in the client form registration:

```ts
for (const source of [
  "КомпоновщикНастроекКомпоновкиДанных.Settings",
  "КомпоновщикНастроекКомпоновкиДанных.Settings.Filter",
  "КомпоновщикНастроекКомпоновкиДанных.Settings.Use",
] as const) {
  registerFormPlatformSourceMatcher((path) => {
    if (path === source) return { kind: "platformSource", path, matchedSource: source, match: "exact" }
    if (path.startsWith(`${source}.`)) return { kind: "platformSource", path, matchedSource: source, match: "prefix" }
    return undefined
  })
}
```

- [ ] **Step 3: Move client form validation body into registered validator**

Create the registered validator with the same top-level control flow as `validateForm(...)`:

```ts
export const validateClientApplicationForm: RegisteredFormValidator = (params) => {
  const filePath = join(params.formDir, "Форма.yaml")
  const entry = params.cache.get(filePath)
  if ("error" in entry) {
    return [{
      filePath: entry.filePath,
      line: 1,
      col: 1,
      severity: "error",
      source: "external-file",
      message: `Не удалось прочитать форму "${params.formName}": ${entry.error.message}`,
    }]
  }
  return validateParsedClientApplicationForm({ ...params, filePath, entry })
}
```

Create `validateParsedClientApplicationForm(...)` in the same file by moving the syntax diagnostics, import, index, warning, occurrence and policy checks from `validateForm.ts` into that helper without changing messages.

Place it near `forms/clientApplicationForm/register.ts` or `forms/clientApplicationForm/validate.ts`.

Register it:

```ts
registerFormValidator(validateClientApplicationForm)
```

Replace `validateForm(...)` in `packages/core/metadata/validation/validateForm.ts` with:

```ts
export function validateForm(params: ValidateFormParams): Diagnostic[] {
  const validator = getRegisteredFormValidator()
  if (!validator) return []
  return validator(params)
}
```

- [ ] **Step 4: Move dynamic list warning provider**

Keep the exact warning message but register it beside dynamic list/form rules:

```ts
registerFormWarningProvider(({ filePath, parsed }) => collectDynamicListTypeValueWarnings({ filePath, parsed }))
```

Add warning providers to `formValidationRegistry.ts`:

```ts
export type FormWarningProvider = (params: { filePath: string; parsed: ParsedYaml }) => Diagnostic[]
const warningProviders: FormWarningProvider[] = []
export function registerFormWarningProvider(provider: FormWarningProvider): void { warningProviders.push(provider) }
export function getFormWarningProviders(): readonly FormWarningProvider[] { return warningProviders }
```

Call `getFormWarningProviders()` from `validateClientApplicationForm`.

- [ ] **Step 5: Move opaque multiple value policy**

Add to `DataPathPropertyRule` or the form occurrence model:

```ts
allowOpaqueMultipleValue?: true
```

Set it in the `InputField` data-path rule that produces occurrences with `hasMultipleValuesExtendedEdit`.

Replace `isAcceptedOpaqueMultipleValueDataPath(...)` with:

```ts
function isAcceptedOpaqueMultipleValueDataPath(occurrence: ReturnType<typeof collectFormDataPathOccurrences>[number]): boolean {
  return occurrence.rule.allowOpaqueMultipleValue === true &&
    /^[0-9]+\/[0-9]+:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(occurrence.value)
}
```

- [ ] **Step 6: Run form tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/validateForm.test.ts packages/core/metadata/validation/dataPath/formTraversal.test.ts --no-isolate
```

Expected: PASS.

## Task 7: Add Boundary Guards

**Files:**
- Modify: `packages/core/metadata/importBoundaries.test.ts`

- [ ] **Step 1: Add dataPath source guard**

Add:

```ts
  it("validation/dataPath core does not hard-code concrete owner kinds", () => {
    const files = [
      "metadata/validation/dataPath/types.ts",
      "metadata/validation/dataPath/ownerCache.ts",
      "metadata/validation/dataPath/typeDescription.ts",
      "metadata/validation/dataPath/objectFields.ts",
      "metadata/validation/dataPath/resolver.ts",
    ]

    for (const filePath of files) {
      const source = readFileSync(join(process.cwd(), filePath), "utf-8")
      for (const forbidden of ["Справочник", "Документ", "РегистрСведений", "ПланСчетов", "CatalogRef", "DocumentRef", "RegisterRecords"]) {
        expect(source).not.toContain(forbidden)
      }
    }
  })
```

- [ ] **Step 2: Add validateForm source guard**

Add:

```ts
  it("validateForm delegates concrete form behavior to registered validator", () => {
    const source = readFileSync(join(METADATA_DIR, "validation", "validateForm.ts"), "utf-8")

    expect(source).not.toContain("importClientApplicationFormFromYAML")
    expect(source).not.toContain("ДинамическийСписок")
    expect(source).not.toContain("InputField")
    expect(source).toContain("getRegisteredFormValidator")
  })
```

- [ ] **Step 3: Run boundary tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS.

## Task 8: Verify and Commit

**Files:**
- All files changed in this plan.

- [ ] **Step 1: Run focused validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/registry.test.ts packages/core/metadata/validation/dataPath/ownerCache.test.ts packages/core/metadata/validation/dataPath/typeDescription.test.ts packages/core/metadata/validation/dataPath/objectFields.test.ts packages/core/metadata/validation/dataPath/formIndex.test.ts packages/core/metadata/validation/dataPath/formTraversal.test.ts packages/core/metadata/validation/validateForm.test.ts packages/core/metadata/importBoundaries.test.ts --no-isolate
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

- [ ] **Step 3: Search for removed concrete knowledge**

Run:

```bash
rg -n "KnownOwnerTypeKind|ownerKindsByBaseType|registerKindByLinkPrefix|isDocumentOwner|isReportOwner|isChartOfAccountsOwner|ДинамическийСписок|InputField|ClientApplicationForm" packages/core/metadata/validation
```

Expected: production-code matches remain only in registration files outside neutral validation core or in tests.

- [ ] **Step 4: Commit**

Run:

```bash
git add packages/core/metadata/validation \
  packages/core/metadata/appliedObjects \
  packages/core/metadata/commonObjects \
  packages/core/metadata/forms \
  packages/core/metadata/importBoundaries.test.ts
git commit -m "refactor: :recycle: вынести dataPath и form validation"
```

Expected: commit succeeds.
