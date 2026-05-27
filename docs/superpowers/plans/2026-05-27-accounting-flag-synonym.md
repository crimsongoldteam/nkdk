# Accounting Flag Synonym Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `Synonym` for `AccountingFlag` and `ExtDimensionAccountingFlag` through the YAML round-trip.

**Architecture:** Keep the shared `commonRegisterFieldProperties` unchanged. Override only the `synonym` property inside `packages/core/metadata/commonObjects/accountingFlag/rules.ts`, because the observed diff is limited to `AccountingFlag` and `ExtDimensionAccountingFlag`.

**Tech Stack:** TypeScript, Vitest, metadata rules engine, `pnpm --filter @nakidka/core exec vitest`.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/accountingFlag/rules.ts`
  - Responsibility: specialize common register-field rules for accounting flags.
- Create: `packages/core/metadata/commonObjects/accountingFlag/toYAML.test.ts`
  - Responsibility: prove that equal-name and non-equal-name synonyms are explicitly exported to YAML for both accounting flag item types.
- Create: `packages/core/metadata/commonObjects/accountingFlag/fromYAML.test.ts`
  - Responsibility: prove that explicit YAML synonyms import back into the metadata model.
- Modify: `docs/superpowers/specs/2026-05-27-round-trip-yaml-diffs-design.md`
  - Responsibility: record the accepted solution, verification commands, and result for decision 1.

## Task 1: Add failing YAML tests for AccountingFlag synonyms

**Files:**

- Create: `packages/core/metadata/commonObjects/accountingFlag/toYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/accountingFlag/fromYAML.test.ts`

- [ ] **Step 1: Create `toYAML.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML } from "~/metadata/orchestration"
import { mockContextToYAML } from "~/tests/mockContext"
import { AccountingFlagRules, ExtDimensionAccountingFlagRules } from "./rules"

describe("export accounting flags to YAML", () => {
  it.each([
    ["AccountingFlag", AccountingFlagRules],
    ["ExtDimensionAccountingFlag", ExtDimensionAccountingFlagRules],
  ] as const)("keeps explicit synonym for %s even when synonym equals name", (_label, rule) => {
    const result = exportMetadataItemToYAML({
      context: mockContextToYAML,
      rule,
      data: {
        itemType: rule.itemType,
        uuid: "00000000-0000-0000-0000-000000000001",
        name: "Суммовой",
        synonym: { items: { ru: "Суммовой" } },
        type: { type: ["xs:boolean"] },
      },
    })

    expect(result).toMatchObject({
      Синоним: "Суммовой",
      Тип: "Булево",
    })
  })

  it("keeps explicit synonym when spaces differ from the metadata name", () => {
    const result = exportMetadataItemToYAML({
      context: mockContextToYAML,
      rule: AccountingFlagRules,
      data: {
        itemType: "AccountingFlag",
        uuid: "00000000-0000-0000-0000-000000000002",
        name: "УчетПоПодразделениям",
        synonym: { items: { ru: "Учет по подразделениям" } },
        type: { type: ["xs:boolean"] },
      },
    })

    expect(result).toMatchObject({
      Синоним: "Учет по подразделениям",
      Тип: "Булево",
    })
  })
})
```

- [ ] **Step 2: Create `fromYAML.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { AccountingFlagRules, ExtDimensionAccountingFlagRules } from "./rules"

describe("import accounting flags from YAML", () => {
  it.each([
    ["AccountingFlag", AccountingFlagRules],
    ["ExtDimensionAccountingFlag", ExtDimensionAccountingFlagRules],
  ] as const)("imports explicit synonym for %s", (_label, rule) => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule,
      name: "Суммовой",
      yaml: {
        Синоним: "Суммовой",
        Тип: "Булево",
      },
    })

    expect(result).toMatchObject({
      itemType: rule.itemType,
      name: "Суммовой",
      synonym: { items: { ru: "Суммовой" } },
      type: { type: ["xs:boolean"] },
    })
  })
})
```

- [ ] **Step 3: Run the new tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/accountingFlag/toYAML.test.ts packages/core/metadata/commonObjects/accountingFlag/fromYAML.test.ts
```

Expected:

- `fromYAML.test.ts` may pass immediately because explicit `Синоним` is already supported.
- `toYAML.test.ts` must fail before the implementation because `Синоним` is omitted when `excludeIfEqualNameYAML` hides it.

## Task 2: Override synonym behavior for accounting flags

**Files:**

- Modify: `packages/core/metadata/commonObjects/accountingFlag/rules.ts`

- [ ] **Step 1: Replace `accountingFlagProperties` with a synonym override**

Change `packages/core/metadata/commonObjects/accountingFlag/rules.ts` so the local properties object looks like this:

```ts
const accountingFlagProperties = {
  ...commonRegisterFieldProperties,
  synonym: {
    ...commonRegisterFieldProperties.synonym,
    excludeIfEqualNameYAML: false,
  },
  indexing: {
    ...commonRegisterFieldProperties.indexing,
    toXML: hasExplicitProperty("indexing"),
  },
  fullTextSearch: {
    ...commonRegisterFieldProperties.fullTextSearch,
    toXML: hasExplicitProperty("fullTextSearch"),
  },
}
```

- [ ] **Step 2: Run the focused tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/accountingFlag/toYAML.test.ts packages/core/metadata/commonObjects/accountingFlag/fromYAML.test.ts
```

Expected:

- Both test files pass.

- [ ] **Step 3: Run the related ChartOfAccounts XML tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataChartOfAccounts/fromXML.test.ts
```

Expected:

- Existing XML round-trip tests still pass.

## Task 3: Verify against round-trip-yaml triage

**Files:**

- No code files changed in this task.

- [ ] **Step 1: Run the diagnostic triage**

Run from the worktree root:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected:

- The script succeeds.
- `ChartsOfAccounts/Хозрасчетный.xml` no longer shows `AccountingFlag` or `ExtDimensionAccountingFlag` `Synonym` values changing to `<Synonym/>`.
- If a different diff remains in the same XML file, copy its short fragment into the spec before deciding whether it belongs to decision 1 or a later decision.

## Task 4: Update the spec with decision 1 result

**Files:**

- Modify: `docs/superpowers/specs/2026-05-27-round-trip-yaml-diffs-design.md`

- [ ] **Step 1: Replace the decision 1 status block**

Replace:

```md
Статус: ожидает реализации.
```

in the `Решение 1: AccountingFlag / ExtDimensionAccountingFlag` section with:

```md
Выбранное изменение:

`AccountingFlagRules` и `ExtDimensionAccountingFlagRules` локально переопределяют `synonym` и отключают `excludeIfEqualNameYAML`. Общий `commonRegisterFieldProperties` не меняется.

Проверка:

- `pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/accountingFlag/toYAML.test.ts packages/core/metadata/commonObjects/accountingFlag/fromYAML.test.ts`
- `pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataChartOfAccounts/fromXML.test.ts`
- `./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5`

Результат:

`Synonym` для `AccountingFlag` и `ExtDimensionAccountingFlag` сохраняется в YAML и восстанавливается в XML. Diff `1` больше не должен показывать замену непустого `Synonym` на `<Synonym/>`.

Статус: реализовано.
```

- [ ] **Step 2: Run markdown sanity check**

Run:

```bash
rg -n "TBD|TODO|ожидает реализации" docs/superpowers/specs/2026-05-27-round-trip-yaml-diffs-design.md
```

Expected:

- No match inside the decision 1 section.
- A remaining `ожидает реализации` in decision 2 is acceptable.

## Task 5: Commit decision 1

**Files:**

- Stage only files changed for decision 1.

- [ ] **Step 1: Inspect status**

Run:

```bash
git status --short
```

Expected:

- Modified or new files are limited to:
  - `packages/core/metadata/commonObjects/accountingFlag/rules.ts`
  - `packages/core/metadata/commonObjects/accountingFlag/toYAML.test.ts`
  - `packages/core/metadata/commonObjects/accountingFlag/fromYAML.test.ts`
  - `docs/superpowers/specs/2026-05-27-round-trip-yaml-diffs-design.md`
  - `docs/superpowers/plans/2026-05-27-accounting-flag-synonym.md` if the plan is committed with the work.

- [ ] **Step 2: Commit**

Run:

```bash
git add packages/core/metadata/commonObjects/accountingFlag/rules.ts packages/core/metadata/commonObjects/accountingFlag/toYAML.test.ts packages/core/metadata/commonObjects/accountingFlag/fromYAML.test.ts docs/superpowers/specs/2026-05-27-round-trip-yaml-diffs-design.md docs/superpowers/plans/2026-05-27-accounting-flag-synonym.md
git commit -m "fix: :bug: сохранять синонимы признаков учета"
```

Expected:

- Commit succeeds.
- Worktree is clean except for diagnostic diff'ы in the external XML repository, which are not part of this git worktree.
