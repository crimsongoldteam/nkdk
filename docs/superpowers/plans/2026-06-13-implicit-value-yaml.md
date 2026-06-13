# Implicit Value YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the rules contract from `defaultValueYAML` to `implicitValueYAML` and remove the old `implicitValueYAML: undefined` open-enumeration marker.

**Architecture:** Keep the behavior in the existing orchestration and rules.ts mechanisms. Treat `implicitValueYAML` as the value implied by an absent YAML key; do not use it during YAML import. Remove the special SystemEnumeration branch that accepted unknown values based on explicit `undefined`.

**Tech Stack:** TypeScript, Vitest, pnpm, metadata orchestration rules.

---

## File Structure

- Modify `packages/core/metadata/orchestration/property/types.ts`: rename the rule field and the source-compare flag.
- Modify `packages/core/metadata/orchestration/property/toYAML.ts`: omit values equal to `implicitValueYAML`.
- Modify `packages/core/metadata/orchestration/property/fromYAML.test.ts`: prove missing YAML does not apply `implicitValueYAML`.
- Modify `packages/core/metadata/orchestration/property/toYAML.test.ts`: prove `implicitValueYAML` omits model values and source values.
- Modify `packages/core/metadata/orchestration/metadataItem/yaml.ts`: exclude explicit YAML values equal to `implicitValueYAML`.
- Modify `packages/core/metadata/orchestration/metadataItem/element.ts`: remove the old open-enumeration type widening based on `implicitValueYAML: undefined`.
- Modify `packages/core/metadata/systemEnumerations/fromYAML.ts`: remove unknown-value fallback.
- Modify `packages/core/metadata/systemEnumerations/toYAML.ts`: remove unknown-value fallback.
- Modify `packages/core/metadata/systemEnumerations/toJSONSchema.ts`: always emit known YAML literals for SystemEnumeration.
- Modify `packages/core/metadata/systemEnumerations/types.ts`: replace `defaultValueYAML` with `implicitValueYAML` and remove explicit-undefined open marker typing.
- Modify `packages/core/metadata/systemEnumerations/*.{test.ts}`: update expectations for closed enumerations.
- Modify `packages/core/metadata/appliedObjects/configuration/rules.ts`: remove old `implicitValueYAML: undefined` lines.
- Modify `packages/core/metadata/**/rules.ts`: rename `defaultValueYAML` to `implicitValueYAML` and `omitDefaultValueYAMLBySource` to `omitImplicitValueYAMLBySource`.
- Modify docs that describe the current contract, especially `docs/superpowers/specs/2026-06-13-implicit-value-yaml-design.md` and any active plan/spec references that would otherwise teach the old name.

## Task 1: Lock The New Contract In Tests

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fromYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/toYAML.test.ts`
- Modify: `packages/core/metadata/systemEnumerations/fromYAML.test.ts`
- Modify: `packages/core/metadata/systemEnumerations/toYAML.test.ts`
- Modify: `packages/core/metadata/systemEnumerations/toJSONSchema.test.ts`

- [ ] **Step 1: Update `fromYAML` property tests to the new name**

Change the local test rules in `packages/core/metadata/orchestration/property/fromYAML.test.ts` from:

```ts
const defaultRule = {
  yaml: "Поле",
  type: "string",
  defaultValueYAML: "model-default",
} as const satisfies PropertyRule
```

to:

```ts
const defaultRule = {
  yaml: "Поле",
  type: "string",
  implicitValueYAML: "model-default",
} as const satisfies PropertyRule
```

Change the synonym rule field from:

```ts
defaultValueYAML: ({ name }: { name?: string }) => ({ items: { ru: name } }),
```

to:

```ts
implicitValueYAML: ({ name }: { name?: string }) => ({ items: { ru: name } }),
```

Rename the test title from:

```ts
it("does not apply defaultValueYAML to missing YAML", () => {
```

to:

```ts
it("does not apply implicitValueYAML to missing YAML", () => {
```

- [ ] **Step 2: Expand `toYAML` property tests for the new name**

Replace `packages/core/metadata/orchestration/property/toYAML.test.ts` with tests that cover direct omission and source-value omission:

```ts
import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { exportPropertyToYAML } from "./toYAML"
import type { PropertyRule } from "./types"

describe("exportPropertyToYAML", () => {
  it("omits values equal to implicitValueYAML", () => {
    const rule = {
      yaml: "Поле",
      type: "string",
      implicitValueYAML: "model-default",
    } as const satisfies PropertyRule

    expect(
      exportPropertyToYAML({
        context: { ...mockContext, exportToYAML: { toTyped: false } },
        rule,
        value: "model-default",
      })
    ).toBeUndefined()
  })

  it("omits converted values when source value equals implicitValueYAML", () => {
    const rule = {
      yaml: "Флаг",
      type: "boolean",
      implicitValueYAML: false,
      omitImplicitValueYAMLBySource: true,
    } as const satisfies PropertyRule

    expect(
      exportPropertyToYAML({
        context: { ...mockContext, exportToYAML: { toTyped: false } },
        rule,
        value: false,
      })
    ).toBeUndefined()
  })
})
```

- [ ] **Step 3: Update SystemEnumeration tests to remove open unknown behavior**

In `packages/core/metadata/systemEnumerations/fromYAML.test.ts`, replace the three tests that use `implicitValueYAML: undefined` with one closed-enumeration assertion:

```ts
it("does not import unknown values", () => {
  const rule: SystemEnumerationPropertyRule<"CompatibilityMode"> = {
    type: "SystemEnumeration",
    typeSE: "CompatibilityMode",
  }

  const result = importSystemEnumerationFromYAML({
    context: mockContext,
    rule,
    value: "Version8_3_28",
  })

  expect(result).toBeUndefined()
})
```

In `packages/core/metadata/systemEnumerations/toYAML.test.ts`, replace the three tests that use `implicitValueYAML: undefined` with one closed-enumeration assertion:

```ts
it("does not export unknown values", () => {
  const rule: SystemEnumerationPropertyRule<"CompatibilityMode"> = {
    type: "SystemEnumeration",
    typeSE: "CompatibilityMode",
  }

  const result = exportSystemEnumerationToYAML(mockContext, rule, "Version8_3_28")

  expect(result).toBeUndefined()
})
```

In `packages/core/metadata/systemEnumerations/toJSONSchema.test.ts`, change the test that expected `Type.String()` for `implicitValueYAML: undefined` into a literal-union expectation. Use the existing schema assertion helper in that file; if it currently asserts unknown acceptance, replace it with:

```ts
expect(Value.Check(schema, "Version8_3_28")).toBe(false)
expect(Value.Check(schema, "Версия8_3_27")).toBe(true)
```

- [ ] **Step 4: Run targeted tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/property/fromYAML.test.ts metadata/orchestration/property/toYAML.test.ts metadata/systemEnumerations/fromYAML.test.ts metadata/systemEnumerations/toYAML.test.ts metadata/systemEnumerations/toJSONSchema.test.ts
```

Expected: FAIL because production code and types still use `implicitValueYAML`, `omitImplicitValueYAMLBySource`, and the old SystemEnumeration marker.

## Task 2: Rename The Orchestration Contract

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/orchestration/property/toYAML.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/yaml.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/element.ts`

- [ ] **Step 1: Update the base rule type**

In `packages/core/metadata/orchestration/property/types.ts`, replace:

```ts
/** Значение по умолчанию в YAML (будет исключено из выбора)*/
implicitValueYAML?: any | DefaultValueFunction

/** Подготавливаемое неявное значение в YAML. */
implicitValueYAML?: any | DefaultValueFunction | undefined

/** Исключать YAML-default по модельному значению до преобразования типа. */
omitImplicitValueYAMLBySource?: true
```

with:

```ts
/** Значение, подразумеваемое отсутствием YAML-ключа; при выгрузке не пишется явно. */
implicitValueYAML?: any | DefaultValueFunction

/** Исключать неявное YAML-значение по модельному значению до преобразования типа. */
omitImplicitValueYAMLBySource?: true
```

- [ ] **Step 2: Update property YAML export**

In `packages/core/metadata/orchestration/property/toYAML.ts`, replace every `implicitValueYAML` read with `implicitValueYAML`, and replace `omitImplicitValueYAMLBySource` with `omitImplicitValueYAMLBySource`.

The derived external-file branch should become:

```ts
if (propertyRule.derivedFrom?.externalFile) {
  if (value === true) continue

  const referencedKey = propertyRule.derivedFrom.externalFile as keyof ToMetadata<Rule["itemType"]>
  const referencedValue = data[referencedKey]
  if (value === propertyRule.implicitValueYAML && referencedValue === undefined) continue
}
```

The early omission check should become:

```ts
if ("implicitValueYAML" in rule && value === (rule as any).implicitValueYAML) return undefined
```

The source-value omission block should become:

```ts
if (
  rule.omitImplicitValueYAMLBySource === true &&
  "implicitValueYAML" in rule &&
  sourceValue === (rule as any).implicitValueYAML
) {
  return undefined
}
if ("implicitValueYAML" in rule && value === (rule as any).implicitValueYAML) return undefined
```

- [ ] **Step 3: Update YAML type inference**

In `packages/core/metadata/orchestration/metadataItem/yaml.ts`, change `ValueTypeWithDefault` to infer `implicitValueYAML`:

```ts
type ValueTypeWithImplicit<Base, P, PropertyType extends PropertyRuleType> = P extends {
  implicitValueYAML: infer D
}
  ? D extends (...args: any[]) => any
    ? Base
    : Exclude<Base, ImplicitValueToYAML<PropertyType, D>>
  : Base
```

Rename `DefaultValueToYAML` to `ImplicitValueToYAML`, and update both SystemEnumeration and primitive branches to call `ValueTypeWithImplicit`.

- [ ] **Step 4: Remove model type widening for old implicit marker**

In `packages/core/metadata/orchestration/metadataItem/element.ts`, remove `SystemEnumerationValueByRule` and use the known enumeration value type directly:

```ts
type PropertyValueByRule<P extends PropertyRule> = P extends {
  type: "SystemEnumeration"
  typeSE: infer TypeSE
}
  ? TypeSE extends string
    ? SETypeByName<TypeSE>
    : unknown
  : P extends { type: infer PropertyType }
    ? PropertyType extends PropertyRuleType
      ? PropertyToMetadata<PropertyType>
      : unknown
    : unknown
```

- [ ] **Step 5: Run orchestration targeted tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/property/fromYAML.test.ts metadata/orchestration/property/toYAML.test.ts metadata/orchestration/metadataItem/yamlInline.test.ts
```

Expected: PASS after the rules files are renamed in Task 4; before Task 4, TypeScript may still fail because many rules still use the old field.

## Task 3: Remove The Old SystemEnumeration Marker

**Files:**
- Modify: `packages/core/metadata/systemEnumerations/fromYAML.ts`
- Modify: `packages/core/metadata/systemEnumerations/toYAML.ts`
- Modify: `packages/core/metadata/systemEnumerations/toJSONSchema.ts`
- Modify: `packages/core/metadata/systemEnumerations/types.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`

- [ ] **Step 1: Remove unknown fallback from fromYAML**

In `packages/core/metadata/systemEnumerations/fromYAML.ts`, replace:

```ts
return (enumeration[value] ?? (allowsUnknownYAMLValues(systemEnumerationRule) ? value : undefined)) as T | undefined
```

with:

```ts
return enumeration[value] as T | undefined
```

Delete the `allowsUnknownYAMLValues` helper.

- [ ] **Step 2: Remove unknown fallback from toYAML**

In `packages/core/metadata/systemEnumerations/toYAML.ts`, replace:

```ts
return (enumeration[value] ?? (allowsUnknownYAMLValues(rule) ? value : undefined)) as T | undefined
```

with:

```ts
return enumeration[value] as T | undefined
```

Delete the `allowsUnknownYAMLValues` helper.

- [ ] **Step 3: Remove open schema branch**

In `packages/core/metadata/systemEnumerations/toJSONSchema.ts`, delete:

```ts
if (allowsUnknownYAMLValues(rule)) {
  return Type.String()
}
```

Delete the `allowsUnknownYAMLValues` helper.

- [ ] **Step 4: Update SystemEnumeration rule typing**

In `packages/core/metadata/systemEnumerations/types.ts`, replace the specialized `SystemEnumerationPropertyRule` field block so it omits only the renamed field and reintroduces it with typed values:

```ts
export type SystemEnumerationPropertyRule<T extends keyof SystemEnumerationTypeMap = keyof SystemEnumerationTypeMap> =
  T extends keyof SystemEnumerationTypeMap
    ? Omit<BasePropertyRule, "implicitValueYAML"> & {
        type: "SystemEnumeration"
        typeSE: T
        implicitValueYAML?: SystemEnumerationTypeMap[T] | string
      }
    : BasePropertyRule & {
        type: "SystemEnumeration"
        typeSE: string
      }
```

- [ ] **Step 5: Remove marker from configuration rules**

In `packages/core/metadata/appliedObjects/configuration/rules.ts`, delete both lines:

```ts
implicitValueYAML: undefined,
```

They are currently on the `configurationCompatibilityMode` and `configurationExtensionCompatibilityMode` rules.

- [ ] **Step 6: Run SystemEnumeration targeted tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/systemEnumerations/fromYAML.test.ts metadata/systemEnumerations/toYAML.test.ts metadata/systemEnumerations/toJSONSchema.test.ts metadata/appliedObjects/configuration/types.test.ts metadata/appliedObjects/configuration/convertFromXML.test.ts
```

Expected: PASS.

## Task 4: Rename Rules And Documentation

**Files:**
- Modify: `packages/core/metadata/**/rules.ts`
- Modify: `packages/core/metadata/**/*.test.ts`
- Modify: `docs/superpowers/specs/2026-06-13-implicit-value-yaml-design.md`
- Modify: active docs under `docs/superpowers/{specs,plans}` that describe the current field name.

- [ ] **Step 1: Mechanically rename rule fields**

Run:

```bash
perl -0pi -e 's/implicitValueYAML/implicitValueYAML/g; s/omitImplicitValueYAMLBySource/omitImplicitValueYAMLBySource/g' $(rg -l 'implicitValueYAML|omitImplicitValueYAMLBySource' packages/core docs/superpowers/specs/2026-06-13-implicit-value-yaml-design.md docs/superpowers/plans/2026-06-13-implicit-value-yaml.md)
```

Expected: no command output.

- [ ] **Step 2: Remove obsolete docs about the old marker**

In `docs/superpowers/specs/2026-05-31-configuration-clean-defaults-design.md` and `docs/superpowers/plans/2026-05-31-configuration-clean-defaults.md`, update references that say `implicitValueYAML: undefined` enables unknown compatibility modes. Replace them with a short historical note:

```md
The temporary `implicitValueYAML: undefined` marker for unknown compatibility modes was removed by the 2026-06-13 implicit YAML value rename. CompatibilityMode now behaves as a closed SystemEnumeration until a separate explicit feature reintroduces unknown platform values.
```

- [ ] **Step 3: Verify no old field remains in source**

Run:

```bash
rg -n 'implicitValueYAML|omitImplicitValueYAMLBySource|allowsUnknownYAMLValues|implicitValueYAML: undefined' packages/core
```

Expected: no matches. If matches remain in comments inside tests that explicitly assert old behavior is gone, rewrite the comments to avoid the old field name.

- [ ] **Step 4: Verify docs mention the old name only as migration context**

Run:

```bash
rg -n 'implicitValueYAML|omitImplicitValueYAMLBySource|implicitValueYAML: undefined' docs/superpowers
```

Expected: matches only in historical documents or in the new design/plan as migration context. Current guidance must use `implicitValueYAML`.

## Task 5: Typecheck And Test The Migration

**Files:**
- No source edits expected unless tests expose missed references.

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/orchestration/property/fromYAML.test.ts metadata/orchestration/property/toYAML.test.ts metadata/systemEnumerations/fromYAML.test.ts metadata/systemEnumerations/toYAML.test.ts metadata/systemEnumerations/toJSONSchema.test.ts metadata/appliedObjects/configuration/types.test.ts metadata/appliedObjects/configuration/convertFromXML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the full project test suite outside the sandbox if spawnSync is blocked**

Run:

```bash
pnpm test
```

Expected: PASS. If the sandbox reports `spawnSync node EPERM`, rerun the same command with elevated permissions, because the baseline showed that this is a sandbox restriction.

- [ ] **Step 3: Inspect git diff**

Run:

```bash
git diff --stat
git diff -- packages/core/metadata/orchestration/property/types.ts packages/core/metadata/orchestration/property/toYAML.ts packages/core/metadata/systemEnumerations/fromYAML.ts packages/core/metadata/systemEnumerations/toYAML.ts packages/core/metadata/systemEnumerations/toJSONSchema.ts
```

Expected: the diff contains only the rename, removal of the old open-enumeration branch, and test/doc updates. XML fixtures are unchanged.

- [ ] **Step 4: Commit implementation**

Run:

```bash
git add packages/core docs/superpowers
git commit -m "refactor!: :recycle: переименовать YAML-default в implicit"
```

Use this body:

```md
Поле rules.ts больше не означает default для импорта YAML. Оно описывает значение, подразумеваемое отсутствием YAML-ключа и пропускаемое при выгрузке.

BREAKING CHANGE: `defaultValueYAML` переименовано в `implicitValueYAML`, `omitDefaultValueYAMLBySource` переименовано в `omitImplicitValueYAMLBySource`. Маркер `implicitValueYAML: undefined` для неизвестных CompatibilityMode удалён.
```

Expected: commit succeeds on branch `codex/implicit-value-yaml`.

## Self-Review

- Spec coverage: covered rename, removal of old marker, affected orchestration, SystemEnumeration, rules, tests, and docs.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: the new names are `implicitValueYAML` and `omitImplicitValueYAMLBySource` throughout the plan.
