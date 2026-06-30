# Metadata Central Registry Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Удалить центральные `PropertyTypeRegistry` и `MetadataItemTypeRegistry` как списки конкретных metadata/property types из `orchestration`.

**Architecture:** После предыдущих планов runtime-поведение приходит через `register.ts`, type-rule registries и project/dataPath/form registries. Центральные типы в orchestration становятся нейтральными строковыми ключами; конкретные модели выводятся рядом с объектами из `rules.ts` через `MetadataTypeByRule<typeof Rules>` и `YAMLTypeByRule<typeof Rules>`.

**Tech Stack:** TypeScript 5.9, Vitest, pnpm, existing metadata rule inference helpers.

---

## Scope Check

Этот план выполняется последним. Перед началом `rg` должен показывать только потребителей, которые перечислены в Task 1 и мигрируются в этом плане.

## File Structure

- Modify: `packages/core/metadata/orchestration/property/registry.ts`
  - Remove concrete `PropertyTypeRegistry` body; keep only neutral `PropertyRuleType`.
- Modify: `packages/core/metadata/orchestration/metadataItem/registry.ts`
  - Remove concrete `MetadataItemTypeRegistry` body; keep only neutral item type aliases required by old public imports.
- Modify: `packages/core/metadata/orchestration/property/types.ts`
  - Use string keys for `BasePropertyRule.type`, `MetadataItem.itemType`, `MetadataItemRule.itemType`.
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
  - Accept string property type keys.
- Modify: `packages/core/metadata/orchestration/metadataItem/ruleFactory.ts`
  - Accept string property type keys.
- Modify: remaining concrete object/form/common imports found by Task 1.
- Test: `packages/core/metadata/importBoundaries.test.ts`
- Test: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts`
- Test: focused metadata round-trip/schema tests that import orchestration public types.

## Task 0: Preflight

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `docs/superpowers/specs/2026-06-28-metadata-layer-boundary-violations-spec.md`
- Read: `packages/core/metadata/orchestration/property/registry.ts`
- Read: `packages/core/metadata/orchestration/metadataItem/registry.ts`

- [ ] **Step 1: Check metadata knowledge**

Run:

```bash
test -f .agents/knowledge/metadata/INDEX.md && sed -n '1,260p' .agents/knowledge/metadata/INDEX.md || echo "metadata knowledge index is missing"
```

Expected: the file is read, or the command prints `metadata knowledge index is missing`.

- [ ] **Step 2: Confirm previous plans landed**

Run:

```bash
rg -n "fileChildNamesDescriptor|metadataTargetOwner|registerProjectSpec|registerDataPathOwnerKind|getRegisteredFormValidator" packages/core/metadata
```

Expected: each term has production-code matches.

## Task 1: Audit Remaining Central Registry Consumers

**Files:**
- Read all files matched by commands below.

- [ ] **Step 1: Search metadata item registry consumers**

Run:

```bash
rg -n "MetadataItemTypeRegistry|MetadataItemType|ToYAML<|ToMetadata<|ToEnterprise<|ToTypedYAML<|EnterpriseExportableMetadataType|TypedFormElementType" packages/core/metadata packages/core/tests
```

Expected before migration: matches are limited to orchestration/form element type helpers and old public type imports.

- [ ] **Step 2: Search property registry consumers**

Run:

```bash
rg -n "PropertyTypeRegistry|PropertyRuleType|PropertyRule\\b|ToPropertyYAML<|ToPropertyMetadata<|ToPropertyEnterprise<" packages/core/metadata packages/core/tests
```

Expected before migration: matches are limited to orchestration helpers, tests and function signatures that can accept string keys.

- [ ] **Step 3: Write audit notes into commit message body**

Keep a short local note while editing and paste the exact command output groups into the commit body:

```text
Registry removal audit:
- MetadataItemTypeRegistry consumers: output of Task 1 Step 1
- PropertyTypeRegistry consumers: output of Task 1 Step 2
- Remaining allowed public aliases after migration: MetadataItemType, PropertyRuleType
```

Expected: the list is small enough to migrate in this plan.

## Task 2: Add Boundary Tests That Fail Before Removal

**Files:**
- Modify: `packages/core/metadata/importBoundaries.test.ts`

- [ ] **Step 1: Add central registry removal tests**

Add:

```ts
  it("orchestration property registry is no longer a concrete metadata type list", () => {
    const source = readFileSync(join(METADATA_DIR, "orchestration", "property", "registry.ts"), "utf-8")

    expect(source).not.toContain("interface PropertyTypeRegistry")
    expect(source).not.toMatch(/from "~\/metadata\/(appliedObjects|commonObjects|forms)\//)
    expect(source).toContain("export type PropertyRuleType = string")
  })

  it("orchestration metadata item registry is no longer a concrete metadata type list", () => {
    const source = readFileSync(join(METADATA_DIR, "orchestration", "metadataItem", "registry.ts"), "utf-8")

    expect(source).not.toContain("interface MetadataItemTypeRegistry")
    expect(source).not.toContain("//#region Applied objects")
    expect(source).not.toMatch(/from "~\/metadata\/(appliedObjects|commonObjects|forms)\//)
    expect(source).toContain("export type MetadataItemType = string")
  })
```

- [ ] **Step 2: Run boundary test and confirm failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/importBoundaries.test.ts --no-isolate
```

Expected: FAIL because the central registries still contain concrete lists.

## Task 3: Replace Property Registry with Neutral String Key

**Files:**
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`

- [ ] **Step 1: Replace `property/registry.ts` contents**

Replace `packages/core/metadata/orchestration/property/registry.ts` with:

```ts
/**
 * Neutral runtime key for a property-rule type.
 *
 * Concrete property types are declared next to their rules/builders and are
 * connected to runtime behavior through registerTypeRule(...).
 */
export type PropertyRuleType = string & {}
```

- [ ] **Step 2: Loosen base property rule type**

In `packages/core/metadata/orchestration/property/types.ts`, keep `PropertyRuleType` import and ensure:

```ts
export interface BasePropertyRule {
  /** Тип свойства */
  type: PropertyRuleType
  yaml?: string
  xml?: string
  required?: true
  runtimeOnly?: true
}
```

After all rules have been converted to builders, replace the central `PropertyRule` union with:

```ts
export type PropertyRule = BasePropertyRule
```

Then move property-specific type checking to local builders and tests. For production functions that require a property-specific field, narrow at the boundary:

```ts
function asChildFormNamesRule(rule: PropertyRule): ChildFormNamesPropertyRule | undefined {
  return rule.type === "ChildFormNames" ? (rule as ChildFormNamesPropertyRule) : undefined
}
```

Only use these casts inside the owning property-type implementation or descriptor registration.

- [ ] **Step 3: Update type-rule registry signatures**

In `typeRuleRegistry.ts`, use string keys:

```ts
export const registerTypeRule = <O extends TypeRulesOperations>(
  type: PropertyRuleType,
  operation: O,
  ruleFunction: NonNullable<importExportFunction<O>>
) => {
  const key = createRegistryKey(type, operation)
  typeRulesRegistry.set(key, ruleFunction)
}
```

Use a plain string template key in `fn.ts`:

```ts
type TypeRuleKey = `${string}:${TypeRulesOperations}`
```

- [ ] **Step 4: Run property-level tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts packages/core/metadata/importBoundaries.test.ts --no-isolate
```

Expected: boundary test still fails on metadata item registry, property registry failure is gone.

## Task 4: Replace Metadata Item Registry with Neutral String Key

**Files:**
- Modify: `packages/core/metadata/orchestration/metadataItem/registry.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/ruleFactory.ts`
- Modify: form element type helpers matched by Task 1.

- [ ] **Step 1: Replace `metadataItem/registry.ts` contents**

Replace `packages/core/metadata/orchestration/metadataItem/registry.ts` with:

```ts
/**
 * Neutral runtime key for a metadata item type.
 *
 * Concrete metadata models are inferred next to their rules with
 * MetadataTypeByRule<typeof Rules> and YAMLTypeByRule<typeof Rules>.
 */
export type MetadataItemType = string & {}

export type ToYAML<T extends MetadataItemType> = unknown
export type ToMetadata<T extends MetadataItemType> = unknown
export type EnterpriseExportableMetadataType = MetadataItemType
export type ToEnterprise<T extends EnterpriseExportableMetadataType> = unknown
export type TypedFormElementType = MetadataItemType
export type ToTypedYAML<T extends TypedFormElementType> = unknown
```

The `To*` aliases are compatibility shims only. Task 5 removes remaining production consumers.

- [ ] **Step 2: Loosen metadata item rule keys**

In `property/types.ts`, ensure:

```ts
export interface MetadataItem {
  itemType: MetadataItemType
}

export interface MetadataItemRule extends MetadataItem {
  itemType: MetadataItemType
  properties: PropertiesType
  itemTypePrefix?: string
  xmlDir?: string
  childCollections?: readonly MetadataItemChildCollection[]
}
```

- [ ] **Step 3: Update `registerMetadataItemRule(...)`**

In `metadataItem/ruleFactory.ts`, keep generic inference but do not require propertyType to be in a central union:

```ts
type MetadataItemRuleParams<Rule extends MetadataItemRule, PropertyType extends PropertyRuleType> = {
  propertyType: PropertyType
  itemRule: Rule
}
```

The signature still accepts every string key because `PropertyRuleType` is `string & {}` after Task 3.

- [ ] **Step 4: Run metadata item tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts packages/core/metadata/orchestration/metadataItem packages/core/metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS or remaining failures point to `ToYAML`/`ToMetadata` consumers migrated in Task 5.

## Task 5: Migrate Remaining `To*` Production Consumers

**Files:**
- Modify files matched by Task 1 after Tasks 3-4.

- [ ] **Step 1: Replace form element central type helpers**

In `packages/core/metadata/forms/elements/orchestration/types.ts`, replace central registry-derived typed unions with local unions from form element registrations.

Use:

```ts
export type TypedFormElementType = keyof typeof ElementRulesByType
export type TypedFormElementYAML = {
  [K in TypedFormElementType]: YAMLTypeByRule<(typeof ElementRulesByType)[K]>
}[TypedFormElementType]
```

Add this export in the form element rule factory module:

```ts
export const ElementRulesByType = elementRulesByType
```

Keep the object frozen or readonly if it already is.

- [ ] **Step 2: Replace `ToYAML<T>` and `ToMetadata<T>` imports**

For each remaining production file matched by:

```bash
rg -n "ToYAML<|ToMetadata<|ToEnterprise<|ToTypedYAML<" packages/core/metadata -g '*.ts'
```

replace central aliases with local inference:

```ts
type LocalMetadata = MetadataTypeByRule<typeof SomeRules>
type LocalYAML = YAMLTypeByRule<typeof SomeRules>
```

Use the concrete `SomeRules` already imported by that object. For generic helpers that accept arbitrary rules, make the helper generic over `Rule extends MetadataItemRule` and infer:

```ts
export function helper<Rule extends MetadataItemRule>(params: {
  rule: Rule
  value: MetadataTypeByRule<Rule>
}): YAMLTypeByRule<Rule> {
  return exportMetadataItemToYAML({ rule: params.rule, metadataItem: params.value }) as YAMLTypeByRule<Rule>
}
```

- [ ] **Step 3: Confirm no production consumers remain**

Run:

```bash
rg -n "MetadataItemTypeRegistry|PropertyTypeRegistry|ToYAML<|ToMetadata<|ToEnterprise<|ToTypedYAML<" packages/core/metadata -g '*.ts'
```

Expected: no production-code matches. Test matches are allowed only when they assert absence.

## Task 6: Remove Compatibility Shims

**Files:**
- Modify: `packages/core/metadata/orchestration/metadataItem/registry.ts`

- [ ] **Step 1: Delete old `To*` aliases**

Replace `metadataItem/registry.ts` with:

```ts
/**
 * Neutral runtime key for a metadata item type.
 *
 * Concrete metadata models are inferred next to their rules with
 * MetadataTypeByRule<typeof Rules> and YAMLTypeByRule<typeof Rules>.
 */
export type MetadataItemType = string & {}
```

- [ ] **Step 2: Run TypeScript**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS with no `To*` alias imports remaining.

## Task 7: Strengthen Long-Term Boundary Guards

**Files:**
- Modify: `packages/core/metadata/importBoundaries.test.ts`

- [ ] **Step 1: Add exact forbidden imports for common layers**

Add:

```ts
  it("orchestration, project and validation do not import concrete metadata implementations", () => {
    const checkedDirs = [
      join(METADATA_DIR, "orchestration"),
      join(METADATA_DIR, "project"),
      join(METADATA_DIR, "validation"),
    ]
    const forbidden = [
      "~/metadata/appliedObjects/metadata",
      "~/metadata/commonObjects/metadata",
      "~/metadata/forms/clientApplicationForm",
      "~/metadata/forms/commonObjects",
    ]

    const offenders = checkedDirs.flatMap((dir) =>
      findImportOffenders(dir, forbidden).filter(({ filePath }) => !filePath.endsWith(".test.ts"))
    )

    expect(offenders).toEqual([])
  })
```

- [ ] **Step 2: Add source guards for removed registries**

Add:

```ts
  it("central metadata registries expose only neutral string keys", () => {
    const propertyRegistry = readFileSync(join(METADATA_DIR, "orchestration", "property", "registry.ts"), "utf-8")
    const metadataItemRegistry = readFileSync(join(METADATA_DIR, "orchestration", "metadataItem", "registry.ts"), "utf-8")

    expect(propertyRegistry.trim()).toContain("export type PropertyRuleType = string")
    expect(metadataItemRegistry.trim()).toContain("export type MetadataItemType = string")
    expect(propertyRegistry).not.toContain("interface PropertyTypeRegistry")
    expect(metadataItemRegistry).not.toContain("interface MetadataItemTypeRegistry")
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

- [ ] **Step 1: Run focused registry tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/importBoundaries.test.ts packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts packages/core/metadata/validation/schemaRegistry.test.ts --no-isolate
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

- [ ] **Step 3: Final source search**

Run:

```bash
rg -n "interface PropertyTypeRegistry|interface MetadataItemTypeRegistry|//#region Applied objects|~/metadata/appliedObjects/metadata|~/metadata/forms/clientApplicationForm|rootByOwnerItemType|ownerKindsByBaseType" packages/core/metadata
```

Expected: no production-code matches.

- [ ] **Step 4: Commit**

Run:

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: удалить центральные metadata registry"
```

Expected: commit succeeds.
