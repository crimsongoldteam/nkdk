# YAML Required Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать `required: true` в `rules.ts` обязательным для YAML-валидации и начать ловить отсутствие `КодЯзыка` в объекте `Язык`.

**Architecture:** Обязательность YAML-поля должна рождаться в общем генераторе JSON Schema, а не в частном валидаторе объекта `Язык`. Поля с `implicitValueYAML` остаются необязательными в YAML, поэтому с трёх конфликтующих правил снимается `required: true`.

**Implementation note:** При выполнении плана дополнительно обнаружились поля с `required: true` и `defaultValue`, которые в YAML тоже должны оставаться опциональными. С них также снят `required`, иначе новая семантика ломает существующие валидные YAML-формы и `Конфигурация.yaml`.

**Tech Stack:** TypeScript, TypeBox JSON Schema, Vitest, существующий `validateProject`.

---

## File Structure

- Modify: `packages/core/metadata/orchestration/property/toJSONSchema.ts`
  - Ответственность: превращает `PropertyRule` в JSON Schema для YAML. Здесь нужно перестать оборачивать `required: true` YAML-поля в `Type.Optional(...)`.
- Modify: `packages/core/metadata/appliedObjects/metadataLanguage/rules.ts`
  - Ответственность: правила объекта `Язык`. Убедиться, что `languageCode` имеет `required: true`.
- Modify: `packages/core/metadata/forms/elements/autoCommandBar/rules.ts`
  - Ответственность: правила автокомандной панели формы. Снять `required: true` с `autofill`.
- Modify: `packages/core/metadata/forms/elements/columnGroup/rules.ts`
  - Ответственность: правила группы колонок. Снять `required: true` с `group`.
- Modify: `packages/core/metadata/forms/elements/usualGroup/rules.ts`
  - Ответственность: правила обычной группы. Снять `required: true` с `group`.
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`
  - Ответственность: тесты JSON Schema. Добавить проверку `required` для `КодЯзыка`.
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
  - Ответственность: интеграционные тесты валидации YAML-проекта. Добавить проверку отсутствующего `КодЯзыка`.
- Create: `packages/core/metadata/orchestration/property/toJSONSchemaRequired.test.ts`
  - Ответственность: узкий тест генератора схемы и инварианта `required: true` + `implicitValueYAML`.

## Task 1: Зафиксировать падающие тесты

**Files:**

- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
- Create: `packages/core/metadata/orchestration/property/toJSONSchemaRequired.test.ts`

- [ ] **Step 1: Add MetadataLanguage schema test**

In `packages/core/metadata/validation/schemaRegistry.test.ts`, add import:

```ts
import { MetadataLanguageRules } from "~/metadata/appliedObjects/metadataLanguage/rules"
```

Add this test inside `describe("JSON Schema registry", () => {`, after the home page work area test:

```ts
it("marks required YAML properties as JSON Schema required", () => {
  const schema = exportMetadataItemToJSONSchema({ context, rule: MetadataLanguageRules })

  expect(schema).toMatchObject({
    type: "object",
    properties: expect.objectContaining({
      КодЯзыка: expect.objectContaining({ type: "string" }),
    }),
    required: expect.arrayContaining(["КодЯзыка"]),
  })
})
```

- [ ] **Step 2: Add validateProject test for missing language code**

In `packages/core/metadata/validation/validateProject.test.ts`, add this test after `accepts a short root configuration default language reference`:

```ts
it("requires language code in language YAML", () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "Конфигурация.yaml", ["Имя: Конфигурация", "ОсновнойЯзык: Русский"])
  writeProjectFile(projectDir, "Язык/Русский/Свойства.yaml", ["Синоним: Русский"])

  const diagnostics = validateProject({ projectDir, context: mockContext }).diagnostics

  expect(diagnostics).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        filePath: join(projectDir, "Язык", "Русский", "Свойства.yaml"),
        source: "structure",
        severity: "error",
        path: "/КодЯзыка",
        message: 'Отсутствует обязательное свойство "КодЯзыка"',
      }),
    ])
  )
})
```

- [ ] **Step 3: Add narrow property schema tests**

Create `packages/core/metadata/orchestration/property/toJSONSchemaRequired.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import type { MetadataItemRule, PropertyRule } from "./types"
import { exportPropertiesToJSONSchema } from "./toJSONSchema"
import { AutoCommandBarRules } from "~/metadata/forms/elements/autoCommandBar/rules"
import { ColumnGroupRules } from "~/metadata/forms/elements/columnGroup/rules"
import { UsualGroupRules } from "~/metadata/forms/elements/usualGroup/rules"
import { mockContext } from "~/tests/mockContext"

describe("exportPropertiesToJSONSchema required YAML properties", () => {
  it("keeps required YAML properties non-optional", () => {
    const rule = {
      itemType: "RequiredYamlFixture",
      properties: {
        name: { yaml: "Имя", type: "string", required: true },
        comment: { yaml: "Комментарий", type: "string" },
      },
    } as const satisfies MetadataItemRule

    const schema = exportPropertiesToJSONSchema({ context: mockContext, rule }) as Record<string, unknown>

    expect(schema).toMatchObject({
      Имя: expect.objectContaining({ type: "string" }),
      Комментарий: expect.objectContaining({ type: "string" }),
    })
    expect(schema["Имя"]).not.toHaveProperty("modifier", "Optional")
    expect(schema["Комментарий"]).toHaveProperty("modifier", "Optional")
  })

  it("has no rules that combine required and implicitValueYAML", () => {
    const conflicts = [
      ...requiredImplicitConflicts(AutoCommandBarRules),
      ...requiredImplicitConflicts(ColumnGroupRules),
      ...requiredImplicitConflicts(UsualGroupRules),
    ]

    expect(conflicts).toEqual([])
  })
})

function requiredImplicitConflicts(rule: { properties: Record<string, PropertyRule> }): string[] {
  return Object.entries(rule.properties)
    .filter(([, propertyRule]) => propertyRule.required === true && "implicitValueYAML" in propertyRule)
    .map(([key]) => key)
}
```

- [ ] **Step 4: Run focused tests and verify failure**

Run:

```bash
pnpm --filter '@nakidka/core' test -- metadata/validation/schemaRegistry.test.ts metadata/validation/validateProject.test.ts metadata/orchestration/property/toJSONSchemaRequired.test.ts
```

Expected: at least the new schema/validation tests fail because required YAML properties are still optional, and the conflict test fails until the three rules are cleaned.

## Task 2: Clean conflicting rules

**Files:**

- Modify: `packages/core/metadata/forms/elements/autoCommandBar/rules.ts`
- Modify: `packages/core/metadata/forms/elements/columnGroup/rules.ts`
- Modify: `packages/core/metadata/forms/elements/usualGroup/rules.ts`

- [ ] **Step 1: Remove required from AutoCommandBar autofill**

In `packages/core/metadata/forms/elements/autoCommandBar/rules.ts`, change:

```ts
    autofill: {
      yaml: "Автозаполнение",
      type: "boolean",
      defaultValue: true,
      implicitValueYAML: "Истина",
      required: true,
    },
```

to:

```ts
    autofill: {
      yaml: "Автозаполнение",
      type: "boolean",
      defaultValue: true,
      implicitValueYAML: "Истина",
    },
```

- [ ] **Step 2: Remove required from ColumnGroup group**

In `packages/core/metadata/forms/elements/columnGroup/rules.ts`, change:

```ts
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeSE: "ColumnsGroup",
      defaultValue: "Vertical",
      required: true,
      implicitValueYAML: "Вертикальная",
    },
```

to:

```ts
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeSE: "ColumnsGroup",
      defaultValue: "Vertical",
      implicitValueYAML: "Вертикальная",
    },
```

- [ ] **Step 3: Remove required from UsualGroup group**

In `packages/core/metadata/forms/elements/usualGroup/rules.ts`, change:

```ts
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeSE: "ChildFormItemsGroup",
      defaultValue: "HorizontalIfPossible",
      // defaultValueXML: "HorizontalIfPossible",
      required: true,
      implicitValueYAML: "ГоризонтальнаяЕслиВозможно",
    },
```

to:

```ts
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeSE: "ChildFormItemsGroup",
      defaultValue: "HorizontalIfPossible",
      // defaultValueXML: "HorizontalIfPossible",
      implicitValueYAML: "ГоризонтальнаяЕслиВозможно",
    },
```

- [ ] **Step 4: Run conflict test**

Run:

```bash
pnpm --filter '@nakidka/core' test -- metadata/orchestration/property/toJSONSchemaRequired.test.ts
```

Expected: conflict test passes; required schema test still fails until Task 3.

- [ ] **Step 5: Commit cleanup**

Run:

```bash
git add packages/core/metadata/forms/elements/autoCommandBar/rules.ts packages/core/metadata/forms/elements/columnGroup/rules.ts packages/core/metadata/forms/elements/usualGroup/rules.ts packages/core/metadata/orchestration/property/toJSONSchemaRequired.test.ts
git commit -m "fix: :bug: убрать конфликт required и implicitValueYAML"
```

## Task 3: Make required YAML fields non-optional in JSON Schema

**Files:**

- Modify: `packages/core/metadata/orchestration/property/toJSONSchema.ts`

- [ ] **Step 1: Update schema generation**

In `packages/core/metadata/orchestration/property/toJSONSchema.ts`, replace:

```ts
if (exportedValue !== undefined) {
  result[yamlKey] = Type.Optional(exportedValue)
}
```

with:

```ts
if (exportedValue !== undefined) {
  result[yamlKey] = ruleProp.required === true ? exportedValue : Type.Optional(exportedValue)
}
```

- [ ] **Step 2: Run property schema test**

Run:

```bash
pnpm --filter '@nakidka/core' test -- metadata/orchestration/property/toJSONSchemaRequired.test.ts
```

Expected: all tests in `toJSONSchemaRequired.test.ts` pass.

- [ ] **Step 3: Commit schema generator change**

Run:

```bash
git add packages/core/metadata/orchestration/property/toJSONSchema.ts packages/core/metadata/orchestration/property/toJSONSchemaRequired.test.ts
git commit -m "fix: :bug: учитывать required в YAML-схеме"
```

## Task 4: Wire MetadataLanguage validation

**Files:**

- Modify: `packages/core/metadata/appliedObjects/metadataLanguage/rules.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`
- Modify: `packages/core/metadata/validation/validateProject.test.ts`

- [ ] **Step 1: Ensure languageCode is required**

In `packages/core/metadata/appliedObjects/metadataLanguage/rules.ts`, ensure `languageCode` is exactly:

```ts
    languageCode: {
      yaml: "КодЯзыка",
      xml: "LanguageCode",
      type: "string",
      required: true,
      xmlParents: properties,
    },
```

Note: the working tree may already contain this user-approved change. Keep it.

- [ ] **Step 2: Run validation tests**

Run:

```bash
pnpm --filter '@nakidka/core' test -- metadata/validation/schemaRegistry.test.ts metadata/validation/validateProject.test.ts
```

Expected: the new `КодЯзыка` tests pass. If `validates every top-level metadata object with YAML directory` fails because it writes `{}` for `Язык`, update that test to skip `Язык` or write `КодЯзыка: ru` only for `Язык`.

Use this replacement if needed:

```ts
for (const dir of topLevelYamlDirs()) {
  const content = dir === "Язык" ? "КодЯзыка: ru\n" : "{}\n"
  writeProjectFile(projectDir, `${dir}/Тест/Свойства.yaml`, content)
}
```

- [ ] **Step 3: Verify CLI-style scenario**

Run:

```bash
pnpm --filter @nakidka/cli exec tsx src/cli.ts validate /home/nikita/git/new-test-yaml
```

Expected output includes:

```text
Язык/Русский/Свойства.yaml:1:1 error: Отсутствует обязательное свойство "КодЯзыка"
summary: 1 error, 0 warning
```

If sandbox blocks `tsx` with `listen EPERM`, rerun the same command with escalated permissions.

- [ ] **Step 4: Commit validation coverage**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataLanguage/rules.ts packages/core/metadata/validation/schemaRegistry.test.ts packages/core/metadata/validation/validateProject.test.ts
git commit -m "fix: :bug: требовать код языка в YAML"
```

## Task 5: Final verification

**Files:**

- No code edits expected.

- [ ] **Step 1: Run focused core tests**

Run:

```bash
pnpm --filter '@nakidka/core' test -- metadata/orchestration/property/toJSONSchemaRequired.test.ts metadata/validation/schemaRegistry.test.ts metadata/validation/validateProject.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 2: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: all package test suites pass.

- [ ] **Step 3: Inspect git state**

Run:

```bash
git status --short --branch
git log --oneline -5
```

Expected: only intended commits are present; no unrelated files are staged. If generated files or unrelated user edits appear, do not revert them without asking.
