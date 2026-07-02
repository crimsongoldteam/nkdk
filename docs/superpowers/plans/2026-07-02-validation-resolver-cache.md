# Validation Resolver Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ускорить YAML validation за счёт кэширования результатов `ProjectMetadataResolver` на время жизни resolver-а.

**Architecture:** `createProjectMetadataResolverCore` создаёт локальные кэши для `resolveObject`, `resolveMember` и `resolveValue`. Ключ кэша строится из canonical target и filters, а результат хранится целиком, включая diagnostics/dependency. Для тестов добавляется read-only `getProjectMetadataResolverCacheStatsForTests(resolver)`, чтобы проверять cache hit/miss без привязки к времени.

**Tech Stack:** TypeScript ESM, Vitest, Node.js, pnpm workspace.

---

## File Structure

- Modify: `packages/core/metadata/validation/projectMetadataResolver.ts`
  - Добавить cache key helpers.
  - Добавить локальные `Map` внутри `createProjectMetadataResolverCore`.
  - Обернуть `resolveObject`, `resolveMember`, `resolveValue` в cache hit/miss flow.
  - Добавить exported-for-tests helper `getProjectMetadataResolverCacheStatsForTests`.
- Modify: `packages/core/metadata/validation/projectMetadataResolver.test.ts`
  - Добавить focused tests на object/member/value cache.
  - Проверить, что ошибки тоже кэшируются.
  - Проверить, что разные filters не смешиваются.
- No changes:
  - `rules.ts` не менять.
  - Parser metadata target не менять.
  - Worker pool и owner cache не менять в этом этапе.

## Task 1: Add Failing Cache Tests

**Files:**
- Modify: `packages/core/metadata/validation/projectMetadataResolver.test.ts`

- [ ] **Step 1: Extend imports**

In `packages/core/metadata/validation/projectMetadataResolver.test.ts`, replace the resolver import block with:

```ts
import {
  createProjectMetadataResolver,
  createProjectMetadataResolverFromValidationTable,
  getProjectMetadataResolverCacheStatsForTests,
} from "./projectMetadataResolver"
```

- [ ] **Step 2: Add cache tests before `function createProject()`**

Append this block inside the outer `describe("ProjectMetadataResolver", () => {` block, immediately before the existing helper function `createProject()`:

```ts
  describe("resolver cache", () => {
    it("caches successful object resolution by target and filters", () => {
      const projectDir = createProject()
      writeProjectFile(projectDir, "Справочник/Контрагенты/Свойства.yaml", "Комментарий: ok")
      const resolver = createResolver(projectDir)
      const target = objectTarget("Справочник.Контрагенты")

      expect(resolver.resolveObject({ target })).toMatchObject({ ok: true })
      expect(resolver.resolveObject({ target })).toMatchObject({ ok: true })

      expect(getProjectMetadataResolverCacheStatsForTests(resolver).object).toEqual({ hits: 1, misses: 1 })
    })

    it("caches missing object diagnostics", () => {
      const projectDir = createProject()
      const resolver = createResolver(projectDir)
      const target = { kind: "object", root: "Catalog", objectName: "НетТакого" } as const

      const first = resolver.resolveObject({ target })
      const second = resolver.resolveObject({ target })

      expect(first).toMatchObject({
        ok: false,
        diagnostics: [
          expect.objectContaining({
            source: "reference",
            severity: "error",
            message: 'Не найден объект "Справочник.НетТакого"',
          }),
        ],
      })
      expect(second).toEqual(first)
      expect(getProjectMetadataResolverCacheStatsForTests(resolver).object).toEqual({ hits: 1, misses: 1 })
    })

    it("caches successful member resolution", () => {
      const projectDir = createProject()
      writeProjectFile(projectDir, "Справочник/Номенклатура/Свойства.yaml", [
        "Реквизиты:",
        "  Артикул:",
        "    Тип: Строка",
      ])
      const resolver = createResolver(projectDir)
      const target = memberTarget("Справочник.Номенклатура.Реквизит.Артикул")

      expect(resolver.resolveMember({ target })).toMatchObject({ ok: true })
      expect(resolver.resolveMember({ target })).toMatchObject({ ok: true })

      expect(getProjectMetadataResolverCacheStatsForTests(resolver).member).toEqual({ hits: 1, misses: 1 })
    })

    it("caches missing member diagnostics", () => {
      const projectDir = createProject()
      writeProjectFile(projectDir, "Справочник/Номенклатура/Свойства.yaml", "Комментарий: ok")
      const resolver = createResolver(projectDir)
      const target = memberTarget("Справочник.Номенклатура.Реквизит.НетТакого")

      const first = resolver.resolveMember({ target })
      const second = resolver.resolveMember({ target })

      expect(first).toMatchObject({
        ok: false,
        diagnostics: [
          expect.objectContaining({
            source: "reference",
            severity: "error",
            message: 'Не найден член "Справочник.Номенклатура.Реквизит.НетТакого": нет сегмента "НетТакого"',
          }),
        ],
      })
      expect(second).toEqual(first)
      expect(getProjectMetadataResolverCacheStatsForTests(resolver).member).toEqual({ hits: 1, misses: 1 })
    })

    it("keeps object cache entries separate for different filters", () => {
      const projectDir = createProject()
      writeProjectFile(projectDir, "ЭлементСтиля/ОсновнойЦвет/Свойства.yaml", [
        "Тип: Цвет",
        "Значение:",
        "  Вид: Цвет",
        "  Значение: '#112233'",
      ])
      const resolver = createResolver(projectDir)
      const target = { kind: "object", root: "StyleItem", objectName: "ОсновнойЦвет" } as const

      expect(resolver.resolveObject({ target, filters: [{ kind: "styleItemType", values: ["Color"] }] })).toMatchObject({
        ok: true,
      })
      expect(resolver.resolveObject({ target, filters: [{ kind: "styleItemType", values: ["Font"] }] })).toMatchObject({
        ok: false,
      })
      expect(resolver.resolveObject({ target, filters: [{ kind: "styleItemType", values: ["Color"] }] })).toMatchObject({
        ok: true,
      })

      expect(getProjectMetadataResolverCacheStatsForTests(resolver).object).toEqual({ hits: 1, misses: 2 })
    })

    it("caches value resolution", () => {
      const projectDir = createProject()
      writeProjectFile(projectDir, "Справочник/СтавкиНДС/Свойства.yaml", [
        "Предопределенные:",
        "  БезНДС:",
        '    Код: "000000001"',
        "    Наименование: Без НДС",
      ])
      const resolver = createResolver(projectDir)
      const target = valueTarget("Справочник.СтавкиНДС.БезНДС")

      expect(resolver.resolveValue({ target })).toMatchObject({ ok: true })
      expect(resolver.resolveValue({ target })).toMatchObject({ ok: true })

      expect(getProjectMetadataResolverCacheStatsForTests(resolver).value).toEqual({ hits: 1, misses: 1 })
    })
  })
```

- [ ] **Step 3: Run focused test and confirm it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectMetadataResolver.test.ts
```

Expected: FAIL because `getProjectMetadataResolverCacheStatsForTests` is not exported yet.

## Task 2: Add Cache Stats Helper and Key Helpers

**Files:**
- Modify: `packages/core/metadata/validation/projectMetadataResolver.ts`

- [ ] **Step 1: Add cache stats types after `ProjectMetadataResolver`**

After the `ProjectMetadataResolver` interface, add:

```ts
interface ResolverCacheCounter {
  hits: number
  misses: number
}

export interface ProjectMetadataResolverCacheStatsForTests {
  object: ResolverCacheCounter
  member: ResolverCacheCounter
  value: ResolverCacheCounter
}

const resolverCacheStatsForTests = new WeakMap<ProjectMetadataResolver, ProjectMetadataResolverCacheStatsForTests>()

function createResolverCacheStatsForTests(): ProjectMetadataResolverCacheStatsForTests {
  return {
    object: { hits: 0, misses: 0 },
    member: { hits: 0, misses: 0 },
    value: { hits: 0, misses: 0 },
  }
}

export function getProjectMetadataResolverCacheStatsForTests(
  resolver: ProjectMetadataResolver
): ProjectMetadataResolverCacheStatsForTests {
  return resolverCacheStatsForTests.get(resolver) ?? createResolverCacheStatsForTests()
}
```

- [ ] **Step 2: Add cache key helpers before `createProjectMetadataResolverCore`**

Before `function createProjectMetadataResolverCore`, add:

```ts
function objectResolveCacheKey(params: {
  target: Extract<ParsedMetadataTarget, { kind: "object" }>
  filters?: readonly MetadataTargetFilter[]
}): string {
  return ["object", formatObjectTarget(params.target), metadataTargetFiltersCacheKey(params.filters)].join("|")
}

function memberResolveCacheKey(params: {
  target: Extract<ParsedMetadataTarget, { kind: "member" }>
  filters?: readonly MetadataTargetFilter[]
}): string {
  return ["member", formatMemberTarget(params.target), metadataTargetFiltersCacheKey(params.filters)].join("|")
}

function valueResolveCacheKey(params: { target: Extract<ParsedMetadataTarget, { kind: "value" }> }): string {
  return ["value", formatValueTarget(params.target)].join("|")
}

function metadataTargetFiltersCacheKey(filters: readonly MetadataTargetFilter[] | undefined): string {
  return filters === undefined || filters.length === 0 ? "-" : JSON.stringify(filters)
}
```

- [ ] **Step 3: Run focused test and confirm helper exists but stats still do not change**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectMetadataResolver.test.ts
```

Expected: FAIL in new cache tests with stats still `{ hits: 0, misses: 0 }`.

## Task 3: Cache `resolveObject`

**Files:**
- Modify: `packages/core/metadata/validation/projectMetadataResolver.ts`

- [ ] **Step 1: Add object cache state inside `createProjectMetadataResolverCore`**

At the start of `createProjectMetadataResolverCore`, after:

```ts
  const { projectDir, yamlCache, ownerCache, hasFile, missingObject } = params
```

add:

```ts
  const objectResolveCache = new Map<string, MetadataResolveResult>()
  const memberResolveCache = new Map<string, MetadataResolveResult>()
  const valueResolveCache = new Map<string, MetadataResolveResult>()
  const cacheStats = createResolverCacheStatsForTests()
```

At the end of the function, before returning `resolver`, add:

```ts
  resolverCacheStatsForTests.set(resolver, cacheStats)
```

and change the final return to:

```ts
  return resolver
```

The function already assigns an object literal to `const resolver: ProjectMetadataResolver`; keep that shape and set the WeakMap after the object literal.

- [ ] **Step 2: Extract existing `resolveObject` body into local function**

Inside `createProjectMetadataResolverCore`, before `const resolver: ProjectMetadataResolver = {`, add:

```ts
  function resolveObjectUncached(params: {
    target: Extract<ParsedMetadataTarget, { kind: "object" }>
    filters?: readonly MetadataTargetFilter[]
  }): MetadataResolveResult {
    const { target, filters } = params
    const rootResolver = getProjectObjectPathResolver(target.root)
    const rootPath = rootResolver?.({
      projectDir,
      target: { kind: "object", root: target.root, objectName: target.objectName },
    })
    const filePath = rootPath?.filePath
    if (!filePath || !hasFile(filePath)) return missingObject(target, filePath ?? projectDir)

    const filterResult = resolveObjectFilters({
      target,
      filters,
      resolveStyleItemByName: (name, expectedTypes) => resolver.resolveStyleItem({ name, expectedTypes }),
    })
    if (!filterResult.ok) return filterResult

    if (target.segments && target.segments.length > 0) {
      const nestedPath = rootResolver?.({ projectDir, target })
      if (nestedPath?.filePath && hasFile(nestedPath.filePath)) return { ok: true, filePath: nestedPath.filePath }

      for (const resolver of getProjectInlineObjectResolvers(target.root)) {
        const inlineObject = resolver({ projectDir, target, yamlCache, ownerCache })
        if (inlineObject) return inlineObject
      }

      return missingObject(target, nestedPath?.filePath ?? filePath)
    }

    return { ok: true, filePath }
  }
```

Then replace the existing `resolveObject({ target, filters }) {` method body with:

```ts
    resolveObject(params) {
      const key = objectResolveCacheKey(params)
      const cached = objectResolveCache.get(key)
      if (cached !== undefined) {
        cacheStats.object.hits += 1
        return cached
      }

      cacheStats.object.misses += 1
      const result = resolveObjectUncached(params)
      objectResolveCache.set(key, result)
      return result
    },
```

- [ ] **Step 3: Run focused test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectMetadataResolver.test.ts
```

Expected: object cache tests pass; member/value cache tests still fail.

## Task 4: Cache `resolveMember`

**Files:**
- Modify: `packages/core/metadata/validation/projectMetadataResolver.ts`

- [ ] **Step 1: Extract existing `resolveMember` body into local function**

Inside `createProjectMetadataResolverCore`, before `const resolver: ProjectMetadataResolver = {`, add:

```ts
  function resolveMemberUncached(params: {
    target: Extract<ParsedMetadataTarget, { kind: "member" }>
    filters?: readonly MetadataTargetFilter[]
  }): MetadataResolveResult {
    const { target, filters } = params
    const object = resolver.resolveObject({
      target: { kind: "object", root: target.root, objectName: target.objectName },
    })
    if (!object.ok) return object

    if (target.objectSegments) {
      const nestedObject = resolver.resolveObject({
        target: {
          kind: "object",
          root: target.root,
          objectName: target.objectName,
          segments: target.objectSegments,
        },
      })
      if (!nestedObject.ok) return nestedObject
      if (!nestedObject.filePath)
        return referenceError(projectDir, `Не найден объект "${formatMemberTarget(target)}"`)

      const rawYaml = ownerRawYaml({ filePath: nestedObject.filePath, yamlCache })
      const resolved = resolveRegisteredMember({
        projectDir,
        ownerFilePath: nestedObject.filePath,
        rawYaml,
        target,
        yamlCache,
        ownerCache,
      })
      if (resolved) {
        return resolved.ok
          ? { ok: true, filePath: resolved.filePath ?? nestedObject.filePath, details: resolved.details }
          : resolved
      }

      return referenceError(
        nestedObject.filePath,
        `Не найден член "${formatMemberTarget(target)}": нет сегмента "${target.segments[0]?.name ?? ""}"`
      )
    }

    const owner = ownerCache.get({ kind: rootToYAML[target.root], name: target.objectName })
    if (owner.status !== "ok") return { ok: false, diagnostics: owner.diagnostics }

    const resolved = resolveMemberSegments({
      projectDir,
      owner: owner.owner,
      ownerFilePath: owner.owner.filePath,
      rawYaml: ownerRawYaml({ filePath: owner.owner.filePath, yamlCache }),
      target,
      segments: target.segments,
      yamlCache,
      ownerCache,
    })
    if (!resolved.ok) {
      return referenceError(
        owner.owner.filePath,
        `Не найден член "${formatMemberTarget(target)}": ${resolved.message}`
      )
    }

    const filterResult = applyMetadataTargetFilters({
      filePath: resolved.filePath ?? owner.owner.filePath,
      displayName: formatMemberTarget(target),
      target,
      details: resolved.details,
      filters,
      ownerCache,
    })
    if (!filterResult.ok) return filterResult

    return { ok: true, filePath: resolved.filePath ?? owner.owner.filePath, details: resolved.details }
  }
```

Then replace the existing `resolveMember({ target, filters }) {` method body with:

```ts
    resolveMember(params) {
      const key = memberResolveCacheKey(params)
      const cached = memberResolveCache.get(key)
      if (cached !== undefined) {
        cacheStats.member.hits += 1
        return cached
      }

      cacheStats.member.misses += 1
      const result = resolveMemberUncached(params)
      memberResolveCache.set(key, result)
      return result
    },
```

- [ ] **Step 2: Run focused test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectMetadataResolver.test.ts
```

Expected: object and member cache tests pass; value cache test still fails.

## Task 5: Cache `resolveValue`

**Files:**
- Modify: `packages/core/metadata/validation/projectMetadataResolver.ts`

- [ ] **Step 1: Extract existing `resolveValue` body into local function**

Inside `createProjectMetadataResolverCore`, before `const resolver: ProjectMetadataResolver = {`, add:

```ts
  function resolveValueUncached(params: {
    target: Extract<ParsedMetadataTarget, { kind: "value" }>
  }): MetadataResolveResult {
    const { target } = params
    const object = resolver.resolveObject({
      target: { kind: "object", root: target.root, objectName: target.objectName },
    })
    if (!object.ok) return object
    if (target.valueKind === "emptyRef") return object

    const owner = ownerCache.get({ kind: rootToYAML[target.root], name: target.objectName })
    if (owner.status !== "ok") return { ok: false, diagnostics: owner.diagnostics }

    const valueResolver = getProjectValueResolver(target.root)
    const resolved = valueResolver?.({ owner: owner.owner, target })
    if (resolved) return resolved

    return referenceError(owner.owner.filePath, `Не найдено значение "${formatValueTarget(target)}"`)
  }
```

Then replace the existing `resolveValue({ target }) {` method body with:

```ts
    resolveValue(params) {
      const key = valueResolveCacheKey(params)
      const cached = valueResolveCache.get(key)
      if (cached !== undefined) {
        cacheStats.value.hits += 1
        return cached
      }

      cacheStats.value.misses += 1
      const result = resolveValueUncached(params)
      valueResolveCache.set(key, result)
      return result
    },
```

- [ ] **Step 2: Run focused test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectMetadataResolver.test.ts
```

Expected: PASS.

## Task 6: Verify Full Test Suite and Measure Validation

**Files:**
- No code changes unless verification reveals a bug.

- [ ] **Step 1: Run all tests**

Run from `/Users/nikita/git/nkdk/.worktrees/benchmark-yaml-parsers`:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 2: Run validation without profile**

Run:

```bash
/usr/bin/time -p pnpm --filter @nakidka/cli exec tsx src/cli.ts validate /Users/nikita/git/nkdk-yaml
```

Expected:

```text
summary: 0 error, 0 warning
```

Record `real`, `user`, and `sys`.

If this fails with a `listen EPERM` error for a `tsx` pipe under the system temp directory, rerun the same command with sandbox escalation.

- [ ] **Step 3: Run validation with profile**

Run:

```bash
env NKDK_VALIDATION_PROFILE=1 NKDK_VALIDATION_TIMING=1 /usr/bin/time -p pnpm --filter @nakidka/cli exec tsx src/cli.ts validate /Users/nikita/git/nkdk-yaml
```

Expected:

```text
summary: 0 error, 0 warning
[validation-profile] kind=properties:ФункциональнаяОпция
[validation-profile] kind=properties:КритерийОтбора
```

Record:

- `properties:ФункциональнаяОпция total`;
- `properties:КритерийОтбора total`;
- combined total compared with recent profile `40024.59ms + 3441.24ms`;
- worker `second pass validation`;
- `real/user/sys`.

If this fails with a `listen EPERM` error for a `tsx` pipe under the system temp directory, rerun the same command with sandbox escalation.

- [ ] **Step 4: Inspect diff**

Run:

```bash
git diff --stat
git diff -- packages/core/metadata/validation/projectMetadataResolver.ts packages/core/metadata/validation/projectMetadataResolver.test.ts
```

Expected: diff only contains resolver cache, cache key helpers, test-only stats helper, and tests.

## Task 7: Commit Implementation

**Files:**
- Commit: `packages/core/metadata/validation/projectMetadataResolver.ts`
- Commit: `packages/core/metadata/validation/projectMetadataResolver.test.ts`

- [ ] **Step 1: Stage implementation files**

Run:

```bash
git add packages/core/metadata/validation/projectMetadataResolver.ts packages/core/metadata/validation/projectMetadataResolver.test.ts
```

- [ ] **Step 2: Commit**

Run:

```bash
git commit -m "perf: :zap: ускорить resolver validation" -m "ProjectMetadataResolver кэширует результаты resolveObject/resolveMember/resolveValue на время жизни resolver-а. Это убирает повторное разрешение одинаковых metadataTarget-ссылок во время second pass без изменения правил и diagnostics."
```

Expected: commit succeeds after tests and validation measurement.
