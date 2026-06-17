# Validation Project Owner Specs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Подключить к проектной YAML-валидации уже поддержанные типы владельцев `DataPath`, чтобы `ownerCache` мог загружать их `Свойства.yaml`.

**Architecture:** `validationProjectSpecs` остается единственным списком корневых YAML-каталогов, которые валидатор обходит и умеет читать как модели. Новые записи используют существующий `genericImportModel` и готовые `Metadata*Rules`, без новых fromYAML/toYAML правил.

**Tech Stack:** TypeScript, Vitest, `@nakidka/core`, `@nakidka/cli`.

---

### Task 1: Зафиксировать новые project specs тестом

**Files:**
- Modify: `packages/core/metadata/validation/projectSpecs.ts`
- Modify: `packages/core/metadata/validation/projectFiles.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test to `packages/core/metadata/validation/projectFiles.test.ts`:

```ts
it("discovers properties for owner kinds with existing metadata rules", () => {
  const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-project-files-"))

  for (const dir of [
    "Отчет",
    "РегистрБухгалтерии",
    "РегистрРасчета",
    "ПланВидовРасчета",
    "ПланВидовХарактеристик",
    "БизнесПроцесс",
    "Задача",
  ]) {
    touchProjectFile(projectDir, `${dir}/Тест/Свойства.yaml`)
  }

  expect(discoverValidationProjectFiles(projectDir).map((file) => file.projectPath)).toEqual([
    "БизнесПроцесс/Тест/Свойства.yaml",
    "Задача/Тест/Свойства.yaml",
    "Отчет/Тест/Свойства.yaml",
    "ПланВидовРасчета/Тест/Свойства.yaml",
    "ПланВидовХарактеристик/Тест/Свойства.yaml",
    "РегистрБухгалтерии/Тест/Свойства.yaml",
    "РегистрРасчета/Тест/Свойства.yaml",
  ])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectFiles.test.ts
```

Expected: FAIL, because these directories are not yet present in `validationProjectSpecs`.

- [ ] **Step 3: Add specs**

Import existing rules in `packages/core/metadata/validation/projectSpecs.ts` and append entries:

```ts
import { MetadataAccountingRegisterRules } from "~/metadata/appliedObjects/metadataAccountingRegister/rules"
import { MetadataBusinessProcessRules } from "~/metadata/appliedObjects/metadataBusinessProcess/rules"
import { MetadataCalculationRegisterRules } from "~/metadata/appliedObjects/metadataCalculationRegister/rules"
import { MetadataChartOfCalculationTypesRules } from "~/metadata/appliedObjects/metadataChartOfCalculationTypes/rules"
import { MetadataChartOfCharacteristicTypesRules } from "~/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules"
import { MetadataReportRules } from "~/metadata/appliedObjects/metadataReport/rules"
import { MetadataTaskRules } from "~/metadata/appliedObjects/metadataTask/rules"
```

Use `createMetadataItemSchemaExporter(...)` and `genericImportModel(...)` for all new entries.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectFiles.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Commit:

```bash
git add packages/core/metadata/validation/projectSpecs.ts packages/core/metadata/validation/projectFiles.test.ts
git commit -m "feat: :sparkles: подключить владельцев к yaml-валидации"
```

### Task 2: Проверить ownerCache на новых владельцах

**Files:**
- Modify: `packages/core/metadata/validation/projectMetadataResolver.test.ts`

- [ ] **Step 1: Write the failing or guarding test**

Add cases that resolve members through `ОтчетОбъект`, `РегистрБухгалтерии`, and one representative of the other newly connected owner kinds.

- [ ] **Step 2: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectMetadataResolver.test.ts metadata/validation/projectFiles.test.ts
```

Expected: PASS after Task 1.

- [ ] **Step 3: Validate imported ERP YAML**

Run:

```bash
pnpm --filter @nakidka/cli dev validate /home/nikita/git/temp-yaml
```

Expected: no `Не найден владелец` diagnostics for `ОтчетОбъект` or `РегистрБухгалтерии`.

- [ ] **Step 4: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS.
