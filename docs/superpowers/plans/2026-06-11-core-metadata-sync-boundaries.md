# Core Metadata Sync Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать зависимость `orchestration/appliedObject` от миграций configuration и заменить утёкший `XmlSyncManifest` нейтральным контрактом записи XML.

**Architecture:** `syncAppliedObjectToXML` остаётся универсальным sync-входом и принимает переходник `referenceModelRemapper`, не зная о configuration migrations. Все слои ниже configuration типизируют `xmlManifest` через маленький интерфейс `XmlWriteManifest`, а конкретный `XmlSyncManifest` остаётся в `appliedObjects/configuration/migrations`.

**Tech Stack:** TypeScript, Vitest, pnpm, `rg`, metadata orchestration, XML/YAML sync.

---

## Scope

Этот план реализует срез 2 из спеки `docs/superpowers/specs/2026-06-11-core-metadata-boundaries-design.md`.

Не делать в этом плане:

- не переносить `formElement`;
- не менять registry-типы;
- не менять формат `rules.ts`;
- не менять XML/YAML-фикстуры;
- не менять публичный контракт CLI и расширения VS Code.

## File Structure

- Modify: `packages/core/metadata/importBoundaries.test.ts`
  - Добавляет запрет на импорт `appliedObjects/configuration/*` из `orchestration/appliedObject`.
- Create: `packages/core/metadata/orchestration/xmlWriteManifest.ts`
  - Нейтральный контракт `XmlWriteManifest` с методом `addFile(absPath: string): void`.
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
  - `SyncExternalToXMLFunction` использует `XmlWriteManifest`.
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
  - Убирает импорт `remapReferenceModel`.
  - Добавляет тип `ReferenceModelRemapper`.
  - Меняет параметры `currentObjectPath` и `referencePathByCurrentPath` на `referenceModelRemapper`.
  - Заменяет inline-тип `XmlSyncManifest` на `XmlWriteManifest`.
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
  - Подключает `remapReferenceModel` и передаёт его в `syncAppliedObjectToXML` через замыкание.
- Modify: `packages/core/metadata/commonObjects/**/*.ts`
  - Заменяет типы `XmlSyncManifest` на `XmlWriteManifest` в production-коде.
- Modify: `packages/core/metadata/forms/**/*.ts`
  - Заменяет типы `XmlSyncManifest` на `XmlWriteManifest` в production-коде.

## Task 0: Подготовить контекст

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `.agents/architecture-orchestration.md`
- Read: `docs/superpowers/specs/2026-06-11-core-metadata-boundaries-design.md`

- [ ] **Step 1: Read metadata knowledge**

Run:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
```

Expected: документ открыт. Следовать указанным там материалам для изменений в `packages/core/metadata/**`.

- [ ] **Step 2: Read orchestration invariants**

Run:

```bash
sed -n '1,220p' .agents/architecture-orchestration.md
```

Expected: видно правило, что `orchestration` не импортирует конкретные applied/form/common реализации.

- [ ] **Step 3: Read slice 2**

Run:

```bash
rg -n "Срез 2|XmlWriteManifest|referenceModelRemapper" docs/superpowers/specs/2026-06-11-core-metadata-boundaries-design.md
```

Expected: вывод показывает требования к `referenceModelRemapper` и `XmlWriteManifest`.

## Task 1: Add Failing Sync Boundary Test

**Files:**
- Modify: `packages/core/metadata/importBoundaries.test.ts`
- Test: `packages/core/metadata/importBoundaries.test.ts`

- [ ] **Step 1: Replace the boundary test with the combined version**

Replace `packages/core/metadata/importBoundaries.test.ts` with:

```ts
import { readdirSync, readFileSync, statSync } from "fs"
import { join, relative } from "path"
import { describe, expect, it } from "vitest"

const METADATA_DIR = join(process.cwd(), "metadata")
const COMMON_OBJECTS_DIR = join(METADATA_DIR, "commonObjects")
const ORCHESTRATION_APPLIED_OBJECT_DIR = join(METADATA_DIR, "orchestration", "appliedObject")

const FORBIDDEN_COMMON_OBJECT_IMPORTS = [
  "~/metadata/forms/elements/",
  "../forms/elements/",
] as const

const FORBIDDEN_ORCHESTRATION_APPLIED_OBJECT_IMPORTS = [
  "~/metadata/appliedObjects/configuration/",
  "../../appliedObjects/configuration/",
] as const

describe("metadata import boundaries", () => {
  it("commonObjects не импортирует конкретные элементы формы", () => {
    expect(findImportOffenders(COMMON_OBJECTS_DIR, FORBIDDEN_COMMON_OBJECT_IMPORTS)).toEqual([])
  })

  it("orchestration/appliedObject не импортирует configuration migrations", () => {
    expect(findImportOffenders(ORCHESTRATION_APPLIED_OBJECT_DIR, FORBIDDEN_ORCHESTRATION_APPLIED_OBJECT_IMPORTS)).toEqual([])
  })
})

function findImportOffenders(dir: string, forbiddenImports: readonly string[]) {
  return listTypeScriptFiles(dir)
    .map((filePath) => ({
      filePath: relative(process.cwd(), filePath),
      forbiddenImports: forbiddenImports.filter((importPath) => readFileSync(filePath, "utf-8").includes(importPath)),
    }))
    .filter(({ forbiddenImports }) => forbiddenImports.length > 0)
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

- [ ] **Step 2: Run the test to verify the new rule fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts --no-isolate
```

Expected: FAIL. Failure includes `metadata/orchestration/appliedObject/syncToXML.ts` and forbidden import `~/metadata/appliedObjects/configuration/`.

## Task 2: Add Neutral XML Manifest Contract

**Files:**
- Create: `packages/core/metadata/orchestration/xmlWriteManifest.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`

- [ ] **Step 1: Create the contract**

Create `packages/core/metadata/orchestration/xmlWriteManifest.ts`:

```ts
export interface XmlWriteManifest {
  addFile(absPath: string): void
}
```

- [ ] **Step 2: Update property sync function types**

In `packages/core/metadata/orchestration/property/fn.ts`, add the import near other local orchestration imports:

```ts
import type { XmlWriteManifest } from "../xmlWriteManifest"
```

Replace the `SyncExternalToXMLFunction` field:

```ts
xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
```

with:

```ts
xmlManifest?: XmlWriteManifest
```

- [ ] **Step 3: Check the exact replacement**

Run:

```bash
rg -n "appliedObjects/configuration/migrations/xmlManifest" packages/core/metadata/orchestration/property/fn.ts
```

Expected: no output.

## Task 3: Invert Reference Remapping Dependency

**Files:**
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
- Reference: `packages/core/metadata/appliedObjects/configuration/migrations/referenceRemap.ts`

- [ ] **Step 1: Update imports in orchestration sync**

In `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`, remove:

```ts
import { remapReferenceModel } from "~/metadata/appliedObjects/configuration/migrations/referenceRemap"
```

Add:

```ts
import type { XmlWriteManifest } from "~/metadata/orchestration/xmlWriteManifest"
```

- [ ] **Step 2: Add the remapper type**

Place this type above `syncAppliedObjectToXML`:

```ts
export type ReferenceModelRemapper = (params: {
  rule: MetadataItemRule
  currentModel: Record<string, unknown>
  referenceModel: Record<string, unknown> | undefined
}) => Record<string, unknown> | undefined
```

- [ ] **Step 3: Replace sync params**

In the `syncAppliedObjectToXML` params, replace:

```ts
referencePathByCurrentPath?: Map<string, string>
currentObjectPath?: string
xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
```

with:

```ts
referenceModelRemapper?: ReferenceModelRemapper
xmlManifest?: XmlWriteManifest
```

- [ ] **Step 4: Replace reference model calculation**

Replace the current `const referenceModel = ... remapReferenceModel(...) ...` block with:

```ts
const referenceModel = params.referenceModelRemapper
  ? params.referenceModelRemapper({
      rule,
      currentModel: model as Record<string, unknown>,
      referenceModel: loadedReferenceModel as Record<string, unknown> | undefined,
    })
  : loadedReferenceModel
```

- [ ] **Step 5: Replace remaining inline manifest types in this file**

Replace each remaining:

```ts
xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
```

with:

```ts
xmlManifest?: XmlWriteManifest
```

Run:

```bash
rg -n "appliedObjects/configuration/migrations|referencePathByCurrentPath|currentObjectPath" packages/core/metadata/orchestration/appliedObject/syncToXML.ts
```

Expected: no output.

- [ ] **Step 6: Pass remapper from configuration sync**

In `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`, add:

```ts
import { remapReferenceModel } from "./migrations/referenceRemap"
```

In the `syncAppliedObjectToXML` call, replace:

```ts
currentObjectPath,
referencePathByCurrentPath: migrationResult.referencePathByCurrentPath,
referenceModel,
```

with:

```ts
referenceModel,
referenceModelRemapper: ({ rule, currentModel, referenceModel }) =>
  remapReferenceModel({
    rule,
    currentObjectPath,
    currentModel,
    referenceModel,
    referencePathByCurrentPath: migrationResult.referencePathByCurrentPath,
  }),
```

## Task 4: Replace Manifest Type Leaks Outside Configuration

**Files:**
- Modify: `packages/core/metadata/commonObjects/**/*.ts`
- Modify: `packages/core/metadata/forms/**/*.ts`
- Modify: `packages/core/metadata/orchestration/**/*.ts`

- [ ] **Step 1: Replace named type imports**

Run:

```bash
rg -l 'XmlSyncManifest' packages/core/metadata/commonObjects packages/core/metadata/forms packages/core/metadata/orchestration -g '*.ts' -g '!*.test.ts' \
  | xargs perl -0pi -e 's#import type \{ XmlSyncManifest \} from "~/metadata/appliedObjects/configuration/migrations/xmlManifest"#import type { XmlWriteManifest } from "~/metadata/orchestration/xmlWriteManifest"#g; s#XmlSyncManifest#XmlWriteManifest#g'
```

Expected: no command output.

- [ ] **Step 2: Replace inline manifest types**

For every production file returned by this command:

```bash
rg -n 'import\("~/metadata/appliedObjects/configuration/migrations/xmlManifest"\)\.XmlWriteManifest|import\("~/metadata/appliedObjects/configuration/migrations/xmlManifest"\)\.XmlSyncManifest' packages/core/metadata/commonObjects packages/core/metadata/forms packages/core/metadata/orchestration -g '*.ts' -g '!*.test.ts'
```

Add:

```ts
import type { XmlWriteManifest } from "~/metadata/orchestration/xmlWriteManifest"
```

Then replace the inline type with:

```ts
XmlWriteManifest
```

- [ ] **Step 3: Keep tests free to instantiate the concrete class**

Do not change test imports like:

```ts
import { XmlSyncManifest } from "~/metadata/appliedObjects/configuration/migrations/xmlManifest"
```

Tests may continue to use the concrete class to verify `expectedFiles()`.

- [ ] **Step 4: Verify no production leak remains**

Run:

```bash
rg -n "appliedObjects/configuration/migrations/xmlManifest" packages/core/metadata/commonObjects packages/core/metadata/forms packages/core/metadata/orchestration -g '*.ts' -g '!*.test.ts'
```

Expected: no output.

## Task 5: Verify Behavior

**Files:**
- Test: `packages/core/metadata/importBoundaries.test.ts`
- Test: existing sync and manifest tests

- [ ] **Step 1: Run the boundary test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 2: Run focused sync tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/appliedObject/syncToXML.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts --no-isolate
```

Expected: PASS. If `metadata/appliedObjects/configuration/syncToXML.test.ts` is absent, run the closest configuration sync tests shown by `rg --files packages/core/metadata/appliedObjects/configuration | rg 'syncToXML|migration|roundTrip'`.

- [ ] **Step 3: Run type check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 4: Run package tests**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS.

- [ ] **Step 5: Run full project tests**

Run from repo root:

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
git diff -- packages/core/metadata/importBoundaries.test.ts packages/core/metadata/orchestration packages/core/metadata/commonObjects packages/core/metadata/forms packages/core/metadata/appliedObjects/configuration/syncToXML.ts
```

Expected: diff only contains sync-boundary changes from this plan.

- [ ] **Step 2: Commit**

Run:

```bash
git add packages/core/metadata/importBoundaries.test.ts packages/core/metadata/orchestration packages/core/metadata/commonObjects packages/core/metadata/forms packages/core/metadata/appliedObjects/configuration/syncToXML.ts
git commit -m "refactor: :recycle: развязать sync metadata от миграций"
```

Expected: commit succeeds.
