# Metadata Target Constraint Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ускорить проверку `metadataTarget` за счёт индекса разрешённых object/member path-шаблонов внутри parser-а.

**Architecture:** `parse.ts` компилирует `MetadataTargetConstraint` в небольшой индекс и хранит его в `WeakMap`. Parser сначала выбирает кандидаты по нормализованной последовательности kind-ов, затем вызывает старую точную проверку только для этих кандидатов. Внешний YAML/canonical формат, `rules.ts` и диагностика не меняются.

**Tech Stack:** TypeScript ESM, Vitest, Node.js, pnpm workspace.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.ts`
  - Добавить internal compiled-index для `MetadataTargetConstraint`.
  - Добавить candidate selection для `allowedObjectPaths` и `allowedMemberPaths`.
  - Добавить exported-for-tests helper `getMetadataTargetPathCandidateCountForTests`.
  - Использовать выбранных кандидатов в `parseExactObjectTarget` и `parseExactMemberTarget`.
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`
  - Добавить тесты на candidate selection.
  - Добавить regression-тесты на сохранение ошибок и fallback.
- No changes:
  - `rules.ts` файлов не трогать.
  - `projectMetadataResolver.ts`, `ownerCache.ts`, worker pool не менять в этом этапе.

## Task 1: Add Failing Candidate Selection Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`

- [ ] **Step 1: Extend imports**

In `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`, replace the import with:

```ts
import {
  formatMetadataTargetToYAML,
  getMetadataTargetPathCandidateCountForTests,
  parseMetadataTargetFromModel,
  parseMetadataTargetFromYAML,
} from "./index"
```

- [ ] **Step 2: Add candidate-count tests**

Append this `describe` block before the final `})` of `describe("metadataTargets parser", ...)`:

```ts
  describe("compiled target path candidates", () => {
    const constraint = {
      kind: "member",
      owner: "explicit",
      allowedObjectPaths: [
        ["Catalog"],
        ["Document"],
        ["Document", "TabularSection"],
        ["InformationRegister"],
      ],
      allowedMemberPaths: [
        ["Catalog", "Attribute"],
        ["Catalog", "Command"],
        ["Catalog", "TabularSection"],
        ["Catalog", "TabularSection", "Attribute"],
        ["Catalog", "TabularSection", "Command"],
        ["Document", "Attribute"],
        ["Document", "Command"],
        ["Document", "TabularSection"],
        ["Document", "TabularSection", "Attribute"],
        ["Document", "TabularSection", "Command"],
        ["InformationRegister", "Dimension"],
        ["InformationRegister", "Resource"],
        ["InformationRegister", "Attribute"],
        ["InformationRegister", "Command"],
      ],
    } as const

    it("selects one member-path candidate by normalized model kind sequence", () => {
      expect(
        getMetadataTargetPathCandidateCountForTests({
          constraint,
          source: "model",
          kind: "member",
          value: "Document.ЗаказКлиента.TabularSection.Товары.Attribute.Номенклатура",
        })
      ).toBe(1)
    })

    it("selects one member-path candidate by normalized YAML kind sequence", () => {
      expect(
        getMetadataTargetPathCandidateCountForTests({
          constraint,
          source: "yaml",
          kind: "member",
          value: "Документ.ЗаказКлиента.ТабличнаяЧасть.Товары.Реквизит.Номенклатура",
        })
      ).toBe(1)
    })

    it("selects object-path candidates without scanning unrelated roots", () => {
      expect(
        getMetadataTargetPathCandidateCountForTests({
          constraint,
          source: "model",
          kind: "object",
          value: "Document.ЗаказКлиента.TabularSection.Товары",
        })
      ).toBe(1)
    })
  })
```

- [ ] **Step 3: Run focused parser test and confirm it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts
```

Expected: FAIL with an import/runtime error because `getMetadataTargetPathCandidateCountForTests` is not exported yet.

## Task 2: Add Compiled Constraint Index

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.ts`

- [ ] **Step 1: Add compiled index types and cache**

In `packages/core/metadata/commonObjects/metadataTargets/parse.ts`, after `type MetadataTargetSource = "yaml" | "model"`, add:

```ts
type ExactObjectPath = readonly [MetadataRootName, ...MetadataObjectPathKind[]]
type ExactMemberPath = readonly [MetadataRootName, ...(MetadataObjectPathKind | MetadataMemberKind)[]]

interface CompiledMetadataTargetConstraint {
  objectPathsByKey: Map<string, ExactObjectPath[]>
  memberPathsByKey: Map<string, ExactMemberPath[]>
}

const compiledConstraintCache = new WeakMap<MetadataTargetConstraint, CompiledMetadataTargetConstraint>()
```

- [ ] **Step 2: Add compiler helpers**

Before `export function parseMetadataTargetFromYAML`, add:

```ts
function getCompiledMetadataTargetConstraint(
  constraint: MetadataTargetConstraint
): CompiledMetadataTargetConstraint {
  const cached = compiledConstraintCache.get(constraint)
  if (cached) return cached

  const compiled = compileMetadataTargetConstraint(constraint)
  compiledConstraintCache.set(constraint, compiled)
  return compiled
}

function compileMetadataTargetConstraint(
  constraint: MetadataTargetConstraint
): CompiledMetadataTargetConstraint {
  const objectPathsByKey = new Map<string, ExactObjectPath[]>()
  const memberPathsByKey = new Map<string, ExactMemberPath[]>()

  if (constraint.kind === "object" || constraint.kind === "member") {
    for (const path of constraint.allowedObjectPaths ?? []) {
      addPathCandidate(objectPathsByKey, exactPathKey(path), path)
    }
  }

  if (constraint.kind === "member") {
    for (const path of constraint.allowedMemberPaths ?? []) {
      addPathCandidate(memberPathsByKey, exactPathKey(path), path)
    }
  }

  return { objectPathsByKey, memberPathsByKey }
}

function addPathCandidate<Path extends ExactObjectPath | ExactMemberPath>(
  index: Map<string, Path[]>,
  key: string,
  path: Path
): void {
  const existing = index.get(key)
  if (existing) existing.push(path)
  else index.set(key, [path])
}

function exactPathKey(path: readonly [MetadataRootName, ...string[]]): string {
  return `${path[0]}:${path.slice(1).join("/")}`
}
```

- [ ] **Step 3: Add tail key helpers**

After `compileMetadataTargetConstraint`, add:

```ts
function objectTailPathKey(
  root: MetadataRootName,
  tail: readonly string[],
  source: MetadataTargetSource
): string | undefined {
  if (tail.length % 2 !== 0) return undefined

  const kinds: string[] = []
  for (let index = 0; index < tail.length; index += 2) {
    const kind = parseObjectPathKind(tail[index], source)
    if (!kind) return undefined
    kinds.push(kind)
  }

  return `${root}:${kinds.join("/")}`
}

function memberTailPathKey(
  root: MetadataRootName,
  tail: readonly string[],
  source: MetadataTargetSource
): string | undefined {
  if (tail.length === 0 || tail.length % 2 !== 0) return undefined

  const kinds: string[] = []
  for (let index = 0; index < tail.length; index += 2) {
    const token = tail[index]
    const objectKind = parseObjectPathKind(token, source)
    const memberKind = source === "yaml" ? parseMemberKindFromYAML(token) : parseMemberKindFromModel(token)
    const kind = objectKind ?? memberKind
    if (!kind) return undefined
    kinds.push(kind)
  }

  return `${root}:${kinds.join("/")}`
}
```

- [ ] **Step 4: Add candidate selection helpers**

After the tail key helpers, add:

```ts
function objectPathCandidates(params: {
  constraint: Extract<MetadataTargetConstraint, { kind: "object" | "member" }>
  root: MetadataRootName
  tail: readonly string[]
  source: MetadataTargetSource
}): readonly ExactObjectPath[] {
  const allowed = params.constraint.allowedObjectPaths
  if (allowed === undefined) return []
  const key = objectTailPathKey(params.root, params.tail, params.source)
  if (key === undefined) return []
  return getCompiledMetadataTargetConstraint(params.constraint).objectPathsByKey.get(key) ?? []
}

function memberPathCandidates(params: {
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>
  root: MetadataRootName
  tail: readonly string[]
  source: MetadataTargetSource
}): readonly ExactMemberPath[] {
  const allowed = params.constraint.allowedMemberPaths
  if (allowed === undefined) return []
  const key = memberTailPathKey(params.root, params.tail, params.source)
  if (key === undefined) return []
  return getCompiledMetadataTargetConstraint(params.constraint).memberPathsByKey.get(key) ?? []
}
```

- [ ] **Step 5: Add exported test helper**

After candidate selection helpers, add:

```ts
export function getMetadataTargetPathCandidateCountForTests(params: {
  constraint: MetadataTargetConstraint
  source: MetadataTargetSource
  kind: "object" | "member"
  value: string
}): number {
  const parts = splitTarget(params.value)
  const root = params.source === "yaml" ? parseObjectRootFromYAML(parts[0]) : parseObjectRootFromModel(parts[0])
  if (!root) return 0

  const tail = parts.slice(2)
  if (params.kind === "object" && (params.constraint.kind === "object" || params.constraint.kind === "member")) {
    return objectPathCandidates({ constraint: params.constraint, root, tail, source: params.source }).length
  }

  if (params.kind === "member" && params.constraint.kind === "member") {
    return memberPathCandidates({ constraint: params.constraint, root, tail, source: params.source }).length
  }

  return 0
}
```

- [ ] **Step 6: Run focused parser test and confirm candidate tests pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts
```

Expected: PASS. At this point parser behavior is not optimized yet, but candidate helper exists.

## Task 3: Use Object Path Candidates in Parser

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`

- [ ] **Step 1: Add object-path fallback regression test**

In `parse.test.ts`, append this test inside `describe("compiled target path candidates", ...)`:

```ts
    it("preserves nested object fallback when exact object path is not allowed", () => {
      const nestedConstraint = {
        kind: "object",
        allowedObjectPaths: [["Catalog"]],
        nestedObjectRoots: ["Subsystem"],
      } as const

      expect(
        parseMetadataTargetFromModel({
          canonical: "Subsystem.Продажи.Subsystem.Настройки",
          constraint: nestedConstraint,
        })
      ).toMatchObject({
        ok: true,
        canonical: "Subsystem.Продажи.Subsystem.Настройки",
      })
    })
```

- [ ] **Step 2: Run focused parser test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts
```

Expected: PASS before implementation. This locks existing fallback behavior.

- [ ] **Step 3: Change parseObjectTarget call site**

In `parseObjectTarget`, replace:

```ts
    const exact = parseExactObjectTarget(root, objectName, tail, constraint.allowedObjectPaths, source)
```

with:

```ts
    const exact = parseExactObjectTarget(
      root,
      objectName,
      tail,
      objectPathCandidates({ constraint, root, tail, source }),
      source
    )
```

- [ ] **Step 4: Change parseMemberObjectTarget call site**

In `parseMemberObjectTarget`, replace:

```ts
    const exact = parseExactObjectTarget(root, objectName, tail, constraint.allowedObjectPaths, source)
```

with:

```ts
    const exact = parseExactObjectTarget(
      root,
      objectName,
      tail,
      objectPathCandidates({ constraint, root, tail, source }),
      source
    )
```

- [ ] **Step 5: Run focused parser test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts
```

Expected: PASS.

## Task 4: Use Member Path Candidates in Parser

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`

- [ ] **Step 1: Add member-path error-order regression tests**

In `parse.test.ts`, append these tests inside `describe("compiled target path candidates", ...)`:

```ts
    it("keeps disallowed-kind for known but forbidden exact member paths", () => {
      expect(
        parseMetadataTargetFromModel({
          canonical: "Document.ЗаказКлиента.TabularSection.Товары.Dimension.Номенклатура",
          constraint,
        })
      ).toMatchObject({ ok: false, code: "disallowed-kind" })
    })

    it("keeps unknown-segment for unknown exact member path kinds", () => {
      expect(
        parseMetadataTargetFromModel({
          canonical: "Document.ЗаказКлиента.UnknownKind.Товары.Attribute.Номенклатура",
          constraint,
        })
      ).toEqual({
        ok: false,
        code: "unknown-segment",
        message: 'Неизвестный сегмент "UnknownKind"',
      })
    })
```

- [ ] **Step 2: Run focused parser test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts
```

Expected: PASS before implementation. These tests lock existing error semantics.

- [ ] **Step 3: Use member candidates in parseExactMemberTarget**

In `parseExactMemberTarget`, replace:

```ts
  for (const allowedPath of constraint.allowedMemberPaths) {
    const parsed = parseExactMemberPath(root, objectName, tail, allowedPath, source)
    if (parsed.ok) return parsed
  }
```

with:

```ts
  for (const allowedPath of memberPathCandidates({ constraint, root, tail, source })) {
    const parsed = parseExactMemberPath(root, objectName, tail, allowedPath, source)
    if (parsed.ok) return parsed
  }
```

- [ ] **Step 4: Run focused parser test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts
```

Expected: PASS.

## Task 5: Add Functional Option Shape Regression

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`

- [ ] **Step 1: Add regression test for the hot functional-option constraint shape**

Append this test inside `describe("compiled target path candidates", ...)`:

```ts
    it("selects one candidate for functional-option-style content links", () => {
      const functionalOptionLikeConstraint = {
        kind: "member",
        owner: "explicit",
        allowedObjectPaths: [
          ["Constant"],
          ["Catalog"],
          ["Document"],
          ["InformationRegister"],
          ["AccumulationRegister"],
        ],
        allowedMemberPaths: [
          ["Catalog", "Attribute"],
          ["Catalog", "TabularSection"],
          ["Catalog", "TabularSection", "Attribute"],
          ["Catalog", "Command"],
          ["Document", "Attribute"],
          ["Document", "TabularSection"],
          ["Document", "TabularSection", "Attribute"],
          ["Document", "Command"],
          ["InformationRegister", "Dimension"],
          ["InformationRegister", "Resource"],
          ["InformationRegister", "Attribute"],
          ["InformationRegister", "Command"],
          ["AccumulationRegister", "Dimension"],
          ["AccumulationRegister", "Resource"],
          ["AccumulationRegister", "Attribute"],
          ["AccumulationRegister", "Command"],
        ],
      } as const

      expect(
        getMetadataTargetPathCandidateCountForTests({
          constraint: functionalOptionLikeConstraint,
          source: "model",
          kind: "member",
          value: "Document.ЗаказКлиента.TabularSection.Товары.Attribute.Номенклатура",
        })
      ).toBe(1)

      expect(
        parseMetadataTargetFromModel({
          canonical: "Document.ЗаказКлиента.TabularSection.Товары.Attribute.Номенклатура",
          constraint: functionalOptionLikeConstraint,
        })
      ).toMatchObject({
        ok: true,
        canonical: "Document.ЗаказКлиента.TabularSection.Товары.Attribute.Номенклатура",
      })
    })
```

- [ ] **Step 2: Run focused parser test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts
```

Expected: PASS.

## Task 6: Verify Validation Behavior and Measure Performance

**Files:**
- No code changes.

- [ ] **Step 1: Run full test suite**

Run from `/Users/nikita/git/nkdk/.worktrees/benchmark-yaml-parsers`:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 2: Run full YAML validation without profile**

Run:

```bash
/usr/bin/time -p pnpm --filter @nakidka/cli exec tsx src/cli.ts validate /Users/nikita/git/nkdk-yaml
```

Expected:

```text
summary: 0 error, 0 warning
```

Record `real`, `user`, and `sys`.

- [ ] **Step 3: Run full YAML validation with profile**

Run:

```bash
env NKDK_VALIDATION_PROFILE=1 NKDK_VALIDATION_TIMING=1 /usr/bin/time -p pnpm --filter @nakidka/cli exec tsx src/cli.ts validate /Users/nikita/git/nkdk-yaml
```

Expected:

```text
summary: 0 error, 0 warning
[validation-profile] kind=properties:ФункциональнаяОпция ...
[validation-profile] kind=properties:КритерийОтбора ...
```

Record:

- `properties:ФункциональнаяОпция total`;
- `properties:КритерийОтбора total`;
- combined total compared with baseline `39.6 с + 4.7 с`;
- `real/user/sys`.

Success threshold: combined `ФункциональнаяОпция + КритерийОтбора` total is at least 2x lower than `44.3 с`.

- [ ] **Step 4: Inspect diff**

Run:

```bash
git diff --stat
git diff -- packages/core/metadata/commonObjects/metadataTargets/parse.ts packages/core/metadata/commonObjects/metadataTargets/parse.test.ts
```

Expected: diff only contains compiled constraint index, parser candidate selection, and tests.

## Task 7: Commit Implementation

**Files:**
- Commit: `packages/core/metadata/commonObjects/metadataTargets/parse.ts`
- Commit: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`

- [ ] **Step 1: Stage implementation files**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataTargets/parse.ts packages/core/metadata/commonObjects/metadataTargets/parse.test.ts
```

- [ ] **Step 2: Commit**

Run:

```bash
git commit -m "perf: :zap: ускорить metadata target validation" -m "Parser теперь выбирает разрешённые object/member path-шаблоны через индекс constraint-а. Это убирает полный перебор шаблонов на больших списках metadata target-ссылок без изменения формата YAML и diagnostics."
```

Expected: commit succeeds after tests and validation measurement.
