# Core Metadata Import Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать ложную зависимость `commonObjects -> forms/elements` и зафиксировать её статическим тестом границ импортов.

**Architecture:** Первый срез не меняет поведение XML/YAML-преобразований. Он добавляет узкий тест границ в `packages/core/metadata` и механически переводит импорты `PropertyRule` из формового переэкспорта на настоящий источник `orchestration/property/types`.

**Tech Stack:** TypeScript, Vitest, pnpm, `rg`, существующие metadata registry и rules.

---

## Scope

Этот план реализует только первый срез из спеки `docs/superpowers/specs/2026-06-11-core-metadata-boundaries-design.md`.

Не делать в этом плане:

- не менять XML/YAML-фикстуры;
- не менять формат `rules.ts`;
- не переносить `formElement`;
- не трогать `XmlSyncManifest`, `syncAppliedObjectToXML`, registry-типы и явную регистрацию metadata;
- не править публичный API CLI или расширения VS Code.

## File Structure

- Create: `packages/core/metadata/importBoundaries.test.ts`
  - Статический Vitest-тест границ импортов для `metadata/commonObjects`.
  - Сканирует `.ts` файлы в `metadata/commonObjects`, кроме `.test.ts`.
  - Падает, если находит импорт конкретных элементов формы.
- Modify: `packages/core/metadata/commonObjects/**/*.ts`
  - Только механическая замена:
    - было: `import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"`
    - стало: `import { PropertyRule } from "~/metadata/orchestration/property/types"`
  - Другие импорты из `orchestration/formElement/factory` пока не трогать: они относятся к следующему срезу.
- Reference only: `packages/core/metadata/forms/elements/calendarField/rules.ts`
  - Этот файл сейчас переэкспортирует `PropertyRule`, но не владеет типом.
- Reference only: `packages/core/metadata/orchestration/property/types.ts`
  - Настоящий владелец типа `PropertyRule`.

## Task 0: Подготовить контекст

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `docs/superpowers/specs/2026-06-11-core-metadata-boundaries-design.md`
- Read: `packages/core/metadata/orchestration/graphImport/noConcreteMetadataImports.test.ts`

- [ ] **Step 1: Read metadata knowledge index**

Run from repo root:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
```

Expected: документ открывается без ошибки. Следовать перечисленным там документам, если они применимы к статическим тестам границ или `commonObjects`.

- [ ] **Step 2: Re-read the approved spec section**

Run:

```bash
sed -n '1,170p' docs/superpowers/specs/2026-06-11-core-metadata-boundaries-design.md
```

Expected: видно цели, не цели и срез 1.

- [ ] **Step 3: Inspect the existing boundary-test style**

Run:

```bash
sed -n '1,220p' packages/core/metadata/orchestration/graphImport/noConcreteMetadataImports.test.ts
```

Expected: существующий тест использует `fs`, `path`, `vitest` и `process.cwd()`.

## Task 1: Add Failing Import Boundary Test

**Files:**
- Create: `packages/core/metadata/importBoundaries.test.ts`
- Test: `packages/core/metadata/importBoundaries.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/metadata/importBoundaries.test.ts` with this content:

```ts
import { readdirSync, readFileSync, statSync } from "fs"
import { join, relative } from "path"
import { describe, expect, it } from "vitest"

const METADATA_DIR = join(process.cwd(), "metadata")
const COMMON_OBJECTS_DIR = join(METADATA_DIR, "commonObjects")

const FORBIDDEN_COMMON_OBJECT_IMPORTS = [
  "~/metadata/forms/elements/",
  "../forms/elements/",
] as const

describe("metadata import boundaries", () => {
  it("commonObjects не импортирует конкретные элементы формы", () => {
    const offenders = listTypeScriptFiles(COMMON_OBJECTS_DIR)
      .map((filePath) => ({
        filePath: relative(process.cwd(), filePath),
        forbiddenImports: findForbiddenImports(readFileSync(filePath, "utf-8")),
      }))
      .filter(({ forbiddenImports }) => forbiddenImports.length > 0)

    expect(offenders).toEqual([])
  })
})

function findForbiddenImports(content: string): string[] {
  return FORBIDDEN_COMMON_OBJECT_IMPORTS.filter((importPath) => content.includes(importPath))
}

function listTypeScriptFiles(dir: string): string[] {
  const result: string[] = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      result.push(...listTypeScriptFiles(fullPath))
      continue
    }
    if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
      result.push(fullPath)
    }
  }
  return result
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts --no-isolate
```

Expected: FAIL. The failure should list files under `metadata/commonObjects`, including at least:

```text
metadata/commonObjects/metadataField/toXML.ts
```

- [ ] **Step 3: Commit is not allowed yet**

Do not commit a failing test. Continue to Task 2.

## Task 2: Replace Wrong PropertyRule Imports

**Files:**
- Modify: `packages/core/metadata/commonObjects/**/*.ts`
- Test: `packages/core/metadata/importBoundaries.test.ts`

- [ ] **Step 1: Confirm the current offenders**

Run:

```bash
rg -n "\"~/metadata/forms/elements/calendarField/rules\"" packages/core/metadata/commonObjects
```

Expected: output shows only imports that use `PropertyRule` from `calendarField/rules`.

- [ ] **Step 2: Apply the mechanical replacement**

Run:

```bash
rg -l "\"~/metadata/forms/elements/calendarField/rules\"" packages/core/metadata/commonObjects \
  | xargs perl -0pi -e 's#"~/metadata/forms/elements/calendarField/rules"#"~/metadata/orchestration/property/types"#g'
```

Expected: no command output.

- [ ] **Step 3: Verify no forbidden import remains in commonObjects**

Run:

```bash
rg -n "\"~/metadata/forms/elements/calendarField/rules\"" packages/core/metadata/commonObjects
```

Expected: no output and exit code `1`.

- [ ] **Step 4: Check the sample file**

Run:

```bash
sed -n '1,12p' packages/core/metadata/commonObjects/metadataField/toXML.ts
```

Expected: first import is:

```ts
import { PropertyRule } from "~/metadata/orchestration/property/types"
```

- [ ] **Step 5: Run the boundary test to verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 6: Commit the first working slice**

Run:

```bash
git add packages/core/metadata/importBoundaries.test.ts packages/core/metadata/commonObjects
git commit -m "test: :white_check_mark: зафиксировать границу commonObjects"
```

Expected: commit succeeds.

## Task 3: Focused Verification

**Files:**
- Test: `packages/core/metadata/importBoundaries.test.ts`
- Test: `packages/core/metadata/commonObjects/**/*.test.ts`

- [ ] **Step 1: Run the boundary test again**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 2: Run commonObjects tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects --no-isolate
```

Expected: PASS. If this fails, stop and diagnose the failure before continuing; do not broaden the scope of this plan.

- [ ] **Step 3: Verify there are no accidental XML/YAML fixture changes**

Run:

```bash
git status --short
```

Expected: no changed files under fixture directories unless they are unrelated pre-existing user changes. Do not modify XML/YAML fixtures for this task.

## Task 4: Full Verification

**Files:**
- Test: root package scripts

- [ ] **Step 1: Run core package tests**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS.

- [ ] **Step 2: Run full repository tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Verify final import boundary**

Run:

```bash
rg -n "\"~/metadata/forms/elements/calendarField/rules\"" packages/core/metadata/commonObjects
```

Expected: no output and exit code `1`.

- [ ] **Step 4: Verify git status**

Run:

```bash
git status --short
```

Expected: clean worktree after the implementation commit, or only known unrelated user changes.

## Self-Review Checklist

- [ ] Spec coverage: implements срез 1 from `2026-06-11-core-metadata-boundaries-design.md`.
- [ ] Boundary test fails before import replacement and passes after replacement.
- [ ] No XML/YAML fixtures are changed.
- [ ] No `rules.ts` behavior changes are introduced.
- [ ] Full `pnpm test` passes before the task is considered complete.

## Follow-Up Plans

After this plan lands, create separate plans for:

1. `syncAppliedObjectToXML` migration dependency inversion.
2. `formElement` split into `property/typeRuleRegistry` and forms layer.
3. Registry contract split.
4. Explicit `registerCoreMetadata()` entrypoint.
