# UserVisible Value YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести `UserVisible` с вариантных YAML-ключей `Разрешить*` / `Запретить*` на единый value-based формат `Использование` / `Просмотр` / `Редактирование` и полностью убрать использование `yamlDeny`.

**Architecture:** `UserVisible` остаётся одним общим типом модели `{ common, values }`, но YAML-контракт меняется на объект `{ Разрешить?: Ложь, Роли: {...} }`. Вариант allow/deny хранится только внутри значения: отсутствие `Разрешить` означает `common: true`, `Разрешить: Ложь` означает `common: false`. Старый YAML-формат не поддерживается ни на чтение, ни на выгрузку.

**Tech Stack:** TypeScript, TypeBox, Vitest, pnpm workspace, `@nakidka/core`, `@nakidka/cli`.

---

## Files

- Modify: `docs/superpowers/specs/2026-06-11-form-validation-schema-errors-design.md`
  - Уже уточняет целевой контракт: без `yamlDeny`, без совместимости старого YAML.
- Modify: `packages/core/metadata/commonObjects/userVisible/types.ts`
  - Новый TypeBox/YAML-тип `UserVisibleYAML`.
  - Новые ключи `UserVisibleKeysYAML.Value`, `UserViewKeysYAML.Value`, `UserEditKeysYAML.Value`.
- Modify: `packages/core/metadata/commonObjects/userVisible/fromYAML.ts`
  - Импорт только нового value-based формата.
- Modify: `packages/core/metadata/commonObjects/userVisible/toYAML.ts`
  - Экспорт только нового value-based формата.
  - Удаление `exportUserVisibleToYAMLDeprecated`.
- Modify: `packages/core/metadata/commonObjects/userVisible/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/userVisible/toYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/userVisible/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
  - Удалить `yamlDeny` из `UserVisiblePropertyRule`.
- Modify: `packages/core/metadata/orchestration/metadataItem/yaml.ts`
  - YAML-тип rule-based объектов должен включать только `rule.yaml`, без deny-ключей.
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`
  - Заменить старые ключи просмотра/редактирования на `Просмотр` и `Редактирование`.
- Modify rules:
  - `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
  - `packages/core/metadata/forms/commonObjects/formCommand/rules.ts`
  - `packages/core/metadata/forms/elements/button/rules.ts`
  - `packages/core/metadata/forms/elements/formDecoration/rules.ts`
  - `packages/core/metadata/forms/elements/formField/rules.ts`
  - `packages/core/metadata/forms/elements/formGroup/rules.ts`
  - `packages/core/metadata/forms/elements/searchControlAddition/rules.ts`
  - `packages/core/metadata/forms/elements/searchStringAddition/rules.ts`
  - `packages/core/metadata/forms/elements/table/rules.ts`
- Modify manual command interface:
  - `packages/core/metadata/forms/commonObjects/commandInterface/types.ts`
  - `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts`
  - `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts`
  - `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`
- Modify fixtures and tests that mention old keys:
  - `packages/core/tests/fixtures/formAttributes/data.ts`
  - `packages/core/tests/fixtures/forms/base/formField/rules.ts`
  - `packages/core/metadata/forms/commonObjects/formCommand/__fixtures__/data.ts`
  - `packages/core/metadata/forms/elements/table/__fixtures__/data.ts`
  - `packages/core/metadata/forms/elements/table/__fixtures__/dynamicList.ts`
  - `packages/core/metadata/forms/elements/button/__fixtures__/data.ts`
  - `packages/core/metadata/forms/elements/formGroup/__fixtures__/data.ts`
  - `packages/core/metadata/forms/elements/formDecoration/__fixtures__/data.ts`
  - `packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/data.ts`
  - `packages/core/metadata/forms/elements/searchControlAddition/__fixtures__/data.ts`
  - element fixture files that omit keys via `"ЗапретитьИспользование" | "РазрешитьИспользование"`.

### Task 1: UserVisible YAML Contract Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/userVisible/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/userVisible/toYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/userVisible/toJSONSchema.test.ts`

- [ ] **Step 1: Replace current-format import tests**

In `packages/core/metadata/commonObjects/userVisible/fromYAML.test.ts`, keep deprecated tests only until Task 2 deletes deprecated code. Replace the "current YAML importer" expectations with new value-based values:

```ts
it("imports allow mode from current YAML", () => {
  const result = importUserVisibleFromYAML({
    context: mockContext,
    rule: userVisibleRule,
    value: {
      Роли: {
        "Role.Администратор": "Истина",
        "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Ложь",
      },
    },
  })

  expect(result).toEqual({
    common: true,
    values: [
      { name: "Role.Администратор", value: true },
      { name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: false },
    ],
  })
})

it("imports deny mode from current YAML", () => {
  const result = importUserVisibleFromYAML({
    context: mockContext,
    rule: userVisibleRule,
    value: {
      Разрешить: "Ложь",
      Роли: {
        "Role.Администратор": "Истина",
        "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Ложь",
      },
    },
  })

  expect(result).toEqual({
    common: false,
    values: [
      { name: "Role.Администратор", value: true },
      { name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: false },
    ],
  })
})
```

- [ ] **Step 2: Add tests that old format is not read**

Add this to `fromYAML.test.ts`:

```ts
it("does not read legacy allow or deny YAML keys", () => {
  expect(
    importUserVisibleFromYAML({
      context: mockContext,
      rule: userVisibleRule,
      value: undefined,
      yaml: {
        РазрешитьИспользование: { "Role.Администратор": "Истина" },
        ЗапретитьИспользование: { "Role.Пользователь": "Ложь" },
      },
    })
  ).toBeUndefined()
})
```

- [ ] **Step 3: Replace export expectations**

In `toYAML.test.ts`, current exporter should produce:

```ts
expect(result).toEqual({
  Использование: {
    Роли: {
      "Role.Администратор": "Истина",
      "Role.Пользователь": "Ложь",
    },
  },
})
```

For `common: false`, expected result is:

```ts
expect(result).toEqual({
  Использование: {
    Разрешить: "Ложь",
    Роли: {
      "Role.Администратор": "Истина",
      "Role.Пользователь": "Ложь",
    },
  },
})
```

- [ ] **Step 4: Remove deprecated exporter/importer tests**

Delete test cases that call:

```ts
importUserVisibleFromYAMLDeprecated(...)
exportUserVisibleToYAMLDeprecated(...)
```

They contradict the requirement that `yamlDeny` is no longer used.

- [ ] **Step 5: Add JSON Schema tests**

Create `packages/core/metadata/commonObjects/userVisible/toJSONSchema.test.ts`:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { UserVisibleJSONSchema } from "./types"

describe("UserVisibleJSONSchema", () => {
  const compiled = TypeCompiler.Compile(UserVisibleJSONSchema)

  it("accepts allow mode without explicit Разрешить", () => {
    expect(compiled.Check({ Роли: { "Role.Администратор": "Ложь" } })).toBe(true)
  })

  it("accepts deny mode with Разрешить Ложь", () => {
    expect(compiled.Check({ Разрешить: "Ложь", Роли: { "Role.Администратор": "Истина" } })).toBe(true)
  })

  it("rejects explicit Разрешить Истина", () => {
    expect(compiled.Check({ Разрешить: "Истина", Роли: { "Role.Администратор": "Истина" } })).toBe(false)
  })

  it("rejects empty roles", () => {
    expect(compiled.Check({ Роли: {} })).toBe(false)
  })

  it("rejects legacy role map at top level", () => {
    expect(compiled.Check({ "Role.Администратор": "Истина" })).toBe(false)
  })
})
```

- [ ] **Step 6: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/userVisible
```

Expected: FAIL. Failures should point to old shape in `UserVisibleJSONSchema`, old import/export behavior, or removed deprecated functions.

### Task 2: UserVisible Core Implementation

**Files:**
- Modify: `packages/core/metadata/commonObjects/userVisible/types.ts`
- Modify: `packages/core/metadata/commonObjects/userVisible/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/userVisible/toYAML.ts`

- [ ] **Step 1: Replace YAML keys and schema**

In `types.ts`, replace key constants and schema with:

```ts
export const UserVisibleKeysYAML = {
  Value: "Использование",
} as const

export const UserViewKeysYAML = {
  Value: "Просмотр",
} as const

export const UserEditKeysYAML = {
  Value: "Редактирование",
} as const

export const UserVisibleJSONSchema = Type.Object(
  {
    Разрешить: Type.Optional(Type.Literal("Ложь")),
    Роли: Type.Record(Type.String(), BooleanJSONSchema, { minProperties: 1 }),
  },
  { additionalProperties: false }
)
```

Keep the existing type exports:

```ts
export type UserVisibleYAML = Static<typeof UserVisibleJSONSchema>
export type UserVisibleKeysYAML = (typeof UserVisibleKeysYAML)[keyof typeof UserVisibleKeysYAML]
export type UserViewKeysYAML = (typeof UserViewKeysYAML)[keyof typeof UserViewKeysYAML]
export type UserEditKeysYAML = (typeof UserEditKeysYAML)[keyof typeof UserEditKeysYAML]
```

- [ ] **Step 2: Replace YAML importer**

In `fromYAML.ts`, delete `importUserVisibleFromYAMLDeprecated` and remove all reads from `yaml[rule.yamlDeny]`.

The current importer body should be:

```ts
export const importUserVisibleFromYAML: ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: UserVisibleYAML | undefined
  source?: UserVisible | undefined
  yaml?: Record<string, any> | undefined
}): UserVisible | undefined => {
  const { context, value } = params
  if (value === undefined) return undefined

  const values = Object.entries(value.Роли).map(([key, val]) => {
    const parsedValue = importBooleanFromYAML(context, undefined, val)
    return {
      name: key,
      value: parsedValue!,
    }
  })

  return {
    common: value.Разрешить !== "Ложь",
    values,
  }
}
```

- [ ] **Step 3: Replace YAML exporter**

In `toYAML.ts`, delete `exportUserVisibleToYAMLDeprecated`. Replace `exportUserVisibleToYAML` with:

```ts
export const exportUserVisibleToYAML = (
  context: ConfigurationContext,
  rule: UserVisiblePropertyRule,
  userVisible: UserVisible | undefined
): Partial<Record<string, UserVisibleYAML>> | undefined => {
  if (!userVisible) return undefined
  if (userVisible.values.length === 0) return undefined
  if (!rule.yaml) throw new Error("UserVisiblePropertyRule must have yaml property")

  const roles: UserVisibleYAML["Роли"] = {}
  userVisible.values.forEach((item) => {
    roles[item.name] = exportBooleanToYAML(context, undefined, item.value)!
  })

  return {
    [rule.yaml]: {
      ...(userVisible.common ? {} : { Разрешить: "Ложь" as const }),
      Роли: roles,
    },
  }
}
```

- [ ] **Step 4: Run UserVisible tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/userVisible
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/userVisible
git commit -m "fix: :bug: перевести UserVisible на value YAML"
```

### Task 3: Remove yamlDeny From Orchestration Types

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/yaml.ts`

- [ ] **Step 1: Remove yamlDeny from UserVisiblePropertyRule**

In `property/types.ts`, change the interface to:

```ts
export interface UserVisiblePropertyRule extends BasePropertyRule {
  type: "UserVisible"
  yaml: string
}
```

- [ ] **Step 2: Remove deny keys from YAMLTypeByRule**

In `metadataItem/yaml.ts`, replace `UserVisibleByRule` with:

```ts
type UserVisibleByRule<Rule extends { properties: Record<string, PropertyRule> }> = {
  [K in Rule["properties"][keyof Rule["properties"]] extends infer P
    ? P extends { type: "UserVisible"; yaml?: infer Y }
      ? Y extends string
        ? Y
        : never
      : never
    : never]?: UserVisibleYAML
}
```

- [ ] **Step 3: Run TypeScript-facing tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration
```

Expected: tests may still fail to compile because rules still contain `yamlDeny`. That is expected until Task 4.

### Task 4: Update Rule-Based Form Properties

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formCommand/rules.ts`
- Modify: `packages/core/metadata/forms/elements/button/rules.ts`
- Modify: `packages/core/metadata/forms/elements/formDecoration/rules.ts`
- Modify: `packages/core/metadata/forms/elements/formField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/formGroup/rules.ts`
- Modify: `packages/core/metadata/forms/elements/searchControlAddition/rules.ts`
- Modify: `packages/core/metadata/forms/elements/searchStringAddition/rules.ts`
- Modify: `packages/core/metadata/forms/elements/table/rules.ts`

- [ ] **Step 1: Replace use keys**

In every `userVisible` property rule, replace:

```ts
yaml: "РазрешитьИспользование",
yamlDeny: "ЗапретитьИспользование",
type: "UserVisible",
```

with:

```ts
yaml: "Использование",
type: "UserVisible",
```

- [ ] **Step 2: Replace view/edit keys**

In `formAttribute/rules.ts`, replace:

```ts
yaml: "РазрешитьПросмотр",
yamlDeny: "ЗапретитьПросмотр",
type: "UserVisible",
```

with:

```ts
yaml: "Просмотр",
type: "UserVisible",
```

Replace:

```ts
yaml: "РазрешитьРедактирование",
yamlDeny: "ЗапретитьРедактирование",
type: "UserVisible",
```

with:

```ts
yaml: "Редактирование",
type: "UserVisible",
```

- [ ] **Step 3: Verify no yamlDeny remains in rule files**

Run:

```bash
rg -n "yamlDeny" packages/core/metadata/forms packages/core/metadata/commonObjects/userVisible packages/core/metadata/orchestration
```

Expected: no output, except if unrelated non-UserVisible `yamlDeny` still exists. If any result is `UserVisible`, remove it in this task.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/orchestration packages/core/metadata/forms/*/*/rules.ts packages/core/metadata/forms/elements/*/rules.ts
git commit -m "fix: :bug: убрать yamlDeny из правил UserVisible"
```

### Task 5: Update Manual Command Interface

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`

- [ ] **Step 1: Update command interface YAML schema**

In `types.ts`, replace:

```ts
РазрешитьИспользование: Type.Optional(UserVisibleJSONSchema),
ЗапретитьИспользование: Type.Optional(UserVisibleJSONSchema),
```

with:

```ts
Использование: Type.Optional(UserVisibleJSONSchema),
```

- [ ] **Step 2: Update command interface YAML import**

In `fromYAML.ts`, remove `UserVisibleKeysYAML.Deny` usage and call:

```ts
const visible = importUserVisibleFromYAML({
  context,
  rule: { type: "UserVisible", yaml: UserVisibleKeysYAML.Value },
  value: item[UserVisibleKeysYAML.Value],
  yaml: item,
})
```

- [ ] **Step 3: Update command interface YAML export**

In `toYAML.ts`, remove `exportUserVisibleToYAMLDeprecated` import. Use:

```ts
import { exportUserVisibleToYAML } from "~/metadata/commonObjects/userVisible/toYAML"
```

Replace the visible export block with:

```ts
if (item.visible) {
  const visibleYAML = exportUserVisibleToYAML(
    context,
    { type: "UserVisible", yaml: UserVisibleKeysYAML.Value },
    item.visible
  )
  if (visibleYAML) {
    Object.assign(result, visibleYAML)
  }
}
```

- [ ] **Step 4: Update command interface XML export helper rule**

In `toXML.ts`, replace:

```ts
{ type: "UserVisible", yaml: "РазрешитьИспользование", yamlDeny: "ЗапретитьИспользование" }
```

with:

```ts
{ type: "UserVisible", yaml: "Использование" }
```

- [ ] **Step 5: Run command interface tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/commandInterface
```

Expected: FAIL until fixtures are updated in Task 6, or PASS if command interface tests do not assert old YAML text directly.

### Task 6: Update Fixtures And YAML Types

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`
- Modify fixture files listed in the Files section.

- [ ] **Step 1: Update formAttribute YAML types**

In `formAttribute/types.ts`, replace mapped keys:

```ts
[UserViewKeysYAML.Allow]?: UserViewYAML
[UserViewKeysYAML.Deny]?: UserViewYAML
[UserEditKeysYAML.Allow]?: UserEditYAML
[UserEditKeysYAML.Deny]?: UserEditYAML
```

with:

```ts
[UserViewKeysYAML.Value]?: UserVisibleYAML
[UserEditKeysYAML.Value]?: UserVisibleYAML
```

Remove unused `UserViewYAML` / `UserEditYAML` imports or types if TypeScript reports them unused.

- [ ] **Step 2: Update fixture shape**

Every old allow map:

```ts
РазрешитьИспользование: { "Role.Администратор": "Ложь" }
```

becomes:

```ts
Использование: {
  Роли: { "Role.Администратор": "Ложь" },
}
```

Every old deny map:

```ts
ЗапретитьРедактирование: {
  "Role.Администратор": "Истина",
  "Role.Пользователь": "Ложь",
}
```

becomes:

```ts
Редактирование: {
  Разрешить: "Ложь",
  Роли: {
    "Role.Администратор": "Истина",
    "Role.Пользователь": "Ложь",
  },
}
```

Every old allow view/edit map:

```ts
РазрешитьПросмотр: {
  "Role.Администратор": "Истина",
  "Role.Пользователь": "Ложь",
}
```

becomes:

```ts
Просмотр: {
  Роли: {
    "Role.Администратор": "Истина",
    "Role.Пользователь": "Ложь",
  },
}
```

- [ ] **Step 3: Update Omit helper types**

Replace fixture helper exclusions like:

```ts
Omit<Required<SomePartialYAML>, "ЗапретитьИспользование" | "РазрешитьИспользование">
```

with:

```ts
Omit<Required<SomePartialYAML>, "Использование">
```

- [ ] **Step 4: Search old keys in core fixtures**

Run:

```bash
rg -n "РазрешитьИспользование|ЗапретитьИспользование|РазрешитьПросмотр|ЗапретитьПросмотр|РазрешитьРедактирование|ЗапретитьРедактирование" packages/core/metadata packages/core/tests --glob '*.{ts,yaml,yml}'
```

Expected: no results except system enumeration names that are not `UserVisible` YAML fields. If results are fixture data or UserVisible code, update them.

- [ ] **Step 5: Run form-related tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/userVisible metadata/forms/commonObjects/formAttribute metadata/forms/commonObjects/formCommand metadata/forms/commonObjects/commandInterface metadata/forms/elements
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata packages/core/tests/fixtures
git commit -m "fix: :bug: обновить YAML фикстуры UserVisible"
```

### Task 7: Validation Schema And No-Legacy Guard

**Files:**
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts` or create focused validation test near existing validation tests if better aligned.

- [ ] **Step 1: Add schema guard for form element**

Add a focused validation/schema test that obtains a schema for an element with `Использование` and verifies:

```ts
expect(compiled.Check({
  Вид: "Группа",
  Использование: {
    Роли: { "Role.Администратор": "Ложь" },
  },
})).toBe(true)

expect(compiled.Check({
  Вид: "Группа",
  РазрешитьИспользование: { "Role.Администратор": "Ложь" },
})).toBe(false)

expect(compiled.Check({
  Вид: "Группа",
  ЗапретитьИспользование: { "Role.Администратор": "Истина" },
})).toBe(false)
```

Use the existing schema helper in `metadata/validation/schemaRegistry.test.ts`; if no helper exists for form elements, create one following the local pattern in that file.

- [ ] **Step 2: Run validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/metadata/validation
git commit -m "test: :white_check_mark: закрепить новый YAML UserVisible"
```

### Task 8: Regenerate ERP YAML And Verify Old Format Is Gone

**Files:**
- External output: `/home/nikita/git/temp-yaml`
- Source XML: `/home/nikita/git/round-trip/erp`

- [ ] **Step 1: Regenerate YAML from XML**

Run:

```bash
pnpm --filter @nakidka/cli dev -- import /home/nikita/git/round-trip/erp /home/nikita/git/temp-yaml
```

Expected: command completes with exit code `0`. If sandbox blocks `tsx` pipe creation, rerun with escalation.

- [ ] **Step 2: Verify old UserVisible keys are absent**

Run:

```bash
rg -n "РазрешитьИспользование|ЗапретитьИспользование|РазрешитьПросмотр|ЗапретитьПросмотр|РазрешитьРедактирование|ЗапретитьРедактирование" /home/nikita/git/temp-yaml
```

Expected: no output.

- [ ] **Step 3: Verify new keys are present when roles exist**

Run:

```bash
rg -n "^[[:space:]]+(Использование|Просмотр|Редактирование):$" /home/nikita/git/temp-yaml | head -40
```

Expected: output shows examples of the new keys, unless ERP has no role-detail values at all. If no output, inspect known files that previously had old keys before treating it as success.

- [ ] **Step 4: Run full validation**

Run:

```bash
pnpm --filter @nakidka/cli dev -- validate /home/nikita/git/temp-yaml
```

Expected: command likely exits `1` because unrelated validation errors remain. Success criteria for this task:

- no `Unexpected property` caused by `ЗапретитьИспользование`;
- no `Unexpected property` caused by `ЗапретитьРедактирование`;
- no `Unexpected property` caused by `ЗапретитьПросмотр`;
- total `Unexpected property` decreases by roughly the old `764` subgroup, unless other newly exposed errors replace it.

- [ ] **Step 5: Save validation log for grouping**

If full output is large, rerun:

```bash
pnpm --filter @nakidka/cli dev -- validate /home/nikita/git/temp-yaml > /tmp/nkdk-validate-temp-yaml-user-visible.log 2>&1
```

Then verify:

```bash
rg "ЗапретитьИспользование|ЗапретитьРедактирование|ЗапретитьПросмотр" /tmp/nkdk-validate-temp-yaml-user-visible.log
```

Expected: no output.

### Task 9: Final Test Pass And Commit Docs

**Files:**
- Modify: `docs/superpowers/specs/2026-06-11-form-validation-schema-errors-design.md`
- Create: `docs/superpowers/plans/2026-06-13-user-visible-value-yaml.md`

- [ ] **Step 1: Run targeted core tests again**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/userVisible metadata/forms/commonObjects/formAttribute metadata/forms/commonObjects/formCommand metadata/forms/commonObjects/commandInterface metadata/forms/elements metadata/validation
```

Expected: PASS.

- [ ] **Step 2: Run full project tests**

Run from repo root:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Commit docs if not committed yet**

```bash
git add docs/superpowers/specs/2026-06-11-form-validation-schema-errors-design.md docs/superpowers/plans/2026-06-13-user-visible-value-yaml.md
git commit -m "docs: :memo: описать переход UserVisible на value YAML"
```

- [ ] **Step 4: Commit any remaining implementation changes**

If implementation files remain uncommitted after earlier task commits:

```bash
git status --short
git add packages/core/metadata packages/core/tests/fixtures
git commit -m "fix: :bug: завершить переход UserVisible на value YAML"
```

Expected: `git status --short` is empty after the final commit.

## Self-Review

- Spec coverage: plan covers removal of `yamlDeny`, no old-format read compatibility, new value-based keys, schema validation, fixture updates, `commandInterface`, ERP regeneration, and absence check in `/home/nikita/git/temp-yaml`.
- Placeholder scan: no `TBD`/`TODO` placeholders; each task has concrete files, code shape, commands, and expected result.
- Type consistency: `UserVisiblePropertyRule` has only `yaml`; `UserVisibleKeysYAML.Value` is used by manual command interface; `UserVisibleJSONSchema` matches import/export shape `{ Разрешить?: Ложь, Роли: Record<string, StringboolYAML> }`.
