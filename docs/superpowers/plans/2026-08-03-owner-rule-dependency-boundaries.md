# Owner Rule Dependency Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранить объектные правила реквизитов, табличных частей, измерений и ресурсов, не добавляя новых рёбер в архитектурный baseline.

**Architecture:** Общая регистрация коллекций остаётся резервным договором импорта/экспорта, а конкретный владелец передаёт собственный `itemRule` непосредственно в property rule. Переиспользуемые fragments становятся листьями графа без обратного пути к `metadata/register.ts`; новые owner-specific регистрации и промежуточные `childRules.ts` удаляются.

**Tech Stack:** TypeScript 7, Vitest, pnpm, dependency-cruiser 18.1.0, jscpd 5.0.12.

## Global Constraints

- YAML- и XML-представления не меняются.
- Порядок XML-полей сохраняется.
- Defaults и набор допустимых полей остаются отдельными для каждого владельца.
- Существующие XML-фикстуры не изменяются.
- `.dependency-cruiser-known-violations.json` не расширяется.
- Общая регистрация коллекций сохраняется; удаляются только регистрации пар «владелец—роль».
- Новые `fromXML`/`toXML`/`fromYAML`/`toYAML` не добавляются: договор выражается через `rules.ts` и `itemRule`.
- Stryker не запускается и не возвращается в зависимости.
- После изменения импортов обязательно запускать `pnpm test:architecture`.

---

### Task 1: Вернуть разрешение itemRule и нейтральные потребители на существующие границы

**Files:**
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Create: `packages/core/metadata/orchestration/property/typeRuleRegistry.test.ts`
- Delete: `packages/core/metadata/orchestration/property/resolvePropertyItemRule.ts`
- Delete: `packages/core/metadata/orchestration/property/resolvePropertyItemRule.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`
- Modify: `packages/core/metadata/project/projectSpecRegistry.ts`
- Modify: `packages/core/metadata/validation/excludeIfEqualNameYAML.ts`
- Modify: `packages/core/metadata/validation/metadataTargetTraversal.ts`
- Modify: `packages/core/metadata/validation/rulesSnapshot.ts`
- Modify: `packages/core/metadata/operations/targetResolver.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/mainAttributeKinds.ts`
- Modify: `packages/core/metadata/validation/dataPath/objectFields.ts`

**Interfaces:**
- Produces: `resolvePropertyItemRule(propertyRule: PropertyRule, fallback?: MetadataItemRule): MetadataItemRule | undefined` from `typeRuleRegistry.ts`.
- Preserves priority: explicit `propertyRule.itemRule` → supplied fallback → registered `collectionItemRule`.
- Preserves `hasMainAttributeKind` public signature while replacing `FormDataPathIndex` with a local structural contract.

- [ ] **Step 1: Move the existing resolver test to the established registry boundary**

Create `typeRuleRegistry.test.ts` with the observable precedence contract:

```ts
import { expect, it } from "vitest"
import type { MetadataItemRule } from "./types"
import { clearTypeRulesRegistry, registerTypeRule, resolvePropertyItemRule } from "./typeRuleRegistry"

const itemRule = (itemType: string): MetadataItemRule => ({ itemType, properties: {} })

it("выбирает явный itemRule раньше fallback и регистрации", () => {
  clearTypeRulesRegistry()
  const explicit = itemRule("Explicit")
  const fallback = itemRule("Fallback")
  const registered = itemRule("Registered")
  registerTypeRule("Probe" as never, "collectionItemRule", { itemRule: registered })

  expect(resolvePropertyItemRule({ type: "Probe", itemRule: explicit }, fallback)).toBe(explicit)
  expect(resolvePropertyItemRule({ type: "Probe" }, fallback)).toBe(fallback)
  expect(resolvePropertyItemRule({ type: "Probe" })).toBe(registered)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/typeRuleRegistry.test.ts
```

Expected: FAIL because `resolvePropertyItemRule` is not exported by `typeRuleRegistry.ts`.

- [ ] **Step 3: Implement the resolver in the existing registry module**

Add type-only imports for `MetadataItemRule` and `PropertyRule`, then add:

```ts
export function resolvePropertyItemRule(
  propertyRule: PropertyRule,
  fallback?: MetadataItemRule
): MetadataItemRule | undefined {
  if ("itemRule" in propertyRule && propertyRule.itemRule !== undefined) {
    return propertyRule.itemRule as MetadataItemRule
  }
  return fallback ?? getTypeRule(propertyRule.type, "collectionItemRule")?.itemRule
}
```

Update every listed consumer to import the function from `typeRuleRegistry.ts`. Remove the standalone resolver module and its old test. Do not create a barrel re-export.

- [ ] **Step 4: Remove the two remaining new neutral/concrete edges**

In `mainAttributeKinds.ts`, replace the `FormDataPathIndex` import with the smallest structural input used by the function:

```ts
interface MainAttributeKindIndex {
  getRoot(name: string): {
    typeInfo: { nextTypes: readonly { kind: string }[] }
  } | undefined
}
```

Use `MainAttributeKindIndex | undefined` in `hasMainAttributeKind`.

In `objectFields.ts`, restore the previous import and access path:

```ts
import { MetadataTabularSectionRules } from "../../commonObjects/metadataTabularSection/rules"
```

Use `MetadataTabularSectionRules` for both the structural rule and `properties.standardAttributes`; remove imports from `fragments.ts` and the local `metadataTabularSectionStructuralRule`.

- [ ] **Step 5: Verify behavior and the architecture delta**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/typeRuleRegistry.test.ts metadata/validation/dataPath/objectFields.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
pnpm type-check
pnpm test:architecture
```

Expected: focused tests and type-check PASS. Architecture may still fail on owner/fragments edges, but must no longer report `resolvePropertyItemRule.ts`, `mainAttributeKinds.ts -> validation/dataPath/formIndex.ts`, or `objectFields.ts -> metadataTabularSection/fragments.ts`.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: вернуть itemRule на существующие границы"
```

### Task 2: Сделать инфраструктуру fragments листом графа

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataRuleFragment.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRuleFragment.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/fragments.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/fragments.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterField/fragments.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterField/accountingProperties.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterAttribute/fragments.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterDimension/fragments.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterResource/fragments.ts`

**Interfaces:**
- Produces dependency-free `metadataRuleFragment()` and `composeMetadataItemRule()` with the current exports and runtime validation unchanged.
- Fragments may import only other dependency-free fragment primitives; they must not import `orchestration`, `validation`, `project`, `context`, `metadata/register.ts`, system-enumeration builders, or property-rule builders.

- [ ] **Step 1: Extend the fragment contract test before changing production code**

Add a test proving composition still rejects duplicate keys and preserves order and property identity:

```ts
it("сохраняет порядок и исходные property rules без преобразования", () => {
  const firstRule = { type: "string", xml: "First" } as const
  const secondRule = { type: "boolean", xml: "Second" } as const
  const result = composeMetadataItemRule(
    { itemType: "Probe" },
    metadataRuleFragment(["first"], { first: firstRule }),
    metadataRuleFragment(["second"], { second: secondRule })
  )

  expect(result.xmlOrder).toEqual(["first", "second"])
  expect(result.properties.first).toBe(firstRule)
  expect(result.properties.second).toBe(secondRule)
})
```

- [ ] **Step 2: Run the focused fragment test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataRuleFragment.test.ts
```

Expected: PASS as a characterization test. The RED state for this refactor is the already reproduced `pnpm test:architecture` failure.

- [ ] **Step 3: Remove orchestration types from the fragment composer**

Replace imported `PropertyRule`/`MetadataItemRule` constraints with local structural contracts while preserving inference:

```ts
export type MetadataRulePropertyShape = Readonly<Record<string, unknown>> & {
  readonly type: string
}

export interface MetadataItemRuleShape {
  readonly itemType: string
  readonly [key: string]: unknown
}
```

Keep `assertExactFragmentKeys`, duplicate detection, `Object.freeze`, `xmlOrder`, and exact composed property types unchanged. The composer must return the structural intersection; concrete `rules.ts` files remain responsible for `satisfies MetadataItemRule`.

- [ ] **Step 4: Replace builder imports in the eight fragment modules with literal primitives**

Use dependency-free local constructors in `metadataRuleFragment.ts`:

```ts
export const propertyRule = <const Type extends string, const Params extends Readonly<Record<string, unknown>>>(
  type: Type,
  params: Params
) => Object.freeze({ type, ...params })

export const booleanProperty = <const Params extends Readonly<Record<string, unknown>>>(params: Params) =>
  propertyRule("boolean", params)

export const stringProperty = <const Params extends Readonly<Record<string, unknown>>>(params: Params) =>
  propertyRule("string", params)

export const systemEnumerationProperty = <const Params extends Readonly<Record<string, unknown>>>(params: Params) =>
  propertyRule("SystemEnumeration", params)
```

Replace `booleanRule`, `stringRule`, `systemEnumerationRule`, `uuidPropertyRule`, `internalInfoRule`, and `namedCollectionTarget` calls with equivalent literal property rules. Preserve every existing field and value. For callbacks that inspect the context, define a minimal local structural parameter instead of importing context types; for parent lookup, use a local pure helper accepting `{ exportToXML: { itemsTree: readonly { itemType: string; name: string; path: string }[] } }`.

Do not use `as any` or `as unknown`. Concrete composition sites must prove compatibility with `MetadataItemRule`.

- [ ] **Step 5: Verify fragments remain behaviorally identical and leave the SCC**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataRuleFragment.test.ts metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts metadata/commonObjects/metadataTabularSection/fromYAMLToXML.test.ts metadata/commonObjects/metadataRegisterField/fromYAMLToXML.test.ts metadata/commonObjects/metadataRegisterDimension/fromYAMLToXML.test.ts metadata/commonObjects/metadataRegisterResource/fromYAMLToXML.test.ts
pnpm type-check
pnpm test:architecture
```

Expected: focused tests and type-check PASS. Architecture may still fail on owner registration files, but must no longer list outgoing cycle edges from the eight fragment modules.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects
git commit -m "refactor: :recycle: изолировать fragments от metadata-слоёв"
```

### Task 3: Передавать itemRule для реквизитов и табличных частей напрямую

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/register.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Delete: `packages/core/metadata/commonObjects/metadataAttribute/registerOwnerCollection.ts`
- Delete: `packages/core/metadata/commonObjects/metadataAttribute/registerOwnerCollection.test.ts`
- Delete: `packages/core/metadata/commonObjects/metadataTabularSection/registerOwnerCollection.ts`
- Delete: `packages/core/metadata/commonObjects/metadataTabularSection/registerOwnerCollection.test.ts`
- Modify: `packages/core/metadata/appliedObjects/ownerChildRules.ts`
- Modify existing `builders.ts` or `types.ts` and `rules.ts` under: `metadataBusinessProcess`, `metadataCatalog`, `metadataChartOfAccounts`, `metadataChartOfCalculationTypes`, `metadataChartOfCharacteristicTypes`, `metadataDataProcessor`, `metadataDocument`, `metadataExchangePlan`, `metadataReport`, `metadataTask`
- Delete: the ten corresponding `childRules.ts`
- Modify: `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts`
- Test: `packages/core/metadata/appliedObjects/__tests__/ownerChildRules.test.ts`

**Interfaces:**
- Generic registrations `MetadataAttributes`/existing attribute property types and `MetadataTabularSections`/existing tabular property types remain responsible for collection mechanics.
- Each owner builder produces a property rule containing its concrete `itemRule`.

- [ ] **Step 1: Strengthen the owner test around direct itemRule precedence**

For one attribute and one tabular section, assert both the concrete schema and the property rule itself:

```ts
expect(ownerRule.properties.attributes.itemRule).toBe(MetadataCatalogAttributeRules)
expect(ownerRule.properties.tabularSections.itemRule).toBe(MetadataCatalogTabularSectionRules)
```

Keep the existing matrix that rejects unsupported fields for every owner.

- [ ] **Step 2: Run the owner test and verify RED**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/__tests__/ownerChildRules.test.ts
```

Expected: FAIL for properties that currently obtain their item rule only through owner-specific registration.

- [ ] **Step 3: Restore common fallback rules and registrations**

Recreate `metadataAttribute/rules.ts`, `metadataAttribute/register.ts`, `metadataTabularSection/rules.ts`, and `metadataTabularSection/register.ts` from the current fragments. Register the existing generic/legacy property types with a fallback item rule and `collectionItemRule: true`; do not register any new property type.

The common registration shape remains:

```ts
registerMetadataItemCollectionRule({
  propertyType: "MetadataTabularSections",
  itemRule: MetadataTabularSectionRules,
  xmlElement: "TabularSection",
  keyField: "name",
  collectionItemRule: true,
})
```

Restore their side-effect imports in `commonObjects/index.ts`.

- [ ] **Step 4: Move owner rule composition into existing owner modules**

For each listed owner, move the exported `Metadata*AttributeRules`, `Metadata*TabularSectionAttributeRules`, and `Metadata*TabularSectionRules` from `childRules.ts` into its existing `builders.ts` (or `metadataDocument/types.ts`, where that builder already lives). Keep the same fragment sequence and `xmlOrder`.

Pass the result through the existing property builder:

```ts
metadataCatalogAttributesRule({
  yaml: "Реквизиты",
  xml: "Attribute",
  xmlParents: ["ChildObjects"],
  itemRule: MetadataCatalogAttributeRules,
})
```

Do the same for tabular sections and their nested attribute collection property. Remove `import "./childRules"` and delete the ten `childRules.ts` files. Update tests to import exported rules from `builders.ts`/`types.ts`.

- [ ] **Step 5: Remove owner-specific registration helpers**

Delete both `registerOwnerCollection.ts` modules and their tests. Reduce `ownerChildRules.ts` to dependency-free composition exports still shared by owners, or delete it if all exports have moved into leaf fragments. There must be no call to `registerOwnerAttributeCollection` or `registerOwnerTabularSectionCollection`.

- [ ] **Step 6: Verify behavior and architecture**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/__tests__/ownerChildRules.test.ts metadata/orchestration/property/implicitValueYAMLContract.test.ts metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts metadata/commonObjects/metadataTabularSection/fromYAMLToXML.test.ts
pnpm type-check
pnpm test:architecture
```

Expected: focused tests and type-check PASS. Architecture no longer reports the ten deleted `childRules.ts`, `ownerChildRules.ts`, or attribute/tabular `registerOwnerCollection.ts` edges.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: передать правила дочерних объектов владельцам"
```

### Task 4: Передавать itemRule измерений, ресурсов и реквизитов регистров напрямую

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataRegisterAttribute/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterAttribute/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterDimension/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterDimension/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterResource/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterResource/register.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Delete: `packages/core/metadata/commonObjects/metadataRegisterField/registerOwnerCollection.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataAccountingRegister/builders.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataAccountingRegister/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataAccumulationRegister/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCalculationRegister/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataInformationRegister/rules.ts`
- Delete: the four register `childRules.ts`
- Modify: `packages/core/metadata/commonObjects/recalculation/rules.ts`
- Test: `packages/core/metadata/appliedObjects/__tests__/registerFieldDefaults.test.ts`
- Test: `packages/core/metadata/appliedObjects/__tests__/ownerChildRules.test.ts`

**Interfaces:**
- Generic mechanics remain registered under `MetadataRegisterAttributes`, `MetadataRegisterDimensions`, and `MetadataRegisterResources`.
- Each register property rule contains the owner-specific item rule and therefore controls defaults and allowed YAML fields.

- [ ] **Step 1: Extend the register matrix to assert direct ownership**

For each of the four register owners and each role, assert that the property rule contains the exact exported item rule:

```ts
expect(registerRule.properties.dimensions.itemRule).toBe(expectedDimensionRule)
expect(registerRule.properties.resources.itemRule).toBe(expectedResourceRule)
expect(registerRule.properties.attributes.itemRule).toBe(expectedAttributeRule)
```

Retain the existing 12 defaults cases; changing a default or allowing an unsupported property must still fail the matrix.

- [ ] **Step 2: Run the register tests and verify RED**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/__tests__/registerFieldDefaults.test.ts metadata/appliedObjects/__tests__/ownerChildRules.test.ts
```

Expected: FAIL because the current property types resolve owner rules through side-effect registration.

- [ ] **Step 3: Restore generic fallback collection registrations**

Compose one fallback rule per role from the current fragments and register only the generic property types:

```ts
registerMetadataItemCollectionRule({
  propertyType: "MetadataRegisterDimensions",
  itemRule: MetadataRegisterDimensionRules,
  xmlElement: "Dimension",
  keyField: "name",
  collectionItemRule: true,
})
```

Repeat for attributes and resources and restore side-effect imports in `commonObjects/index.ts`. These fallback rules provide mechanics and compatibility only; owner schemas must use explicit `itemRule`.

- [ ] **Step 4: Restore existing generic builders and attach owner itemRule**

In `metadataAccountingRegister/builders.ts`, remove `createOwner*CollectionRuleBuilder`. Restore the pre-branch generic builders/types and allow `itemRule` through the existing `PropertyRule` parameters.

Move each register's composed item rules from `childRules.ts` into its existing `rules.ts` before the main owner rule, then pass them into the property declarations:

```ts
dimensions: metadataRegisterDimensionsRule({
  yaml: "Измерения",
  xml: "Dimension",
  xmlParents: ["ChildObjects"],
  itemRule: MetadataAccountingRegisterDimensionRules,
})
```

Repeat for resources and attributes for information, accumulation, accounting, and calculation registers. Update recalculation dimensions to carry `MetadataCalculationRegisterDimensionRules` explicitly. Remove all four `import "./childRules"` statements and delete the files.

- [ ] **Step 5: Delete the register owner helper and verify no owner registrations remain**

Delete `metadataRegisterField/registerOwnerCollection.ts`. Confirm:

```bash
rg "registerOwner(RegisterField|Attribute|TabularSection)Collection|createOwner.*CollectionRuleBuilder|/childRules" packages/core/metadata
```

Expected: no production matches.

- [ ] **Step 6: Verify the complete owner contract and architecture**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/__tests__/registerFieldDefaults.test.ts metadata/appliedObjects/__tests__/ownerChildRules.test.ts metadata/orchestration/property/implicitValueYAMLContract.test.ts metadata/commonObjects/recalculation/fromXMLToYAML.test.ts metadata/commonObjects/recalculation/toJSONSchema.test.ts
pnpm type-check
pnpm test:architecture
```

Expected: all commands PASS; dependency-cruiser reports zero new violations relative to the unchanged baseline.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: передать правила полей регистрам"
```

### Task 5: Полная проверка и возобновление PR-цикла

**Files:**
- Verify only: `.dependency-cruiser-known-violations.json`
- Verify only: `/Users/nikita/git/round-trip-compact/cf/doc`

**Interfaces:**
- Consumes: итоговое дерево без новых архитектурных нарушений и дублей.
- Produces: чистую feature-ветку, готовую к продолжению `finish-pr-cycle` с шага push.

- [ ] **Step 1: Verify baseline and worktree cleanliness**

Run:

```bash
git diff origin/develop -- .dependency-cruiser-known-violations.json
git diff --check
git status --short
```

Expected: baseline diff is empty; `git diff --check` succeeds; worktree contains only intended uncommitted plan/implementation changes before the final commit.

- [ ] **Step 2: Run the complete project verification**

Run:

```bash
pnpm type-check
pnpm test
pnpm test:architecture
pnpm duplicates -- --base=origin/develop
```

Expected: all commands exit 0; jscpd prints `Новых дублей относительно origin/develop нет`. Do not run Stryker.

- [ ] **Step 3: Run the doc YAML round-trip and inspect the targeted defaults**

Reset the diagnostic repository before and after the run:

```bash
git -C /Users/nikita/git/round-trip-compact restore -- cf/doc
git -C /Users/nikita/git/round-trip-compact clean -fd -- cf/doc
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/doc ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 20
```

Inspect diffs containing `FillFromFillingValue`, `FillValue`, `Indexing`, `FullTextSearch`, and `DataHistory`. Expected: no register field default regressions. Remaining known form/table-service differences are reported separately and are not hidden.

Restore `cf/doc` again and verify `git -C /Users/nikita/git/round-trip-compact status --short -- cf/doc` is empty.

- [ ] **Step 4: Continue `finish-pr-cycle`**

Confirm `git status --short` is empty, then continue the already requested workflow: push `codex/reference-free-form-xml`, create a PR with base exactly `develop`, merge with a regular merge commit, delete the remote branch, remove `/Users/nikita/git/nkdk/.worktrees/reference-free-form-xml`, delete the local branch, and verify all cleanup checks from `.agents/skills/finish-pr-cycle/SKILL.md`.
