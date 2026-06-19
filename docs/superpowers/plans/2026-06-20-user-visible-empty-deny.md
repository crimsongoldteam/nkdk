# UserVisible Empty Deny YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve explicit `UserVisible` deny-without-roles values through XML -> YAML -> XML round-trip.

**Architecture:** Fix the shared `commonObjects/userVisible` YAML contract instead of adding a `CommandInterface` special case. `UserVisible` export will emit `Разрешить: Ложь` for `common: false` with no roles, import will treat absent `Роли` as an empty role list, and the JSON schema will allow that exact shape while still rejecting `Роли: {}`.

**Tech Stack:** TypeScript, TypeBox JSON schema, Vitest, existing metadata YAML/XML orchestration.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/userVisible/types.ts`: relax `UserVisibleJSONSchema` so `Роли` is optional only for the empty deny case.
- Modify `packages/core/metadata/commonObjects/userVisible/toYAML.ts`: export empty deny as `Разрешить: Ложь`, keep empty allow omitted.
- Modify `packages/core/metadata/commonObjects/userVisible/fromYAML.ts`: import missing `Роли` as an empty list.
- Modify `packages/core/metadata/commonObjects/userVisible/toYAML.test.ts`: update the existing empty deny expectation.
- Modify `packages/core/metadata/commonObjects/userVisible/fromYAML.test.ts`: add import coverage for empty deny.
- Modify `packages/core/metadata/commonObjects/userVisible/toJSONSchema.test.ts`: add schema coverage for empty deny and keep empty roles rejected.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.ts`: update expected YAML and imported model for command interface items that already contain `visible: { common: false, values: [] }`.
- Run existing `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.test.ts` and `fromYAML.test.ts` as the command interface regression.

---

### Task 1: Add Red Tests For Shared UserVisible YAML

**Files:**
- Modify: `packages/core/metadata/commonObjects/userVisible/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/userVisible/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/userVisible/toJSONSchema.test.ts`

- [ ] **Step 1: Update the empty deny export test**

In `packages/core/metadata/commonObjects/userVisible/toYAML.test.ts`, replace the first test:

```ts
  it("exports empty deny usage", () => {
    const use: UserVisible = {
      common: false,
      values: [],
    }

    const result = exportUserVisibleToYAML(mockContext, userVisibleRule, use)

    expect(result).toEqual({
      Использование: {
        Разрешить: "Ложь",
      },
    })
  })
```

Keep the existing `does not export empty allow usage` test unchanged.

- [ ] **Step 2: Add the empty deny import test**

In `packages/core/metadata/commonObjects/userVisible/fromYAML.test.ts`, add this test after `imports deny mode from current YAML`:

```ts
  it("imports empty deny mode from current YAML", () => {
    const result = importUserVisibleFromYAML({
      context: mockContext,
      rule: userVisibleRule,
      value: {
        Разрешить: "Ложь",
      },
    })

    expect(result).toEqual({
      common: false,
      values: [],
    })
  })
```

- [ ] **Step 3: Add the JSON schema empty deny test**

In `packages/core/metadata/commonObjects/userVisible/toJSONSchema.test.ts`, add this test after `accepts deny mode with Разрешить Ложь`:

```ts
  it("accepts empty deny mode without roles", () => {
    expect(compiled.Check({ Разрешить: "Ложь" })).toBe(true)
  })
```

Leave `rejects empty roles` unchanged:

```ts
  it("rejects empty roles", () => {
    expect(compiled.Check({ Роли: {} })).toBe(false)
  })
```

- [ ] **Step 4: Run red shared UserVisible tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/userVisible --no-isolate
```

Expected: FAIL.

Expected failures:

- `exportUserVisibleToYAML > exports empty deny usage` receives `undefined`.
- `importUserVisibleFromYAML > imports empty deny mode from current YAML` throws or fails because `value.Роли` is missing.
- `UserVisibleJSONSchema > accepts empty deny mode without roles` receives `false`.

- [ ] **Step 5: Commit red tests**

```bash
git add packages/core/metadata/commonObjects/userVisible/toYAML.test.ts packages/core/metadata/commonObjects/userVisible/fromYAML.test.ts packages/core/metadata/commonObjects/userVisible/toJSONSchema.test.ts
git commit -m "test: :white_check_mark: зафиксировать пустой запрет UserVisible" -m "Тесты описывают YAML-договор для xr:Common=false без ролевых записей перед изменением общего UserVisible."
```

---

### Task 2: Implement Shared UserVisible YAML Contract

**Files:**
- Modify: `packages/core/metadata/commonObjects/userVisible/types.ts`
- Modify: `packages/core/metadata/commonObjects/userVisible/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/userVisible/fromYAML.ts`

- [ ] **Step 1: Relax the JSON schema for empty deny**

In `packages/core/metadata/commonObjects/userVisible/types.ts`, replace `UserVisibleJSONSchema` with:

```ts
const UserVisibleRolesJSONSchema = Type.Record(Type.String(), BooleanJSONSchema, { minProperties: 1 })

export const UserVisibleJSONSchema = Type.Union(
  [
    Type.Object(
      {
        Разрешить: Type.Optional(Type.Literal("Ложь")),
        Роли: UserVisibleRolesJSONSchema,
      },
      { additionalProperties: false }
    ),
    Type.Object(
      {
        Разрешить: Type.Literal("Ложь"),
      },
      { additionalProperties: false }
    ),
  ],
  { additionalProperties: false }
)
```

This keeps `Роли: {}` invalid because the first union branch keeps `minProperties: 1`, and the second branch does not allow a `Роли` property.

- [ ] **Step 2: Export empty deny**

In `packages/core/metadata/commonObjects/userVisible/toYAML.ts`, replace:

```ts
  if (!userVisible) return undefined
  if (userVisible.values.length === 0) return undefined
  if (!rule.yaml) throw new Error("UserVisiblePropertyRule must have yaml property")
```

with:

```ts
  if (!userVisible) return undefined
  if (!rule.yaml) throw new Error("UserVisiblePropertyRule must have yaml property")
  if (userVisible.values.length === 0) {
    if (userVisible.common) return undefined

    return {
      [rule.yaml]: {
        Разрешить: "Ложь" as const,
      },
    }
  }
```

Keep the existing role export block below this guard unchanged.

- [ ] **Step 3: Import missing roles as an empty list**

In `packages/core/metadata/commonObjects/userVisible/fromYAML.ts`, replace:

```ts
  const values = Object.entries(value.Роли).map(([key, val]) => {
```

with:

```ts
  const values = Object.entries(value.Роли ?? {}).map(([key, val]) => {
```

- [ ] **Step 4: Run shared UserVisible tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/userVisible --no-isolate
```

Expected: PASS.

- [ ] **Step 5: Run TypeScript type-check for the changed schema**

Run:

```bash
pnpm --dir packages/core type-check
```

Expected: PASS.

- [ ] **Step 6: Commit shared implementation**

```bash
git add packages/core/metadata/commonObjects/userVisible/types.ts packages/core/metadata/commonObjects/userVisible/toYAML.ts packages/core/metadata/commonObjects/userVisible/fromYAML.ts
git commit -m "fix: :bug: сохранять пустой запрет UserVisible" -m "UserVisible теперь представляет xr:Common=false без ролей в YAML как Разрешить: Ложь, чтобы полный round-trip мог восстановить явный Visible."
```

---

### Task 3: Update CommandInterface Regression Expectations

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.ts`
- Test: `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.test.ts`

- [ ] **Step 1: Update expected YAML for empty deny command items**

In `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.ts`, update the second `ПанельНавигации` item in `fullCommandInterfaceYAML` to include `Использование`:

```ts
    {
      Команда: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      Тип: "Added",
      ГруппаКоманд: "ПанельНавигацииФормыВажное",
      Автовидимость: "Ложь",
      Использование: {
        Разрешить: "Ложь",
      },
    },
```

Update the first `КоманднаяПанель` item in `fullCommandInterfaceYAML` the same way:

```ts
    {
      Команда: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      Тип: "Added",
      ГруппаКоманд: "КоманднаяПанельФормыВажное",
      Автовидимость: "Ложь",
      Использование: {
        Разрешить: "Ложь",
      },
    },
```

- [ ] **Step 2: Update expected imported model**

In the same file, update the matching second `NavigationPanel` item in `fullCommandInterfaceFromYAML`:

```ts
    {
      command: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      type: "Added",
      commandGroup: "FormNavigationPanelImportant",
      defaultVisible: false,
      visible: { common: false, values: [] },
      itemType: "CommandInterfaceItem",
    },
```

Update the matching first `CommandBar` item in `fullCommandInterfaceFromYAML`:

```ts
    {
      command: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      type: "Added",
      commandGroup: "FormCommandBarImportant",
      defaultVisible: false,
      visible: { common: false, values: [] },
      itemType: "CommandInterfaceItem",
    },
```

- [ ] **Step 3: Run command interface regression tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/forms/commonObjects/commandInterface --no-isolate
```

Expected: PASS.

- [ ] **Step 4: Run the focused combined suite**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/userVisible metadata/forms/commonObjects/commandInterface metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 5: Commit command interface regression**

```bash
git add packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.ts
git commit -m "test: :white_check_mark: обновить YAML командного интерфейса" -m "Фикстура командного интерфейса теперь проверяет сохранение пустого UserVisible deny через общий YAML-договор."
```

---

### Task 4: Verify Diagnostic Round-Trips

**Files:**
- No code changes expected.

- [ ] **Step 1: Run round-trip-yaml-fast**

Run:

```bash
./.agents/skills/round-trip-yaml-fast/round-trip.sh
```

Expected after the fix: no diff for `Catalogs/СправочникКомандныйИнтерфейс/Forms/ФормаЭлемента/Ext/Form.xml`.

Acceptable result if another unrelated diff appears first: record the selected file and confirm it is not the command interface empty deny diff.

- [ ] **Step 2: Run full round-trip-yaml for the original case**

Run:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: the original selected diff for `Catalogs/СправочникКомандныйИнтерфейс/Forms/ФормаЭлемента/Ext/Form.xml` is gone.

Acceptable result if `DIFF_COUNT` remains non-zero: the first remaining diff may be the previously known second diff in `CommonForms/ДинамическийСписок/Ext/Form.xml`; do not fix that in this task.

- [ ] **Step 3: Run full package tests**

Run:

```bash
pnpm test
```

Expected: PASS for all packages.

- [ ] **Step 4: Commit verification-only notes only if files changed**

Run:

```bash
git status --short
```

Expected: no tracked changes.

If only XML diagnostic files in `/home/nikita/git/round-trip` changed, do not commit them in `nkdk`.

---

## Self-Review

Spec coverage:

- Empty deny YAML shape is covered by Task 1 and implemented in Task 2.
- Empty allow omission is preserved by Task 1 and Task 2.
- Missing `Роли` imports as an empty list in Task 2.
- Existing role-based YAML keeps the same shape because Task 2 changes only the zero-role branch.
- Command interface regression is covered by Task 3.
- Diagnostic verification is covered by Task 4.

Placeholder scan:

- No placeholders, `TBD`, or open-ended implementation steps remain.

Type consistency:

- All snippets use existing names: `UserVisibleJSONSchema`, `BooleanJSONSchema`, `exportUserVisibleToYAML`, `importUserVisibleFromYAML`, `fullCommandInterfaceYAML`, and `fullCommandInterfaceFromYAML`.
