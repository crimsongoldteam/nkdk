# TypeDescription System Enumeration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support known system enumerations as `TypeDescription` value types in XML and YAML.

**Architecture:** Keep `TypeDescriptionRules` as the registry for explicit platform types, and add a narrow helper fallback for generated system enumerations. XML export uses the fallback only when generated `*ToYAML`/`*FromYAML` runtime maps prove the system enumeration exists; YAML import/export uses the explicit `СистемноеПеречисление.<РусскоеИмя>` syntax and fails when a Russian name cannot be resolved.

**Tech Stack:** TypeScript, Vitest, TypeBox metadata rules, generated system enumeration maps, `TypeDescription` import/export helpers.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/typeDescription/helper.ts`
  - Owns lookup helpers for explicit type rules and system-enumeration `TypeDescription` fallback.
- Modify `packages/core/metadata/commonObjects/typeDescription/toXML.ts`
  - Exports known system enumeration types as `v8:<SystemEnumerationName>`.
- Modify `packages/core/metadata/commonObjects/typeDescription/toYAML.ts`
  - Exports known system enumeration types as `СистемноеПеречисление.<РусскоеИмя>`.
- Modify `packages/core/metadata/commonObjects/typeDescription/fromYAML.ts`
  - Imports `СистемноеПеречисление.<РусскоеИмя>` back to the technical system enumeration name.
- Modify tests:
  - `packages/core/metadata/commonObjects/typeDescription/toXML.test.ts`
  - `packages/core/metadata/commonObjects/typeDescription/toYAML.test.ts`
  - `packages/core/metadata/commonObjects/typeDescription/fromYAML.test.ts`

Before editing metadata files, confirm these docs were read in this session:

- `.agents/knowledge/metadata/INDEX.md`
- `.agents/knowledge/metadata/sources-of-truth.md`
- `.agents/knowledge/metadata/round-trip-cycle.md`
- `.agents/knowledge/metadata/metadata-item-implementation.md`
- `.agents/knowledge/metadata/registries.md`

## Task 1: XML Export Fallback For Known System Enumerations

**Files:**
- Modify: `packages/core/metadata/commonObjects/typeDescription/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/helper.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/toXML.ts`

- [ ] **Step 1: Add failing XML export tests**

Append these cases inside `describe("exportTypeDescriptionToXML", () => { ... })` in `toXML.test.ts`:

```ts
  it("should export known system enumeration type to XML with v8 prefix", () => {
    const resultXml = exportTypeDescriptionToXML(mockContext, mockRule, { type: ["FillChecking"] })

    const result = xmlExport({ TypeDescription: resultXml }, false)

    expect(result).toEqual("<TypeDescription>\n\t<v8:Type>v8:FillChecking</v8:Type>\n</TypeDescription>")
  })

  it("should throw on unknown non-enumeration type during XML export", () => {
    expect(() =>
      exportTypeDescriptionToXML(mockContext, mockRule, { type: ["DefinitelyUnknownType"] })
    ).toThrow("Type DefinitelyUnknownType not found in TypeDescriptionRules")
  })
```

- [ ] **Step 2: Run XML export tests and verify RED**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/toXML.test.ts
```

Expected: the `FillChecking` test fails with `Type FillChecking not found in TypeDescriptionRules`; the unknown type test passes.

- [ ] **Step 3: Add helper functions for system enumeration lookup**

In `helper.ts`, replace the file with:

```ts
import * as SE from "~/metadata/systemEnumerations/types"
import { TypeDescriptionRule, TypeDescriptionRules } from "./types"

const systemEnumerationPrefix = "СистемноеПеречисление."
const fromYAMLSuffix = "FromYAML"
const toYAMLSuffix = "ToYAML"

const isRecord = (value: unknown): value is Record<string, string> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const getSystemEnumerationFromYAMLMap = (type: string): Record<string, string> | undefined => {
  const map = (SE as Record<string, unknown>)[`${type}${fromYAMLSuffix}`]
  return isRecord(map) ? map : undefined
}

const getSystemEnumerationToYAMLMap = (type: string): Record<string, string> | undefined => {
  const map = (SE as Record<string, unknown>)[`${type}${toYAMLSuffix}`]
  return isRecord(map) ? map : undefined
}

export const getTypeDescriptionRule = (type: string): TypeDescriptionRule | undefined => {
  return TypeDescriptionRules[type]
}

export const getSystemEnumerationTypeDescriptionRule = (type: string): TypeDescriptionRule | undefined => {
  if (!isKnownSystemEnumerationType(type)) return undefined

  return {
    enterprise: type,
    prefix: "v8",
  }
}

export const getTypeDescriptionRuleOrSystemEnumeration = (type: string): TypeDescriptionRule | undefined => {
  return getTypeDescriptionRule(type) ?? getSystemEnumerationTypeDescriptionRule(type)
}

export const isKnownSystemEnumerationType = (type: string): boolean => {
  return getSystemEnumerationFromYAMLMap(type) !== undefined && getSystemEnumerationToYAMLMap(type) !== undefined
}

export const getSystemEnumerationYAMLType = (type: string): string | undefined => {
  if (!isKnownSystemEnumerationType(type)) return undefined

  const fromYAML = getSystemEnumerationFromYAMLMap(type)
  if (fromYAML === undefined) return undefined

  const russianName = Object.keys(fromYAML)[0]
  if (russianName === undefined || russianName.trim() === "") {
    return undefined
  }

  return `${systemEnumerationPrefix}${russianName}`
}

export const getSystemEnumerationTypeFromYAML = (type: string): string | undefined => {
  if (!type.startsWith(systemEnumerationPrefix)) return undefined

  const russianName = type.substring(systemEnumerationPrefix.length)
  if (russianName.trim() === "") return undefined

  for (const [key, value] of Object.entries(SE)) {
    if (!key.endsWith(fromYAMLSuffix)) continue
    if (!isRecord(value)) continue
    if (!Object.prototype.hasOwnProperty.call(value, russianName)) continue

    const typeName = key.substring(0, key.length - fromYAMLSuffix.length)
    if (isKnownSystemEnumerationType(typeName)) return typeName
  }

  return undefined
}

export const getTypeFromYAML = (enterprise: string): string | undefined => {
  const systemEnumerationType = getSystemEnumerationTypeFromYAML(enterprise)
  if (systemEnumerationType !== undefined) return systemEnumerationType

  for (const [type, rule] of Object.entries(TypeDescriptionRules)) {
    if (rule.enterprise === enterprise) {
      return type
    }
  }
  return undefined
}
```

- [ ] **Step 4: Use fallback in XML export**

In `toXML.ts`, change the import:

```ts
import { getTypeDescriptionRuleOrSystemEnumeration } from "./helper"
```

Then replace:

```ts
    const rule = getTypeDescriptionRule(baseType)
```

with:

```ts
    const rule = getTypeDescriptionRuleOrSystemEnumeration(baseType)
```

- [ ] **Step 5: Run XML export tests and verify GREEN**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/toXML.test.ts
```

Expected: all tests in `toXML.test.ts` pass.

- [ ] **Step 6: Commit Task 1**

```bash
git add packages/core/metadata/commonObjects/typeDescription/helper.ts packages/core/metadata/commonObjects/typeDescription/toXML.ts packages/core/metadata/commonObjects/typeDescription/toXML.test.ts
git commit -m "fix: :bug: экспортировать системные перечисления TypeDescription"
```

## Task 2: YAML Import And Export For System Enumeration Types

**Files:**
- Modify: `packages/core/metadata/commonObjects/typeDescription/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/fromYAML.ts`

- [ ] **Step 1: Add failing YAML export tests**

Append these cases inside `describe("exportTypeDescriptionToYAML", () => { ... })` in `toYAML.test.ts`:

```ts
  it("should export known system enumeration type to explicit YAML form", () => {
    const result = exportTypeDescriptionToYAML(mockContext, mockRule, { type: ["FillChecking"] })

    expect(result).toEqual("СистемноеПеречисление.ПроверкаЗаполнения")
  })

  it("should throw on unknown non-enumeration type during YAML export", () => {
    expect(() =>
      exportTypeDescriptionToYAML(mockContext, mockRule, { type: ["DefinitelyUnknownType"] })
    ).toThrow("Type DefinitelyUnknownType not found in TypeDescriptionRules")
  })
```

- [ ] **Step 2: Add failing YAML import test**

Append this case inside `describe("importTypeDescriptionFromYAML", () => { ... })` in `fromYAML.test.ts`:

```ts
  it("should import known system enumeration type from explicit YAML form", () => {
    const result = importTypeDescriptionFromYAML(
      mockContext,
      mockRule,
      "СистемноеПеречисление.ПроверкаЗаполнения"
    )

    expect(result).toEqual({ type: ["FillChecking"] })
  })
```

- [ ] **Step 3: Run YAML tests and verify RED**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/toYAML.test.ts metadata/commonObjects/typeDescription/fromYAML.test.ts
```

Expected: YAML export for `FillChecking` fails with `Type FillChecking not found in TypeDescriptionRules`; YAML import returns the original string instead of `FillChecking`.

- [ ] **Step 4: Use system enumeration YAML helper in export**

In `toYAML.ts`, change the import:

```ts
import { getSystemEnumerationYAMLType, getTypeDescriptionRule } from "./helper"
```

Then, in `formatSingleType`, after:

```ts
  const rule = getTypeDescriptionRule(baseType)
```

add:

```ts
  if (!rule) {
    const systemEnumerationYAMLType = getSystemEnumerationYAMLType(baseType)
    if (systemEnumerationYAMLType !== undefined) {
      if (isComplex) {
        return `${systemEnumerationYAMLType}.${detailType}`
      }

      return systemEnumerationYAMLType
    }

    throw new Error(`Type ${baseType} not found in TypeDescriptionRules`)
  }
```

Then remove the old line:

```ts
  if (!rule) throw new Error(`Type ${baseType} not found in TypeDescriptionRules`)
```

- [ ] **Step 5: Use existing YAML lookup path for import**

No code change should be needed in `fromYAML.ts` if Task 1 updated `getTypeFromYAML` as specified. If the RED test still fails, inspect that `fromYAML.ts` calls `getTypeFromYAML(baseType)` after parsing and keep the import path unchanged:

```ts
    const metadataType = getTypeFromYAML(baseType)
    if (metadataType) {
      if (isComplex) {
        types.push(`${metadataType}.${detailType}`)
      } else {
        types.push(metadataType)
      }
      continue
    }
```

- [ ] **Step 6: Run YAML tests and verify GREEN**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/toYAML.test.ts metadata/commonObjects/typeDescription/fromYAML.test.ts
```

Expected: all tests in both files pass.

- [ ] **Step 7: Commit Task 2**

```bash
git add packages/core/metadata/commonObjects/typeDescription/helper.ts packages/core/metadata/commonObjects/typeDescription/toYAML.ts packages/core/metadata/commonObjects/typeDescription/fromYAML.ts packages/core/metadata/commonObjects/typeDescription/toYAML.test.ts packages/core/metadata/commonObjects/typeDescription/fromYAML.test.ts
git commit -m "fix: :bug: поддержать YAML типов системных перечислений"
```

## Task 3: Integrated Verification

**Files:**
- No planned source changes.

- [ ] **Step 1: Run focused TypeDescription tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription
```

Expected: all `typeDescription` tests pass.

- [ ] **Step 2: Run focused form attribute tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/formAttribute
```

Expected: all `formAttribute` tests pass; this protects the form column/type path that exposed the issue.

- [ ] **Step 3: Run full project tests**

Run from the worktree root:

```bash
pnpm test
```

Expected: all package test suites pass.

- [ ] **Step 4: Run round-trip triage**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/acc ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5
```

Expected: the run no longer stops with `Type FillChecking not found in TypeDescriptionRules`. If it stops on a new issue, record the first new error and do not broaden the fix without a new decision.

- [ ] **Step 5: Check the original blocked form**

Run:

```bash
git -C /Users/nikita/git/round-trip-source -c core.quotePath=false diff -- acc/DataProcessors/СкрытиеКонфиденциальнойИнформации/Forms/Форма/Ext/Form.xml
```

Expected: no diff caused by losing or rewriting `<v8:Type>v8:FillChecking</v8:Type>`.

- [ ] **Step 6: Commit verification note only if files changed**

If verification required no source changes, do not create a commit. If a small test or source adjustment was needed, commit it:

```bash
git status --short
git add <changed-files>
git commit -m "test: :white_check_mark: проверить системные перечисления TypeDescription"
```

## Self-Review

- Spec coverage: XML fallback, YAML explicit form, unknown type failures, and no arbitrary unknown `v8:*` fallback are covered by Tasks 1 and 2.
- Verification coverage: focused `typeDescription`, `formAttribute`, full `pnpm test`, and round-trip triage are covered by Task 3.
- Scope check: the plan does not change generated system enumeration files and does not change `SystemEnumeration` property value YAML.
