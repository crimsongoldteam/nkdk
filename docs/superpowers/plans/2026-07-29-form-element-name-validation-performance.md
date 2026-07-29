# Form Element Name Validation Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать второй рекурсивный обход формы из проверки уникальности имён и повторно измерить compiled standalone validation.

**Architecture:** Существующий обход `collectFormPendingChecks` одновременно собирает явные и зарезервированные single-имена. Отдельный сборщик хранит occurrences и после обхода формирует диагностики; именованный подшаг профиля измеряет только эту завершающую обработку.

**Tech Stack:** TypeScript 6, Vitest, pnpm, Ajv standalone, существующие `rules.ts`.

## Global Constraints

- Область уникальности — один `Форма.yaml`.
- Сравнение имён выполняется без учёта регистра.
- Отсутствующие single-имена и их рекурсивные single-имена всегда резервируются.
- Существующие XML-фикстуры не изменяются.
- Общий validation-слой не знает конкретных видов или суффиксов элементов.
- Профиль выполняется только через compiled standalone validation.

---

### Task 1: Объединить обходы

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/validateElementNames.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Test: `packages/core/metadata/validation/yamlFactExtractor.form.test.ts`
- Test: `packages/core/metadata/validation/validateForm.test.ts`

**Interfaces:**
- Consumes: `MetadataItemRule`, `NestedItemIdentityDescriptor`, YAML-пути существующего обхода.
- Produces: `FormElementNameCollector`, который принимает occurrences и возвращает `Diagnostic[]`.

- [x] **Step 1: Подтвердить RED существующими поведенческими тестами**

Временно удалить отдельный вызов `validateFormElementNames` из `extractFormYamlFacts`.

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/yamlFactExtractor.form.test.ts
```

Expected: три теста уникальности имён падают из-за отсутствующих диагностик.

- [x] **Step 2: Выделить сборщик имён**

Заменить публичную функцию полного обхода на `createFormElementNameCollector`, который предоставляет операции добавления явного и зарезервированного имени и `finish(): Diagnostic[]`.

- [x] **Step 3: Подключить сборщик к существующему обходу**

Передавать сборщик, `ownerName`, `ownerPath` и стек single-правил через `collectNestedFormElementChecks`. Добавлять явные имена перед разрешением типа элемента, резервировать single-имена до проверки наличия YAML-блока и рекурсивно обходить правила отсутствующих single-элементов.

- [x] **Step 4: Подтвердить GREEN**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/yamlFactExtractor.form.test.ts metadata/validation/validateForm.test.ts
```

Expected: все тесты проходят.

### Task 2: Проверка и повторный профиль

**Files:**
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Verify: `packages/core/metadata/project/preparedYamlProjectWorker.test.ts`

**Interfaces:**
- Consumes: `FormElementNameCollector.finish()`.
- Produces: конечное значение именованного подшага `Проверка уникальности имён элементов формы` и профиль compiled standalone.

- [x] **Step 1: Проверить типы и целевые тесты**

Run:

```bash
pnpm --filter @nkdk/core exec tsc --noEmit
pnpm --filter @nkdk/core exec vitest run metadata/validation/yamlFactExtractor.form.test.ts metadata/validation/validateForm.test.ts metadata/project/preparedYamlProjectWorker.test.ts metadata/forms/elements/orchestration/singletonName.test.ts
```

Expected: команды завершаются с кодом `0`, 92 теста проходят.

- [x] **Step 2: Собрать compiled standalone**

Run:

```bash
pnpm --filter @nkdk/core build
```

Expected: сборка завершается с кодом `0`.

- [x] **Step 3: Повторить профиль**

Run:

```bash
node .agents/skills/validation-profile/validation-profile.mjs /Users/nikita/git/nkdk-yaml --runs 5 --timing --json
```

Expected: профиль содержит конечное числовое время шага `Проверка уникальности имён элементов формы`; число диагностик нового правила определяется отдельно и не смешивается с общим числом validation-диагностик.
