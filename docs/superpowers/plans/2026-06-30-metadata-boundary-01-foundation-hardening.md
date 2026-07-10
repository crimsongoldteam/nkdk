# Metadata Boundary Foundation Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исправить review findings foundation-среза и закрепить договор `register.ts`/typed builders перед дальнейшей миграцией metadata-слоёв.

**Architecture:** Builders остаются локальными для property-типа и возвращают тот же plain object `{ type, ...params }`, но проверяют лишние поля exact-типом. Runtime-регистрация живёт в соседнем `register.ts`; `types.ts` экспортирует типы, TypeBox schemas и чистые helpers без побочных регистраций.

**Tech Stack:** TypeScript 5.9, Vitest, pnpm, existing `~/metadata/*` aliases, existing metadata item/type-rule registries.

---

## Scope Check

Этот план продолжает `docs/superpowers/plans/2026-06-28-metadata-registration-foundation.md` и закрывает найденные в ревью проблемы. Он не начинает project/resource descriptor, metadata-target и dataPath работы.

## File Structure

- Create: `packages/core/metadata/commonObjects/ruleBuilder.ts`
  - Shared exact-param helper for local property-rule builders.
- Modify: `packages/core/metadata/commonObjects/xmlRoot/types.ts`
  - Use exact-param helper in `xmlRootRule(...)`.
- Modify: `packages/core/metadata/commonObjects/string/types.ts`
  - Use exact-param helper in `stringRule(...)`.
- Modify: `packages/core/metadata/commonObjects/uuid/types.ts`
  - Use direct neutral import and exact-param helper in `uuidRule(...)`.
- Modify: `packages/core/metadata/commonObjects/i8nText/types.ts`
  - Use exact-param helper in `i8nTextRule(...)`.
- Modify: `packages/core/metadata/systemEnumerations/types.ts`
  - Use exact-param helper in `systemEnumerationRule(...)`.
- Modify: `packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts`
  - Add compile-time checks for excess fields that were missed in review.
- Modify: `packages/core/metadata/appliedObjects/metadataLanguage/types.ts`
  - Use `import type` for `MetadataLanguageRules`.
- Modify: `packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts`
  - Assert every property in `MetadataLanguageRules`.
- Modify: `packages/core/metadata/importBoundaries.test.ts`
  - Add guard that `metadataLanguage/types.ts` has no runtime registration import.

## Task 0: Preflight

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `docs/superpowers/specs/2026-06-28-metadata-layer-boundary-violations-spec.md`
- Read: `docs/superpowers/plans/2026-06-28-metadata-registration-foundation.md`

- [ ] **Step 1: Check metadata knowledge**

Run:

```bash
test -f .agents/knowledge/metadata/INDEX.md && sed -n '1,260p' .agents/knowledge/metadata/INDEX.md || echo "metadata knowledge index is missing"
```

Expected in the current worktree if the knowledge index is absent:

```text
metadata knowledge index is missing
```

If the file exists, read all linked documents before editing `packages/core/metadata/**`.

- [ ] **Step 2: Confirm foundation branch state**

Run:

```bash
git status --short --branch
```

Expected: branch is the foundation branch or a new branch based on it, and the worktree has no unrelated edits.

- [ ] **Step 3: Re-read the review-sensitive section of the spec**

Run:

```bash
sed -n '35,120p' docs/superpowers/specs/2026-06-28-metadata-layer-boundary-violations-spec.md
```

Expected: output includes `Сквозной договор регистраций` and the note that builders only add fixed `type` and type admissible fields.

## Task 1: Reproduce the Builder Exactness Gap

**Files:**
- Modify: `packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts`

- [ ] **Step 1: Add failing compile-time checks**

Append these lines inside the existing `if (false)` compile-time block of `it("keeps type-specific checks local to each property type", ...)` in `packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts`:

```ts
      // @ts-expect-error string rules still must reject foreign fields when valid fields are also present.
      stringRule({ xml: "Name", typeSE: "ObjectBelonging" })

      // @ts-expect-error uuid rules do not accept system-enumeration fields.
      uuidRule({ xml: "_uuid", typeSE: "ObjectBelonging" })

      // @ts-expect-error I8nText rules do not accept string-only foreign fields from other property kinds.
      i8nTextRule({ yaml: "Синоним", typeSE: "ObjectBelonging" })
```

- [ ] **Step 2: Run TypeScript and confirm the test exposes the gap**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected before the fix: FAIL with `Unused '@ts-expect-error' directive` for `stringRule({ xml: "Name", typeSE: "ObjectBelonging" })` or another newly added excess-field check.

## Task 2: Add Exact-Param Helper for Builders

**Files:**
- Create: `packages/core/metadata/commonObjects/ruleBuilder.ts`

- [ ] **Step 1: Create the helper**

Create `packages/core/metadata/commonObjects/ruleBuilder.ts`:

```ts
export type ExactRuleParams<Allowed, Params extends Allowed> = Params &
  Record<Exclude<keyof Params, keyof Allowed>, never>

export function definePropertyRule<const Type extends string, const Params extends object>(
  type: Type,
  params: Params
): Readonly<{ type: Type } & Params> {
  return { type, ...params }
}
```

- [ ] **Step 2: Run TypeScript against the new helper**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: still FAIL from Task 1 checks because builders do not use the helper yet.

## Task 3: Update Builders to Reject Extra Fields

**Files:**
- Modify: `packages/core/metadata/commonObjects/xmlRoot/types.ts`
- Modify: `packages/core/metadata/commonObjects/string/types.ts`
- Modify: `packages/core/metadata/commonObjects/uuid/types.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/types.ts`
- Modify: `packages/core/metadata/systemEnumerations/types.ts`

- [ ] **Step 1: Update `xmlRootRule(...)`**

In `packages/core/metadata/commonObjects/xmlRoot/types.ts`, add the import:

```ts
import { definePropertyRule, type ExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
```

Replace the builder with:

```ts
export type XMLRootRuleParams = Omit<XMLRootPropertyRule, "type">

export function xmlRootRule<const Params extends XMLRootRuleParams>(
  params: ExactRuleParams<XMLRootRuleParams, Params>
): Readonly<{ type: "XMLRoot" } & Params> {
  return definePropertyRule("XMLRoot", params)
}
```

- [ ] **Step 2: Update `stringRule(...)`**

In `packages/core/metadata/commonObjects/string/types.ts`, add the helper import and use a direct neutral `BasePropertyRule` import:

```ts
import { Static, Type } from "@sinclair/typebox"
import { definePropertyRule, type ExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { BasePropertyRule } from "~/metadata/orchestration/property/types"
```

Ensure the builder block is:

```ts
export interface StringPropertyRule extends BasePropertyRule {
  type: "string"
}

export type StringRuleParams = Omit<StringPropertyRule, "type">

export function stringRule(): Readonly<{ type: "string" }>
export function stringRule<const Params extends StringRuleParams>(
  params: ExactRuleParams<StringRuleParams, Params>
): Readonly<{ type: "string" } & Params>
export function stringRule(params: StringRuleParams = {}): Readonly<{ type: "string" } & StringRuleParams> {
  return definePropertyRule("string", params)
}
```

- [ ] **Step 3: Update `uuidRule(...)`**

In `packages/core/metadata/commonObjects/uuid/types.ts`, use only neutral direct imports:

```ts
import { definePropertyRule, type ExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

export interface UuidPropertyRule extends BasePropertyRule {
  type: "uuid"
}

export type UuidRuleParams = Omit<UuidPropertyRule, "type">

export function uuidRule(): Readonly<{ type: "uuid" }>
export function uuidRule<const Params extends UuidRuleParams>(
  params: ExactRuleParams<UuidRuleParams, Params>
): Readonly<{ type: "uuid" } & Params>
export function uuidRule(params: UuidRuleParams = {}): Readonly<{ type: "uuid" } & UuidRuleParams> {
  return definePropertyRule("uuid", params)
}
```

- [ ] **Step 4: Update `i8nTextRule(...)`**

In `packages/core/metadata/commonObjects/i8nText/types.ts`, add:

```ts
import { definePropertyRule, type ExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
```

Ensure the builder block is:

```ts
export type I8nTextRuleParams = Omit<I8nTextPropertyRule, "type">

export function i8nTextRule<const Params extends I8nTextRuleParams>(
  params: ExactRuleParams<I8nTextRuleParams, Params>
): Readonly<{ type: "I8nText" } & Params> {
  return definePropertyRule("I8nText", params)
}
```

- [ ] **Step 5: Update `systemEnumerationRule(...)`**

In `packages/core/metadata/systemEnumerations/types.ts`, add:

```ts
import { definePropertyRule, type ExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
```

Ensure the builder block is:

```ts
export type SystemEnumerationRuleParams = Omit<SystemEnumerationPropertyRule, "type">

export function systemEnumerationRule<const Params extends SystemEnumerationRuleParams>(
  params: ExactRuleParams<SystemEnumerationRuleParams, Params>
): Readonly<{ type: "SystemEnumeration" } & Params> {
  return definePropertyRule("SystemEnumeration", params)
}
```

- [ ] **Step 6: Verify TypeScript catches and accepts the intended cases**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS. The `@ts-expect-error` lines are now used, and valid builder calls still compile.

## Task 4: Complete MetadataLanguage Rule Coverage

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataLanguage/types.ts`

- [ ] **Step 1: Make `MetadataLanguageRules` import type-only in `types.ts`**

In `packages/core/metadata/appliedObjects/metadataLanguage/types.ts`, replace:

```ts
import { MetadataLanguageRules } from "./rules"
```

with:

```ts
import type { MetadataLanguageRules } from "./rules"
```

Keep these exports:

```ts
export type MetadataLanguage = MetadataTypeByRule<typeof MetadataLanguageRules>
export type MetadataLanguageYAML = YAMLTypeByRule<typeof MetadataLanguageRules>
```

- [ ] **Step 2: Assert every MetadataLanguage property**

In `packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts`, replace the rule shape test with:

```ts
import { describe, expect, it } from "vitest"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { MetadataLanguageRules } from "./rules"
import "./register"

describe("MetadataLanguageRules", () => {
  it("declares every property through local builders without changing behavior", () => {
    expect(MetadataLanguageRules).toMatchObject({
      itemType: "MetadataLanguage",
      itemTypePrefix: "Язык",
      xmlDir: "Languages",
    })

    expect(MetadataLanguageRules.properties).toEqual({
      xmlRoot: {
        type: "XMLRoot",
        container: "Language",
        rootAttributes: V8_MDCLASSES_ROOT,
        forReferenceOnly: true,
        toYAML: false,
        fromYAML: false,
      },
      uuid: {
        type: "uuid",
        xml: "_uuid",
        forReferenceOnly: true,
        xmlParents: [],
      },
      name: {
        type: "string",
        xmlParents: ["Properties"],
        required: true,
        defaultValue: expect.any(Function),
      },
      synonym: {
        type: "I8nText",
        yaml: "Синоним",
        xmlParents: ["Properties"],
        defaultValueXMLRaw: "",
      },
      comment: {
        type: "string",
        yaml: "Комментарий",
        xmlParents: ["Properties"],
        defaultValueXMLRaw: "",
      },
      languageCode: {
        type: "string",
        yaml: "КодЯзыка",
        xml: "LanguageCode",
        required: true,
        xmlParents: ["Properties"],
      },
      objectBelonging: {
        type: "SystemEnumeration",
        yaml: "ПринадлежностьОбъекта",
        xml: "ObjectBelonging",
        typeSE: "ObjectBelonging",
        xmlParents: ["Properties"],
        toYAML: false,
        fromYAML: false,
        implicitValueYAML: "Native",
      },
      extendedConfigurationObject: {
        type: "string",
        xml: "ExtendedConfigurationObject",
        xmlParents: ["Properties"],
        runtimeOnly: true,
      },
    })

    expect(MetadataLanguageRules.properties.name.defaultValue({ name: "Русский" })).toBe("Русский")
  })

  it("registers MetadataLanguage through register.ts", () => {
    expect(getTypeRule("MetadataLanguage", "exportToJSONSchema")).toBeTypeOf("function")
    expect(getTypeRule("MetadataLanguage", "importFromYAML")).toBeTypeOf("function")
    expect(getTypeRule("MetadataLanguage", "exportToYAML")).toBeTypeOf("function")
    expect(getTypeRule("MetadataLanguage", "importFromXML")).toBeTypeOf("function")
    expect(getTypeRule("MetadataLanguage", "exportToXML")).toBeTypeOf("function")
  })
})
```

- [ ] **Step 3: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts --no-isolate
```

Expected: PASS.

## Task 5: Add Boundary Guard for Runtime Registration Location

**Files:**
- Modify: `packages/core/metadata/importBoundaries.test.ts`

- [ ] **Step 1: Add test that `metadataLanguage/types.ts` has no registration side effect**

Append this test as the last test inside `describe("metadata import boundaries", ...)`:

```ts
  it("MetadataLanguage runtime registration lives in register.ts, not types.ts", () => {
    const typesSource = readFileSync(join(METADATA_DIR, "appliedObjects", "metadataLanguage", "types.ts"), "utf-8")
    const registerSource = readFileSync(join(METADATA_DIR, "appliedObjects", "metadataLanguage", "register.ts"), "utf-8")

    expect(typesSource).not.toContain("registerMetadataItemRule")
    expect(typesSource).toContain("import type { MetadataLanguageRules }")
    expect(registerSource).toContain("registerMetadataItemRule")
    expect(registerSource).toContain('propertyType: "MetadataLanguage"')
  })
```

- [ ] **Step 2: Run boundary tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS.

## Task 6: Commit and Verify

**Files:**
- All files changed in this plan.

- [ ] **Step 1: Run focused verification**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts packages/core/metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 2: Run TypeScript**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Run package and repository tests**

Run:

```bash
pnpm --filter @nakidka/core test
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```bash
git add packages/core/metadata/commonObjects/ruleBuilder.ts \
  packages/core/metadata/commonObjects/xmlRoot/types.ts \
  packages/core/metadata/commonObjects/string/types.ts \
  packages/core/metadata/commonObjects/uuid/types.ts \
  packages/core/metadata/commonObjects/i8nText/types.ts \
  packages/core/metadata/systemEnumerations/types.ts \
  packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts \
  packages/core/metadata/appliedObjects/metadataLanguage/types.ts \
  packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts \
  packages/core/metadata/importBoundaries.test.ts
git commit -m "refactor: :recycle: укрепить builders metadata rules"
```

Expected: commit succeeds.
