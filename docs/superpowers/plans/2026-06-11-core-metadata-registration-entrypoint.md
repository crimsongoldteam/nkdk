# Core Metadata Registration Entrypoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить явный вход `registerCoreMetadata()` и начать замену неявной регистрации metadata побочными импортами.

**Architecture:** Первый шаг сохраняет совместимость: существующие `index.ts` продолжают выполнять статические импорты, но рядом появляется явная функция регистрации области и общий вход `metadata/register.ts`. Новые внутренние точки входа начинают вызывать `registerCoreMetadata()` явно, а массовый перенос 431 побочного импорта делается отдельными малыми изменениями после появления идемпотентных owner-регистраций.

**Tech Stack:** TypeScript, Vitest, pnpm, metadata registries, package public exports.

---

## Scope

Этот план реализует срез 5 из спеки `docs/superpowers/specs/2026-06-11-core-metadata-boundaries-design.md`.

Не делать в этом плане:

- не переписывать все побочные `import "./..."` на ручные вызовы в одном изменении;
- не удалять совместимый side-effect запуск из `packages/core/index.ts`;
- не менять публичный контракт CLI и расширения VS Code;
- не менять формат `rules.ts`;
- не менять XML/YAML-фикстуры.

## File Structure

- Create: `packages/core/metadata/register.ts`
  - Публичный вход `registerCoreMetadata()`.
  - Фиксирует порядок: common objects, forms, applied objects.
- Modify: `packages/core/metadata/commonObjects/index.ts`
  - Экспортирует `registerCommonObjects()`.
- Modify: `packages/core/metadata/forms/index.ts`
  - Экспортирует `registerForms()`.
- Modify: `packages/core/metadata/appliedObjects/index.ts`
  - Экспортирует `registerAppliedObjects()`.
- Modify: `packages/core/index.ts`
  - Импортирует и вызывает `registerCoreMetadata()` вместо голого `import "./metadata/appliedObjects"`.
  - Экспортирует `registerCoreMetadata`.
- Create: `packages/core/metadata/register.test.ts`
  - Проверяет идемпотентность переходного входа и наличие базовой регистрации.
- Modify: `packages/core/metadata/importBoundaries.test.ts`
  - Запрещает новые production-импорты широких metadata entrypoint-ов только ради регистрации вне разрешённых входов.

## Task 0: Подготовить контекст

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `packages/core/index.ts`
- Read: `packages/core/metadata/appliedObjects/index.ts`
- Read: `packages/core/metadata/commonObjects/index.ts`
- Read: `packages/core/metadata/forms/index.ts`

- [ ] **Step 1: Read metadata knowledge**

Run:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
```

Expected: документ открыт.

- [ ] **Step 2: Count current side-effect imports**

Run:

```bash
rg -n '^import "' packages/core/index.ts packages/core/metadata/appliedObjects/index.ts packages/core/metadata/commonObjects/index.ts packages/core/metadata/forms/index.ts packages/core/metadata/forms/elements/index.ts | wc -l
```

Expected: output is a large number. This confirms the plan must keep compatibility and avoid one giant rewrite.

## Task 1: Add Idempotent Area Registration Functions

**Files:**
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/forms/index.ts`
- Modify: `packages/core/metadata/appliedObjects/index.ts`

- [ ] **Step 1: Add common objects registration marker**

At the end of `packages/core/metadata/commonObjects/index.ts`, add:

```ts
let commonObjectsRegistered = false

export function registerCommonObjects(): void {
  if (commonObjectsRegistered) return
  commonObjectsRegistered = true
}
```

- [ ] **Step 2: Add forms registration marker**

At the end of `packages/core/metadata/forms/index.ts`, add:

```ts
let formsRegistered = false

export function registerForms(): void {
  if (formsRegistered) return
  formsRegistered = true
}
```

- [ ] **Step 3: Add applied objects registration marker**

At the end of `packages/core/metadata/appliedObjects/index.ts`, add:

```ts
let appliedObjectsRegistered = false

export function registerAppliedObjects(): void {
  if (appliedObjectsRegistered) return
  appliedObjectsRegistered = true
}
```

- [ ] **Step 4: Run type check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

## Task 2: Add Core Metadata Registration Entrypoint

**Files:**
- Create: `packages/core/metadata/register.ts`
- Modify: `packages/core/index.ts`

- [ ] **Step 1: Create registerCoreMetadata**

Create `packages/core/metadata/register.ts`:

```ts
import { registerAppliedObjects } from "./appliedObjects"
import { registerCommonObjects } from "./commonObjects"
import { registerForms } from "./forms"

let coreMetadataRegistered = false

export function registerCoreMetadata(): void {
  if (coreMetadataRegistered) return
  coreMetadataRegistered = true

  registerCommonObjects()
  registerForms()
  registerAppliedObjects()
}
```

- [ ] **Step 2: Replace root side-effect import**

In `packages/core/index.ts`, replace the first line:

```ts
import "./metadata/appliedObjects"
```

with:

```ts
import { registerCoreMetadata } from "./metadata/register"

registerCoreMetadata()
```

- [ ] **Step 3: Export the explicit registration function**

In `packages/core/index.ts`, add near other exports:

```ts
export { registerCoreMetadata } from "./metadata/register"
```

- [ ] **Step 4: Run type check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

## Task 3: Add Registration Entrypoint Test

**Files:**
- Create: `packages/core/metadata/register.test.ts`

- [ ] **Step 1: Write the test**

Create `packages/core/metadata/register.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { registerCoreMetadata } from "~/metadata/register"
import { getTypeRule } from "~/metadata/orchestration"

describe("registerCoreMetadata", () => {
  it("can be called more than once and keeps registered metadata behavior available", () => {
    registerCoreMetadata()
    registerCoreMetadata()

    expect(getTypeRule("I8nText", "exportToXML")).toBeDefined()
    expect(getTypeRule("ClientApplicationForm", "exportToXML")).toBeDefined()
  })
})
```

- [ ] **Step 2: Run the test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/register.test.ts --no-isolate
```

Expected: PASS.

## Task 4: Add Boundary Check for New Registration Imports

**Files:**
- Modify: `packages/core/metadata/importBoundaries.test.ts`

- [ ] **Step 1: Add allowed files**

Add near constants:

```ts
const REGISTRATION_ENTRYPOINT_ALLOWLIST = new Set([
  "index.ts",
  "metadata/register.ts",
  "metadata/register.test.ts",
  "tests/setupTests.ts",
  "metadata/validation/schemaRegistry.ts",
  "metadata/validation/projectSpecs.ts",
  "metadata/validation/validateForm.ts",
  "metadata/validation/dataPath/formTraversal.ts",
  "metadata/forms/clientApplicationForm/convertFromXML.ts",
  "metadata/validation/schemaRegistry.test.ts",
  "metadata/validation/validateForm.test.ts",
  "metadata/validation/dataPath/formTraversal.test.ts",
  "metadata/commonObjects/metadataField/graphFromModel.unit.test.ts",
  "metadata/appliedObjects/metadataWebSocketClient/fromYAML.test.ts",
  "metadata/appliedObjects/metadataWebSocketClient/toYAML.test.ts",
  "metadata/appliedObjects/metadataXDTOPackage/fromYAML.test.ts",
  "metadata/appliedObjects/metadataXDTOPackage/toYAML.test.ts",
  "metadata/appliedObjects/metadataCommonCommand/fromYAML.test.ts",
  "metadata/appliedObjects/metadataCommonModule/fromYAML.test.ts",
  "metadata/appliedObjects/metadataCommonModule/toYAML.test.ts",
  "metadata/appliedObjects/metadataExternalDataSource/fromYAML.test.ts",
  "metadata/appliedObjects/metadataExternalDataSource/toYAML.test.ts",
])

const BROAD_METADATA_REGISTRATION_IMPORTS = [
  "~/metadata/appliedObjects",
  "~/metadata/commonObjects",
  "~/metadata/forms",
] as const
```

- [ ] **Step 2: Add helper for relative repo paths**

Add below `listTypeScriptFiles`:

```ts
function listCoreTypeScriptFiles(): string[] {
  return listTypeScriptFiles(process.cwd())
    .map((filePath) => relative(process.cwd(), filePath))
    .filter((filePath) => !filePath.includes("/node_modules/"))
}
```

- [ ] **Step 3: Add boundary test**

Add inside `describe("metadata import boundaries", () => { ... })`:

```ts
it("новые широкие metadata-регистрации идут через metadata/register", () => {
  const offenders = listCoreTypeScriptFiles()
    .filter((filePath) => !REGISTRATION_ENTRYPOINT_ALLOWLIST.has(filePath))
    .map((filePath) => ({
      filePath,
      forbiddenImports: BROAD_METADATA_REGISTRATION_IMPORTS.filter((importPath) =>
        readFileSync(join(process.cwd(), filePath), "utf-8").includes(`"${importPath}"`)
      ),
    }))
    .filter(({ forbiddenImports }) => forbiddenImports.length > 0)

  expect(offenders).toEqual([])
})
```

- [ ] **Step 4: Run boundary test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS. The allowlist contains the broad registration imports that exist before this plan and should shrink in separate owner-registration changes.

## Task 5: Verify Compatibility

**Files:**
- Test: `packages/core/metadata/register.test.ts`
- Test: public package exports

- [ ] **Step 1: Run registration test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/register.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 2: Run type check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 3: Run package tests**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS.

- [ ] **Step 4: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS.

## Task 6: Commit

**Files:**
- Stage all files changed in this plan.

- [ ] **Step 1: Inspect diff**

Run:

```bash
git diff -- packages/core/index.ts packages/core/metadata/register.ts packages/core/metadata/register.test.ts packages/core/metadata/appliedObjects/index.ts packages/core/metadata/commonObjects/index.ts packages/core/metadata/forms/index.ts packages/core/metadata/importBoundaries.test.ts
```

Expected: diff shows explicit registration entrypoint and compatibility-preserving area functions.

- [ ] **Step 2: Commit**

Run:

```bash
git add packages/core/index.ts packages/core/metadata/register.ts packages/core/metadata/register.test.ts packages/core/metadata/appliedObjects/index.ts packages/core/metadata/commonObjects/index.ts packages/core/metadata/forms/index.ts packages/core/metadata/importBoundaries.test.ts
git commit -m "feat: :sparkles: добавить явную регистрацию metadata"
```

Expected: commit succeeds.
