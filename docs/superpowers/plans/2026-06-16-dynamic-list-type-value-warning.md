# Dynamic List Type Value Warning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить ложную ошибку `Не удалось импортировать форму: Некорректный формат цели метаданных` для type-значений динамического списка на точечный warning о нереализованной проверке.

**Architecture:** Изменение остаётся в metadata-слое и делится на две границы: чтение `MetadataValue ref` принимает YAML object target вида `Документ.X`, а валидатор формы отдельно собирает warning по `ПравоеЗначение` внутри `Реквизиты.*.ДинамическийСписок.УсловноеОформление`. Проверка доступности типа по запросу динамического списка не добавляется.

**Tech Stack:** TypeScript, Vitest, `yaml`, существующие helpers `parseMetadataTargetFromYAML`, `diagnosticAtYamlPath`, CLI `pnpm -s --dir packages/core exec vitest`.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts`
  - Тестирует, что `MetadataValue` читает `Документ.X` как `ref`, а legacy model-root YAML всё ещё падает.
- Modify: `packages/core/metadata/commonObjects/metadataPath/fromYAML.ts`
  - Добавляет узкую поддержку object target при импорте `MetadataValue`-строк.
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
  - Тестирует итоговую диагностику формы через публичный `validateProject`.
- Modify: `packages/core/metadata/validation/validateForm.ts`
  - Собирает warning по исходному YAML условного оформления динамического списка.

## Task 1: MetadataValue accepts YAML object targets as ref values

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/fromYAML.ts`

- [ ] **Step 1: Write the failing test**

In `packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts`, add this test after `imports metadata target value references from YAML` and before `rejects legacy model-root value references in YAML`:

```ts
  it("imports metadata object references from YAML as ref values", () => {
    expect(
      importMetadataValueFromYAML(
        mockContext,
        { type: "MetadataValue", valueType: ["ref"] } as any,
        "Документ.ПоступлениеБезналичныхДенежныхСредств"
      )
    ).toEqual({
      type: "ref",
      value: "Document.ПоступлениеБезналичныхДенежныхСредств",
    })
  })
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm -s --dir /home/nikita/git/nkdk/packages/core exec vitest run metadata/commonObjects/metadataValue/fromYAML.test.ts
```

Expected: FAIL in `imports metadata object references from YAML as ref values` with `Некорректный формат цели метаданных`.

- [ ] **Step 3: Implement the minimal object-target fallback**

In `packages/core/metadata/commonObjects/metadataPath/fromYAML.ts`, replace `importMetadataValueStringFromYAML` with:

```ts
export const importMetadataValueStringFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  const constraint = metadataTargetForRule(rule, metadataValueTargetFallback)
  const valueResult = parseMetadataTargetFromYAML({ value: name, constraint })
  if (valueResult.ok) return valueResult.canonical

  const objectResult = constraint.kind === "value" ? parseMetadataTargetFromYAML({
    value: name,
    constraint: metadataObjectTargetFallback,
  }) : undefined
  if (objectResult?.ok) return objectResult.canonical

  if (!isMetadataTargetLikeYAML(name)) return undefined
  if (context.importFromYAML?.validateMetadataTargets === false) return name

  throw new Error(valueResult.message)
}
```

Leave `parseMetadataTargetStringFromYAML` unchanged in this step. It is still used by object and field imports, where strict behavior should remain as it is.

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm -s --dir /home/nikita/git/nkdk/packages/core exec vitest run metadata/commonObjects/metadataValue/fromYAML.test.ts
```

Expected: PASS for all tests in `fromYAML.test.ts`, including `rejects legacy model-root value references in YAML`.

- [ ] **Step 5: Refactor only if the implementation duplicated strict-target handling**

If Step 3 duplicated strict-target handling and you want to reduce it, replace `importMetadataValueStringFromYAML` and `parseMetadataTargetStringFromYAML` with this shared helper version:

```ts
export const importMetadataValueStringFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  name: string
): string | undefined => {
  const constraint = metadataTargetForRule(rule, metadataValueTargetFallback)
  const valueResult = parseMetadataTargetFromYAML({ value: name, constraint })
  if (valueResult.ok) return valueResult.canonical

  const objectResult = constraint.kind === "value" ? parseMetadataTargetFromYAML({
    value: name,
    constraint: metadataObjectTargetFallback,
  }) : undefined
  if (objectResult?.ok) return objectResult.canonical

  return parseMetadataTargetStringResultFromYAML({
    context,
    name,
    result: valueResult,
  })
}

function parseMetadataTargetStringFromYAML(
  context: ConfigurationContext,
  name: string,
  constraint: MetadataTargetConstraint,
  owner?: MetadataTargetOwner
): string | undefined {
  return parseMetadataTargetStringResultFromYAML({
    context,
    name,
    result: parseMetadataTargetFromYAML({ value: name, constraint, owner }),
  })
}

function parseMetadataTargetStringResultFromYAML(params: {
  context: ConfigurationContext
  name: string
  result: ReturnType<typeof parseMetadataTargetFromYAML>
}): string | undefined {
  if (params.result.ok) return params.result.canonical
  if (!isMetadataTargetLikeYAML(params.name)) return undefined
  if (params.context.importFromYAML?.validateMetadataTargets === false) return params.name

  throw new Error(params.result.message)
}
```

Run the same focused test again after refactor.

```bash
pnpm -s --dir /home/nikita/git/nkdk/packages/core exec vitest run metadata/commonObjects/metadataValue/fromYAML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git add packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts packages/core/metadata/commonObjects/metadataPath/fromYAML.ts
git commit -m "fix: импортировать object target как MetadataValue ref"
```

## Task 2: validateProject emits warning for dynamic-list type values

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
- Modify: `packages/core/metadata/validation/validateForm.ts`

- [ ] **Step 1: Write the failing validator test**

In `packages/core/metadata/validation/validateProject.test.ts`, add this test after `validates a single form with schema and DataPath rules` and before `does not add a form import diagnostic when schema errors already explain the invalid form shape`:

```ts
  it("warns about unimplemented dynamic list type-value checks instead of failing form import", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаСписка/Форма.yaml", [
      "Реквизиты:",
      "  Список:",
      "    Тип: ДинамическийСписок",
      "    ОсновнойРеквизит: Истина",
      "    ДинамическийСписок:",
      "      УсловноеОформление:",
      "        Элементы:",
      "          - Поля:",
      "              - Тип",
      "            Отбор:",
      "              Элементы:",
      "                - ЛевоеЗначение: .Тип",
      "                  ПравоеЗначение: Документ.ПоступлениеБезналичныхДенежныхСредств",
      "            Оформление:",
      "              Текст: '\"Поступление\"'",
      "Элементы:",
      "  Список:",
      "    Вид: ТаблицаФормы",
      "    ПутьКДанным: Список",
    ])

    const diagnostics = validateProject({
      projectDir,
      filePath: "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "structure",
          severity: "warning",
          path: "/Реквизиты/Список/ДинамическийСписок/УсловноеОформление/Элементы/0/Отбор/Элементы/0/ПравоеЗначение",
          message:
            'Проверка значения типа "Документ.ПоступлениеБезналичныхДенежныхСредств" в условном оформлении динамического списка пока не реализована и будет добавлена в будущих версиях',
        }),
      ]),
    )
    expect(diagnostics.map((diagnostic) => diagnostic.message)).not.toEqual(
      expect.arrayContaining([expect.stringContaining("Не удалось импортировать форму")]),
    )
  })
```

- [ ] **Step 2: Run the focused validator test and verify it fails**

Run:

```bash
pnpm -s --dir /home/nikita/git/nkdk/packages/core exec vitest run metadata/validation/validateProject.test.ts -t "warns about unimplemented dynamic list type-value checks"
```

Expected before implementation: FAIL because the warning is absent. If Task 1 has not been implemented, this may fail with `Не удалось импортировать форму`; complete Task 1 first.

- [ ] **Step 3: Add imports to validateForm**

In `packages/core/metadata/validation/validateForm.ts`, add these imports near existing imports:

```ts
import { rootFromYAML } from "~/metadata/commonObjects/metadataTargets/roots"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import { diagnosticAtYamlPath, type YamlPath } from "./yamlLocations"
```

- [ ] **Step 4: Add warning collection to the validateForm result**

In `packages/core/metadata/validation/validateForm.ts`, after:

```ts
  const diagnostics = [...index.duplicateDiagnostics]
```

insert:

```ts
  diagnostics.push(
    ...collectDynamicListTypeValueWarnings({
      filePath: entry.filePath,
      parsed: entry.parsed,
    }),
  )
```

- [ ] **Step 5: Add helper functions to validateForm**

In `packages/core/metadata/validation/validateForm.ts`, add these helpers before `function importForm`:

```ts
function collectDynamicListTypeValueWarnings(params: {
  filePath: string
  parsed: ParsedYaml
}): Diagnostic[] {
  const data = params.parsed.data
  if (!isRecord(data)) return []

  const attributes = data["Реквизиты"]
  if (!isRecord(attributes)) return []

  const diagnostics: Diagnostic[] = []
  for (const [attributeName, attributeValue] of Object.entries(attributes)) {
    if (!isRecord(attributeValue)) continue

    const dynamicList = attributeValue["ДинамическийСписок"]
    if (!isRecord(dynamicList)) continue

    const conditionalAppearance = dynamicList["УсловноеОформление"]
    if (!isRecord(conditionalAppearance)) continue

    diagnostics.push(
      ...collectConditionalAppearanceTypeValueWarnings({
        filePath: params.filePath,
        parsed: params.parsed,
        rootPath: ["Реквизиты", attributeName, "ДинамическийСписок", "УсловноеОформление"],
        value: conditionalAppearance,
      }),
    )
  }

  return diagnostics
}

function collectConditionalAppearanceTypeValueWarnings(params: {
  filePath: string
  parsed: ParsedYaml
  rootPath: YamlPath
  value: unknown
}): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  visitConditionalAppearanceNode({
    filePath: params.filePath,
    parsed: params.parsed,
    path: params.rootPath,
    value: params.value,
    diagnostics,
  })
  return diagnostics
}

function visitConditionalAppearanceNode(params: {
  filePath: string
  parsed: ParsedYaml
  path: YamlPath
  value: unknown
  diagnostics: Diagnostic[]
}): void {
  if (Array.isArray(params.value)) {
    params.value.forEach((item, index) => {
      visitConditionalAppearanceNode({
        ...params,
        path: [...params.path, index],
        value: item,
      })
    })
    return
  }

  if (!isRecord(params.value)) return

  const rightValue = params.value["ПравоеЗначение"]
  if (isMetadataObjectTargetYAML(rightValue)) {
    params.diagnostics.push(
      diagnosticAtYamlPath({
        filePath: params.filePath,
        parsed: params.parsed,
        path: [...params.path, "ПравоеЗначение"],
        severity: "warning",
        source: "structure",
        message: `Проверка значения типа "${rightValue}" в условном оформлении динамического списка пока не реализована и будет добавлена в будущих версиях`,
      }),
    )
  }

  for (const [key, value] of Object.entries(params.value)) {
    if (key === "ПравоеЗначение") continue
    visitConditionalAppearanceNode({
      ...params,
      path: [...params.path, key],
      value,
    })
  }
}

function isMetadataObjectTargetYAML(value: unknown): value is string {
  if (typeof value !== "string") return false

  const parts = value.split(".")
  if (parts.length !== 2) return false

  const [root, name] = parts
  return rootFromYAML[root] !== undefined && /^[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$/.test(name)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
```

- [ ] **Step 6: Run the focused validator test and verify it passes**

Run:

```bash
pnpm -s --dir /home/nikita/git/nkdk/packages/core exec vitest run metadata/validation/validateProject.test.ts -t "warns about unimplemented dynamic list type-value checks"
```

Expected: PASS.

- [ ] **Step 7: Run the full validation test file**

Run:

```bash
pnpm -s --dir /home/nikita/git/nkdk/packages/core exec vitest run metadata/validation/validateProject.test.ts
```

Expected: PASS for all tests in `validateProject.test.ts`.

- [ ] **Step 8: Commit Task 2**

```bash
git add packages/core/metadata/validation/validateProject.test.ts packages/core/metadata/validation/validateForm.ts
git commit -m "fix: предупреждать о непроверенных type-значениях динамического списка"
```

## Task 3: Verify ERP regression and full suite

**Files:**
- No code changes expected.

- [ ] **Step 1: Re-run both focused test files**

Run:

```bash
pnpm -s --dir /home/nikita/git/nkdk/packages/core exec vitest run metadata/commonObjects/metadataValue/fromYAML.test.ts metadata/validation/validateProject.test.ts
```

Expected: PASS.

- [ ] **Step 2: Validate the three formerly failing ERP forms one by one**

Run:

```bash
pnpm -s --dir /home/nikita/git/nkdk/packages/cli exec tsx src/cli.ts validate /home/nikita/git/temp-yaml --file 'ЖурналДокументов/АнкетыПерсонифицированногоУчета/Формы/ФормаСписка/Форма.yaml'
pnpm -s --dir /home/nikita/git/nkdk/packages/cli exec tsx src/cli.ts validate /home/nikita/git/temp-yaml --file 'ЖурналДокументов/ПерсонифицированныйУчет/Формы/ФормаСписка/Форма.yaml'
pnpm -s --dir /home/nikita/git/nkdk/packages/cli exec tsx src/cli.ts validate /home/nikita/git/temp-yaml --file 'Обработка/ЖурналДокументовПлатежи/Формы/ФормаСписка/Форма.yaml'
```

Expected: output contains the new warning text and does not contain `Не удалось импортировать форму: Некорректный формат цели метаданных`.

- [ ] **Step 3: Re-run full ERP validation and regroup the target error type**

Run:

```bash
pnpm -s --dir /home/nikita/git/nkdk/packages/cli exec tsx src/cli.ts validate /home/nikita/git/temp-yaml > /tmp/erp-validate-after-dynamic-list-warning.log 2>&1
rg -n "Не удалось импортировать форму: Некорректный формат цели метаданных|Проверка значения типа" /tmp/erp-validate-after-dynamic-list-warning.log
tail -5 /tmp/erp-validate-after-dynamic-list-warning.log
```

Expected:

- no lines with `Не удалось импортировать форму: Некорректный формат цели метаданных`;
- at least the three known forms have warning lines with `Проверка значения типа`;
- `summary:` is still printed.

- [ ] **Step 4: Run all tests from repository root**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 5: Commit verification notes if no code changed**

If Task 3 produced no file changes, do not create an empty commit. Record the exact commands and outcomes in the final response.
