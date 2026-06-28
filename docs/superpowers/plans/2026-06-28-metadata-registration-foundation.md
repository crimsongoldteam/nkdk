# Metadata Registration Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first safe slice of the metadata layer-boundary refactor: explicit `register.ts` for `MetadataLanguage` plus local typed property-rule builders for the property types used by its `rules.ts`.

**Architecture:** This plan does not remove the central TypeScript registries yet. It preserves runtime behavior while moving one metadata object to the intended declaration style: `rules.ts` stays declarative, `types.ts` exports only types, and `register.ts` owns runtime registration. Local builders return the same plain rule objects as before, but move field admissibility checks next to each property type.

**Tech Stack:** TypeScript 5.9, Vitest, pnpm, existing `~/metadata/*` path aliases, existing metadata orchestration registries.

---

## Scope Check

The full spec covers several connected subsystems: orchestration registries, project resources, applied-object sync, metadata-target resolution, dataPath validation, project metadata resolution, and form validation. This plan intentionally covers only the first independent slice:

- the `register.ts` lifecycle for one object;
- local builders for `XMLRoot`, `uuid`, `string`, `I8nText`, and `SystemEnumeration`;
- conversion of `MetadataLanguageRules` to those builders.

Do not start project/resource descriptor work in this plan. That belongs in the next plan after this foundation is merged or explicitly accepted.

## File Structure

- Modify: `packages/core/metadata/commonObjects/xmlRoot/types.ts`
  - Owns the `XMLRootPropertyRule` type and the new `xmlRootRule(...)` builder.
- Modify: `packages/core/metadata/commonObjects/string/types.ts`
  - Owns the new `StringPropertyRule` type and `stringRule(...)` builder.
- Create: `packages/core/metadata/commonObjects/uuid/types.ts`
  - Owns the new `UuidPropertyRule` type and `uuidRule(...)` builder.
- Modify: `packages/core/metadata/commonObjects/uuid/rule.ts`
  - Keeps the existing `uuidPropertyRule` export, implemented through `uuidRule(...)`.
- Modify: `packages/core/metadata/commonObjects/i8nText/types.ts`
  - Owns the new `i8nTextRule(...)` builder.
- Modify: `packages/core/metadata/systemEnumerations/types.ts`
  - Owns the new `systemEnumerationRule(...)` builder.
- Create: `packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts`
  - Verifies builders return unchanged object shapes and enforce type-specific fields through `@ts-expect-error`.
- Modify: `packages/core/metadata/appliedObjects/metadataLanguage/rules.ts`
  - Uses builders for every property declaration.
- Modify: `packages/core/metadata/appliedObjects/metadataLanguage/types.ts`
  - Exports only `MetadataLanguage` and `MetadataLanguageYAML` types.
- Create: `packages/core/metadata/appliedObjects/metadataLanguage/register.ts`
  - Owns `registerMetadataItemRule(...)` for `MetadataLanguage`.
- Modify: `packages/core/metadata/appliedObjects/metadataLanguage/index.ts`
  - Imports `./register` for side effects and re-exports `rules.ts` / `types.ts`.
- Create: `packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts`
  - Verifies the converted rules keep the same values and that `register.ts` registers the metadata item property type.

## Task 0: Preflight

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `docs/superpowers/specs/2026-06-28-metadata-layer-boundary-violations-spec.md`

- [ ] **Step 1: Check the metadata knowledge index**

Run:

```bash
test -f .agents/knowledge/metadata/INDEX.md && sed -n '1,220p' .agents/knowledge/metadata/INDEX.md || echo "metadata knowledge index is missing"
```

Expected in the current worktree:

```text
metadata knowledge index is missing
```

If the file exists in a later branch, read it fully and follow the referenced metadata documents before editing `packages/core/metadata/**`.

- [ ] **Step 2: Re-read the accepted spec section for this slice**

Run:

```bash
sed -n '1,150p' docs/superpowers/specs/2026-06-28-metadata-layer-boundary-violations-spec.md
```

Expected: the output includes `Сквозной договор регистраций`, `Сквозные связи этапов`, and the `MetadataLanguage` trial-object requirement.

## Task 1: Add Local Property-Rule Builders

**Files:**
- Modify: `packages/core/metadata/commonObjects/xmlRoot/types.ts`
- Modify: `packages/core/metadata/commonObjects/string/types.ts`
- Create: `packages/core/metadata/commonObjects/uuid/types.ts`
- Modify: `packages/core/metadata/commonObjects/uuid/rule.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/types.ts`
- Modify: `packages/core/metadata/systemEnumerations/types.ts`
- Test: `packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts`

- [ ] **Step 1: Write the failing builder test**

Create `packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"

describe("property rule builders", () => {
  it("return the same plain object shape as inline rule declarations", () => {
    expect(
      xmlRootRule({
        container: "Language",
        rootAttributes: { xmlns: "urn:test" },
        forReferenceOnly: true,
        toYAML: false,
        fromYAML: false,
      })
    ).toEqual({
      type: "XMLRoot",
      container: "Language",
      rootAttributes: { xmlns: "urn:test" },
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    })

    expect(
      uuidRule({
        xml: "_uuid",
        forReferenceOnly: true,
        toYAML: false,
        fromYAML: false,
      })
    ).toEqual({
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    })

    expect(
      stringRule({
        yaml: "Комментарий",
        xmlParents: ["Properties"],
        defaultValueXMLRaw: "",
      })
    ).toEqual({
      type: "string",
      yaml: "Комментарий",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    })

    expect(
      i8nTextRule({
        yaml: "Синоним",
        xmlParents: ["Properties"],
        defaultValueXMLRaw: "",
      })
    ).toEqual({
      type: "I8nText",
      yaml: "Синоним",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    })

    expect(
      systemEnumerationRule({
        yaml: "ПринадлежностьОбъекта",
        xml: "ObjectBelonging",
        typeSE: "ObjectBelonging",
        xmlParents: ["Properties"],
        toYAML: false,
        fromYAML: false,
        implicitValueYAML: "Native",
      })
    ).toEqual({
      type: "SystemEnumeration",
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      typeSE: "ObjectBelonging",
      xmlParents: ["Properties"],
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    })
  })

  it("keeps type-specific checks local to each property type", () => {
    if (false) {
      // @ts-expect-error string rules do not accept system-enumeration fields.
      stringRule({ typeSE: "ObjectBelonging" })

      // @ts-expect-error system enumeration rules require typeSE.
      systemEnumerationRule({ xml: "ObjectBelonging" })

      // @ts-expect-error XMLRoot rules require rootAttributes.
      xmlRootRule({ container: "Language", forReferenceOnly: true })
    }

    expect(true).toBe(true)
  })
})
```

- [ ] **Step 2: Run the new test and confirm it fails because builders are missing**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts --no-isolate
```

Expected: FAIL with errors like `No matching export` for `stringRule`, `uuidRule`, `xmlRootRule`, `i8nTextRule`, or `systemEnumerationRule`.

- [ ] **Step 3: Add `xmlRootRule(...)`**

Append this code to `packages/core/metadata/commonObjects/xmlRoot/types.ts` after `XMLRootPropertyRule`:

```ts
export type XMLRootRuleParams = Omit<XMLRootPropertyRule, "type">

export function xmlRootRule<const Params extends XMLRootRuleParams>(
  params: Params
): Readonly<{ type: "XMLRoot" } & Params> {
  return { type: "XMLRoot", ...params }
}
```

- [ ] **Step 4: Add `StringPropertyRule` and `stringRule(...)`**

Replace `packages/core/metadata/commonObjects/string/types.ts` with:

```ts
import { Static, Type } from "@sinclair/typebox"
import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

export const StringJSONSchema = Type.String()

export type StringYAML = Static<typeof StringJSONSchema>

export interface StringPropertyRule extends BasePropertyRule {
  type: "string"
}

export type StringRuleParams = Omit<StringPropertyRule, "type">

export function stringRule<const Params extends StringRuleParams>(
  params: Params = {} as Params
): Readonly<{ type: "string" } & Params> {
  return { type: "string", ...params }
}
```

- [ ] **Step 5: Add `UuidPropertyRule` and `uuidRule(...)`**

Create `packages/core/metadata/commonObjects/uuid/types.ts`:

```ts
import type { BasePropertyRule } from "~/metadata/orchestration"

export interface UuidPropertyRule extends BasePropertyRule {
  type: "uuid"
}

export type UuidRuleParams = Omit<UuidPropertyRule, "type">

export function uuidRule<const Params extends UuidRuleParams>(
  params: Params = {} as Params
): Readonly<{ type: "uuid" } & Params> {
  return { type: "uuid", ...params }
}
```

- [ ] **Step 6: Keep the existing `uuidPropertyRule` export through the builder**

Replace `packages/core/metadata/commonObjects/uuid/rule.ts` with:

```ts
import { uuidRule } from "./types"

export const uuidPropertyRule = uuidRule({
  xml: "_uuid",
  forReferenceOnly: true,
  toYAML: false,
  fromYAML: false,
})
```

- [ ] **Step 7: Add `i8nTextRule(...)`**

Append this code to `packages/core/metadata/commonObjects/i8nText/types.ts` after `I8nTextPropertyRule`:

```ts
export type I8nTextRuleParams = Omit<I8nTextPropertyRule, "type">

export function i8nTextRule<const Params extends I8nTextRuleParams>(
  params: Params = {} as Params
): Readonly<{ type: "I8nText" } & Params> {
  return { type: "I8nText", ...params }
}
```

- [ ] **Step 8: Add `systemEnumerationRule(...)`**

Append this code to `packages/core/metadata/systemEnumerations/types.ts` after `SystemEnumerationPropertyRule`:

```ts
export type SystemEnumerationRuleParams<T extends keyof SystemEnumerationTypeMap> = Omit<
  SystemEnumerationPropertyRule<T>,
  "type"
>

export function systemEnumerationRule<
  const T extends keyof SystemEnumerationTypeMap,
  const Params extends SystemEnumerationRuleParams<T>,
>(params: Params & { typeSE: T }): Readonly<{ type: "SystemEnumeration" } & Params & { typeSE: T }> {
  return { type: "SystemEnumeration", ...params }
}
```

- [ ] **Step 9: Run the builder test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 10: Run type-check for `@ts-expect-error` assertions**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS. If an `@ts-expect-error` is reported as unused, tighten the builder parameter type before continuing.

- [ ] **Step 11: Commit the builders**

Run:

```bash
git add packages/core/metadata/commonObjects/xmlRoot/types.ts \
  packages/core/metadata/commonObjects/string/types.ts \
  packages/core/metadata/commonObjects/uuid/types.ts \
  packages/core/metadata/commonObjects/uuid/rule.ts \
  packages/core/metadata/commonObjects/i8nText/types.ts \
  packages/core/metadata/systemEnumerations/types.ts \
  packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts
git commit -m "feat: :sparkles: добавить строители property-rule"
```

Expected: commit succeeds.

## Task 2: Move `MetadataLanguage` Runtime Registration to `register.ts`

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataLanguage/types.ts`
- Create: `packages/core/metadata/appliedObjects/metadataLanguage/register.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataLanguage/index.ts`
- Test: `packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts`

- [ ] **Step 1: Write the failing registration test**

Create `packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import "./register"
import { MetadataLanguageRules } from "./rules"

describe("MetadataLanguageRules", () => {
  it("registers MetadataLanguage through register.ts", () => {
    expect(getTypeRule("MetadataLanguage", "exportToJSONSchema")).toEqual(expect.any(Function))
  })

  it("keeps the same property declarations after moving registration", () => {
    expect(MetadataLanguageRules.properties.xmlRoot).toEqual({
      type: "XMLRoot",
      container: "Language",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    })

    expect(MetadataLanguageRules.properties.uuid).toEqual({
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    })

    expect(MetadataLanguageRules.properties.name).toMatchObject({
      type: "string",
      xmlParents: ["Properties"],
      required: true,
    })

    expect(MetadataLanguageRules.properties.synonym).toEqual({
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    })

    expect(MetadataLanguageRules.properties.objectBelonging).toEqual({
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: ["Properties"],
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    })
  })
})
```

- [ ] **Step 2: Run the registration test and confirm it fails because `register.ts` is missing**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts --no-isolate
```

Expected: FAIL with `Cannot find module './register'`.

- [ ] **Step 3: Move runtime registration out of `types.ts`**

Replace `packages/core/metadata/appliedObjects/metadataLanguage/types.ts` with:

```ts
import type { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import type { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataLanguageRules } from "./rules"

export type MetadataLanguage = MetadataTypeByRule<typeof MetadataLanguageRules>
export type MetadataLanguageYAML = YAMLTypeByRule<typeof MetadataLanguageRules>
```

- [ ] **Step 4: Create `register.ts` for `MetadataLanguage`**

Create `packages/core/metadata/appliedObjects/metadataLanguage/register.ts`:

```ts
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataLanguageRules } from "./rules"

registerMetadataItemRule({
  propertyType: "MetadataLanguage",
  itemRule: MetadataLanguageRules,
})
```

- [ ] **Step 5: Make the object entrypoint import `register.ts` explicitly**

Replace `packages/core/metadata/appliedObjects/metadataLanguage/index.ts` with:

```ts
import "./register"

export * from "./types"
export * from "./rules"
```

- [ ] **Step 6: Run the registration test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 7: Verify `types.ts` no longer performs runtime registration**

Run:

```bash
rg "registerMetadataItemRule" packages/core/metadata/appliedObjects/metadataLanguage/types.ts
```

Expected: no output and exit code `1`.

- [ ] **Step 8: Commit the registration move**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataLanguage/types.ts \
  packages/core/metadata/appliedObjects/metadataLanguage/register.ts \
  packages/core/metadata/appliedObjects/metadataLanguage/index.ts \
  packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts
git commit -m "refactor: :recycle: перенести регистрацию MetadataLanguage"
```

Expected: commit succeeds.

## Task 3: Convert `MetadataLanguageRules` to Builders

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataLanguage/rules.ts`
- Test: `packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts`

- [ ] **Step 1: Replace inline property objects with builders**

Replace `packages/core/metadata/appliedObjects/metadataLanguage/rules.ts` with:

```ts
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"

const properties = ["Properties"]

export const MetadataLanguageRules = {
  itemType: "MetadataLanguage",
  itemTypePrefix: "Язык",
  xmlDir: "Languages",
  properties: {
    xmlRoot: xmlRootRule({
      container: "Language",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    uuid: uuidRule({
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    }),
    name: stringRule({
      xmlParents: properties,
      required: true,
      defaultValue: ({ name }: { name?: string }) => name,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    languageCode: stringRule({
      yaml: "КодЯзыка",
      xml: "LanguageCode",
      required: true,
      xmlParents: properties,
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    }),
    extendedConfigurationObject: stringRule({
      xml: "ExtendedConfigurationObject",
      xmlParents: properties,
      runtimeOnly: true,
    }),
  },
} as const satisfies MetadataItemRule
```

- [ ] **Step 2: Run the `MetadataLanguage` rules test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 3: Run the builder test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 4: Run TypeScript type-check**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit the `MetadataLanguageRules` conversion**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataLanguage/rules.ts \
  packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts
git commit -m "refactor: :recycle: перевести MetadataLanguage на builders"
```

Expected: commit succeeds.

## Task 4: Targeted Regression Checks

**Files:**
- Read: `packages/core/metadata/appliedObjects/__tests__/yamlFixtures.ts`
- Read: `packages/core/metadata/validation/schemaRegistry.test.ts`

- [ ] **Step 1: Run tests that directly mention `MetadataLanguage`**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts \
  packages/core/metadata/validation/schemaRegistry.test.ts \
  --no-isolate
```

Expected: PASS.

- [ ] **Step 2: Run the two new tests together**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts \
  packages/core/metadata/appliedObjects/metadataLanguage/rules.test.ts \
  --no-isolate
```

Expected: PASS.

- [ ] **Step 3: Run package-level type-check**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Run the core test package**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS.

- [ ] **Step 5: Run the full monorepo test command before closing the slice**

Run:

```bash
pnpm test
```

Expected: PASS.

## Task 5: Post-Implementation Boundary Check

**Files:**
- Read: `packages/core/metadata/appliedObjects/metadataLanguage/types.ts`
- Read: `packages/core/metadata/appliedObjects/metadataLanguage/register.ts`
- Read: `packages/core/metadata/appliedObjects/metadataLanguage/rules.ts`
- Read: `packages/core/metadata/commonObjects/propertyRuleBuilders.test.ts`

- [ ] **Step 1: Check that `types.ts` has no runtime registration**

Run:

```bash
rg "registerMetadataItemRule|registerTypeRule" packages/core/metadata/appliedObjects/metadataLanguage/types.ts
```

Expected: no output and exit code `1`.

- [ ] **Step 2: Check that `rules.ts` has no runtime registration**

Run:

```bash
rg "registerMetadataItemRule|registerTypeRule" packages/core/metadata/appliedObjects/metadataLanguage/rules.ts
```

Expected: no output and exit code `1`.

- [ ] **Step 3: Check that `register.ts` owns runtime registration**

Run:

```bash
sed -n '1,80p' packages/core/metadata/appliedObjects/metadataLanguage/register.ts
```

Expected:

```ts
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataLanguageRules } from "./rules"

registerMetadataItemRule({
  propertyType: "MetadataLanguage",
  itemRule: MetadataLanguageRules,
})
```

- [ ] **Step 4: Check the worktree**

Run:

```bash
git status --short
```

Expected: clean worktree after the task commits.

## Notes for the Next Plan

After this slice passes, write a separate plan for the next dependency layer:

- project/resource descriptor on top of `ruleResources.ts`;
- migration of the objects needed by `metadata/project` into neighboring `register.ts` files;
- schema/project/path registrations without introducing a second folder-resource model.

Do not delete `MetadataItemTypeRegistry` or `PropertyTypeRegistry` in this slice. The accepted spec makes that a final cleanup after direct consumers have moved.
