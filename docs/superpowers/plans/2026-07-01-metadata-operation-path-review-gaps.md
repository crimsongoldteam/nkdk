# Metadata Operation Path Review Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Привести rename/delete metadata-операции, миграции, CLI и MCP к единому строковому `path`-договору и закрыть дыры ревью по вложенным целям, формам/DataPath и регистронезависимым конфликтам.

**Architecture:** Core становится единственным владельцем разбора operation path, разрешения цели, проверки области имен и применения миграционной цепочки. CLI и MCP передают только строковый `path`; `list_operation_targets` и публичный структурированный target удаляются. Операции читают тот же набор YAML-файлов, что validation, и работают через общие правила, без частных обходов проекта.

**Tech Stack:** TypeScript 5.9, Vitest, Zod v4, yaml, Node fs/path, existing `validateProject`, `discoverValidationProjectFiles`, `discoverMetadataProjectResources`, `MetadataItemRule`, `operationTarget`, `structuralReferences`, DataPath validation helpers.

---

## Scope Check

Спека закрывает одну связанную группу изменений после ревью первой реализации. Разделять на несколько планов не нужно: публичный `path`-договор, resolver, операции, миграции и MCP/CLI зависят друг от друга и должны быть проверены вместе.

Не менять XML-фикстуры. Не добавлять новые правила fromXML/toXML/fromYAML/toYAML без отдельного решения. В общих слоях `metadata/project`, `metadata/validation`, `metadata/orchestration` не добавлять знания о конкретных каталогах или `itemType`; все связи должны идти через существующие проектные описатели, правила и `operationTarget`.

## File Structure

- Modify: `packages/core/metadata/operations/types.ts`
  - Убрать публичные структурированные target-типы из входов операций. Добавить `path: string` во входы, `invalid_path` и `rule_contract_violation` в ошибки.
- Create: `packages/core/metadata/operations/operationPath.ts`
  - Core parser для строкового operation path и helpers для замены последнего имени.
- Create: `packages/core/metadata/operations/operationPath.test.ts`
  - Тесты синтаксиса path, ошибок и построения target path.
- Modify: `packages/core/metadata/operations/targetResolver.ts`
  - Разрешать строковый parsed path через общий проход по `operationTarget`, включая вложенные коллекции.
- Modify: `packages/core/metadata/operations/targetResolver.test.ts`
  - Проверить объект, реквизит, форму, вложенный реквизит табличной части, `invalid_path`, `target_not_found`, `unsupported_target`.
- Modify: `packages/core/metadata/orchestration/property/operationTargets.ts`
  - Добавить display/migration segment для file-item целей, чтобы resolver не хардкодил `Форма`/`Макет`/`Команда`.
- Modify: `packages/core/metadata/orchestration/property/operationTargets.test.ts`
  - Обновить тест helper с новым обязательным `migrationSegment`.
- Modify: `packages/core/metadata/commonObjects/childFormNames/types.ts`
  - Добавить `migrationSegment: "Форма"` в `fileItemCollectionTarget`.
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/types.ts`
  - Добавить `migrationSegment: "Макет"` в `fileItemCollectionTarget`.
  - Обновить вызовы `fileItemCollectionTarget` с явным `migrationSegment`.
- Modify: `packages/core/metadata/operations/projectSnapshot.ts`
  - Перейти на `discoverValidationProjectFiles` и хранить все YAML-файлы validation: properties, nested properties, forms.
- Modify: `packages/core/metadata/operations/yamlModelIO.ts`
  - Экспортировать properties через правило владельца, формы через `ClientApplicationFormRules`.
- Modify: `packages/core/metadata/operations/references.ts`
  - Собирать ссылки из всех snapshot items, проверять наличие setter и возвращать `rule_contract_violation`, если ссылка распознана, но не может быть записана.
- Modify: `packages/core/metadata/operations/dataPathReferences.ts`
  - Подключить existing form DataPath traversal/resolver к операциям для форм.
- Modify: `packages/core/metadata/operations/projectSnapshot.test.ts`
  - Проверить, что snapshot видит формы и вложенные YAML так же, как validation.
- Modify: `packages/core/metadata/operations/renameItem.ts`
  - Вход `path`, вызов core parser/resolver, перезапись структурных ссылок и DataPath по всему snapshot, migration only для целей с `requiresMigration`.
- Modify: `packages/core/metadata/operations/deleteItem.ts`
  - Вход `path`, блокировка структурных ссылок и DataPath по всему snapshot.
- Modify: `packages/core/metadata/operations/renameItem.test.ts`
  - Переписать тесты на `path`; добавить формы/DataPath/вложенный реквизит.
- Modify: `packages/core/metadata/operations/deleteItem.test.ts`
  - Переписать тесты на `path`; добавить блокировку ссылок из формы.
- Delete: `packages/core/metadata/operations/listOperationTargets.ts`
- Delete: `packages/core/metadata/operations/listOperationTargets.test.ts`
- Modify: `packages/core/metadata/operations/index.ts`
  - Убрать export `listOperationTargets`; экспортировать `operationPath`.
- Delete: `packages/core/metadata/operations/targetSchema.ts`
- Delete: `packages/core/metadata/operations/targetSchema.test.ts`
  - Строковый path описан в `operationPath.ts`; отдельная schema структурированного target больше не нужна.
- Modify: `packages/core/metadata/operations/migrationChain.ts`
  - Проверять migration keys через общий parser/resolver и конфликт имени без учета регистра.
- Modify: `packages/core/metadata/operations/migrationChain.test.ts`
  - Проверить case-only rename, конфликт `Код` vs `код`, вложенный path, `unsupported_target`.
- Modify: `packages/cli/src/commands/migration.ts`
  - Удалить `parseOperationTargetPath`; `renameMigration`/`deleteMigration` передают `path` в core.
- Modify: `packages/cli/src/commands/migration.test.ts`
  - Убрать тест CLI parser, проверить передачу path и прежнее поведение generate-migration.
- Modify: `packages/mcp/src/contracts/operations.ts`
  - Заменить `target` на `path`; удалить shapes для `list_operation_targets`.
- Modify: `packages/mcp/src/coreApi.ts`
  - Убрать `listMetadataOperationTargets`, заменить входы `renameMetadataItem`/`deleteMetadataItem` на `path`.
- Modify: `packages/mcp/src/services/renameItem.ts`
  - Thin wrapper без преобразования path.
- Modify: `packages/mcp/src/services/deleteItem.ts`
  - Thin wrapper без преобразования path.
- Delete: `packages/mcp/src/services/listOperationTargets.ts`
- Delete: `packages/mcp/src/services/listOperationTargets.test.ts`
- Modify: `packages/mcp/src/tools/registerTools.ts`
  - Убрать регистрацию `nkdk.list_operation_targets`.
- Modify: `packages/mcp/src/tools/registerTools.test.ts`
  - Обновить список инструментов.
- Modify: `packages/mcp/src/guides/index.ts`
  - Описать `path` через русские сегменты и запрет ручного YAML-rename/delete.
- Modify: `packages/mcp/src/prompts/index.ts`
  - Повторить правило `path` и примеры.
- Modify: `packages/mcp/src/guides/index.test.ts`
  - Проверить, что `list_operation_targets` больше не упоминается, а примеры path есть.
- Modify: `packages/mcp/src/prompts/index.test.ts`
  - То же для prompts.

## Task 0: Preflight

**Files:**
- Read: `AGENTS.md` instructions from the thread.
- Read: `docs/superpowers/specs/2026-07-01-metadata-rename-delete-review-gaps-design.md`
- Read if present: `.agents/knowledge/metadata/INDEX.md`

- [ ] **Step 1: Confirm branch and clean baseline**

Run:

```bash
git status --short --branch
```

Expected: branch is `codex/metadata-rename-delete-design`. Existing user changes, if any, are listed and left untouched.

- [ ] **Step 2: Check metadata knowledge file**

Run:

```bash
test -f .agents/knowledge/metadata/INDEX.md && sed -n '1,260p' .agents/knowledge/metadata/INDEX.md || printf '%s\n' 'metadata knowledge index is missing'
```

Expected: either the knowledge file is printed, or the exact line `metadata knowledge index is missing`. If the file appears later before editing `packages/core/metadata/**`, read it before code changes.

- [ ] **Step 3: Run focused baseline**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/operations metadata/validation/dataPath metadata/validation/validateProject.test.ts --no-isolate
pnpm --filter @nakidka/mcp test
pnpm --filter @nakidka/cli test
```

Expected: current branch tests pass before the refactor starts. If failures are unrelated and pre-existing, record the failing test names before continuing.

## Task 1: Core Operation Path Parser

**Files:**
- Create: `packages/core/metadata/operations/operationPath.ts`
- Create: `packages/core/metadata/operations/operationPath.test.ts`
- Modify: `packages/core/metadata/operations/types.ts`
- Modify: `packages/core/metadata/operations/index.ts`

- [ ] **Step 1: Write failing tests for path syntax**

Create `packages/core/metadata/operations/operationPath.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { buildRenameTargetPathFromOperationPath, parseMetadataOperationPath } from "./operationPath"

describe("parseMetadataOperationPath", () => {
  it("parses object and nested target paths", () => {
    expect(parseMetadataOperationPath("Справочник.Товары")).toEqual({
      ok: true,
      path: "Справочник.Товары",
      owner: { itemTypePrefix: "Справочник", name: "Товары" },
      chain: [],
      localName: "Товары",
    })
    expect(parseMetadataOperationPath("Справочник.Товары.Реквизит.Артикул")).toMatchObject({
      ok: true,
      owner: { itemTypePrefix: "Справочник", name: "Товары" },
      chain: [{ collectionSegment: "Реквизит", name: "Артикул" }],
      localName: "Артикул",
    })
    expect(parseMetadataOperationPath("Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество")).toMatchObject({
      ok: true,
      owner: { itemTypePrefix: "Документ", name: "Заказ" },
      chain: [
        { collectionSegment: "ТабличнаяЧасть", name: "Товары" },
        { collectionSegment: "Реквизит", name: "Количество" },
      ],
      localName: "Количество",
    })
  })

  it("rejects syntactically invalid paths", () => {
    for (const value of ["", "Справочник.Товары.", "Справочник..Товары", "Справочник.Товары.Реквизит"]) {
      expect(parseMetadataOperationPath(value)).toMatchObject({ ok: false, code: "invalid_path" })
    }
  })

  it("replaces only the last local name for migration target path", () => {
    expect(buildRenameTargetPathFromOperationPath("Справочник.Товары.Реквизит.Артикул", "КодПоставщика")).toBe(
      "Справочник.Товары.Реквизит.КодПоставщика",
    )
    expect(
      buildRenameTargetPathFromOperationPath(
        "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество",
        "Цена",
      ),
    ).toBe("Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Цена")
  })
})
```

- [ ] **Step 2: Run the failing parser test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/operationPath.test.ts --no-isolate
```

Expected: FAIL because `operationPath.ts` does not exist.

- [ ] **Step 3: Implement the parser**

Create `packages/core/metadata/operations/operationPath.ts`:

```ts
import { validateMetadataLocalName } from "./nameRules"

export interface ParsedMetadataOperationPath {
  ok: true
  path: string
  owner: { itemTypePrefix: string; name: string }
  chain: ParsedMetadataOperationPathSegment[]
  localName: string
}

export interface ParsedMetadataOperationPathSegment {
  collectionSegment: string
  name: string
}

export interface MetadataOperationPathFailure {
  ok: false
  code: "invalid_path"
  message: string
}

export type MetadataOperationPathParseResult = ParsedMetadataOperationPath | MetadataOperationPathFailure

export function parseMetadataOperationPath(path: string): MetadataOperationPathParseResult {
  if (path.length === 0) return invalidPath("Путь metadata-операции пуст")

  const parts = path.split(".")
  if (parts.some((part) => part.length === 0)) return invalidPath(`Некорректный путь metadata-операции: ${path}`)
  if (parts.length < 2) return invalidPath(`Путь metadata-операции должен начинаться с вида и имени объекта: ${path}`)
  if ((parts.length - 2) % 2 !== 0) return invalidPath(`Незавершенный путь metadata-операции: ${path}`)

  for (const part of parts) {
    const name = validateMetadataLocalName(part)
    if (!name.ok) return invalidPath(`Некорректный сегмент "${part}" в пути metadata-операции`)
  }

  const chain: ParsedMetadataOperationPathSegment[] = []
  for (let index = 2; index < parts.length; index += 2) {
    chain.push({ collectionSegment: parts[index]!, name: parts[index + 1]! })
  }

  return {
    ok: true,
    path,
    owner: { itemTypePrefix: parts[0]!, name: parts[1]! },
    chain,
    localName: chain.at(-1)?.name ?? parts[1]!,
  }
}

export function buildRenameTargetPathFromOperationPath(path: string, newName: string): string {
  const parsed = parseMetadataOperationPath(path)
  if (!parsed.ok) throw new Error(parsed.message)
  const dot = path.lastIndexOf(".")
  return dot < 0 ? newName : `${path.slice(0, dot + 1)}${newName}`
}

function invalidPath(message: string): MetadataOperationPathFailure {
  return { ok: false, code: "invalid_path", message }
}
```

- [ ] **Step 4: Update public operation types**

In `packages/core/metadata/operations/types.ts`, remove exported structured target interfaces from the public contract and add these public input shapes:

```ts
export interface RenameMetadataItemParams {
  projectDir: string
  path: string
  newName: string
  allowWrite?: boolean
  now?: Date
}

export interface DeleteMetadataItemParams {
  projectDir: string
  path: string
  allowWrite?: boolean
}
```

Add failure codes:

```ts
| "invalid_path"
| "rule_contract_violation"
```

Keep internal structured resolver types private to `targetResolver.ts` or `operationPath.ts`; do not export them from `index.ts`.

- [ ] **Step 5: Export operation path helpers**

Modify `packages/core/metadata/operations/index.ts`:

```ts
export * from "./context"
export * from "./dataPathReferences"
export * from "./deleteItem"
export * from "./filePlan"
export * from "./migrationChain"
export * from "./nameRules"
export * from "./operationPath"
export * from "./projectSnapshot"
export * from "./references"
export * from "./renameItem"
export * from "./targetResolver"
export * from "./types"
export * from "./yamlModelIO"
export * from "./xmlChanges"
```

Do not export `listOperationTargets` or structured target schema.

- [ ] **Step 6: Verify parser**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/operationPath.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/core/metadata/operations/operationPath.ts packages/core/metadata/operations/operationPath.test.ts packages/core/metadata/operations/types.ts packages/core/metadata/operations/index.ts
git commit -m "refactor: :recycle: добавить core parser metadata path"
```

## Task 2: Rule-Driven Target Resolver

**Files:**
- Modify: `packages/core/metadata/orchestration/property/operationTargets.ts`
- Modify: files that call `fileItemCollectionTarget`
- Modify: `packages/core/metadata/operations/targetResolver.ts`
- Modify: `packages/core/metadata/operations/targetResolver.test.ts`

- [ ] **Step 1: Write failing resolver tests**

Replace `packages/core/metadata/operations/targetResolver.test.ts` with tests that call resolver by parsed path:

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { parseMetadataOperationPath } from "./operationPath"
import { buildMetadataOperationSnapshot } from "./projectSnapshot"
import { resolveMetadataOperationTarget } from "./targetResolver"

describe("resolveMetadataOperationTarget", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-target-resolver-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента"), { recursive: true })
    mkdirSync(join(projectDir, "Документ", "Заказ"), { recursive: true })
    writeFileSync(
      join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
      ["Реквизиты:", "  Артикул:", "    Тип: Строка"].join("\n"),
    )
    writeFileSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Форма.yaml"), "Элементы: {}\n")
    writeFileSync(
      join(projectDir, "Документ", "Заказ", "Свойства.yaml"),
      [
        "ТабличныеЧасти:",
        "  Товары:",
        "    Реквизиты:",
        "      Количество:",
        "        Тип: Число",
      ].join("\n"),
    )
    return projectDir
  }

  function resolve(projectDir: string, path: string) {
    const snapshot = buildMetadataOperationSnapshot({ projectDir, requireValidProject: false })
    expect(snapshot.ok).toBe(true)
    if (!snapshot.ok) throw new Error("snapshot failed")
    const parsed = parseMetadataOperationPath(path)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) throw new Error(parsed.message)
    return resolveMetadataOperationTarget(snapshot, parsed)
  }

  it("resolves object, child, nested child and file item targets", () => {
    const projectDir = createProject()

    expect(resolve(projectDir, "Справочник.Товары")).toMatchObject({
      ok: true,
      displayPath: "Справочник.Товары",
      migrationPath: "Справочник.Товары",
      requiresMigration: true,
      currentName: "Товары",
    })
    expect(resolve(projectDir, "Справочник.Товары.Реквизит.Артикул")).toMatchObject({
      ok: true,
      displayPath: "Справочник.Товары.Реквизит.Артикул",
      migrationPath: "Справочник.Товары.Реквизит.Артикул",
      requiresMigration: true,
      currentName: "Артикул",
    })
    expect(resolve(projectDir, "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество")).toMatchObject({
      ok: true,
      displayPath: "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество",
      migrationPath: "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество",
      requiresMigration: true,
      currentName: "Количество",
    })
    expect(resolve(projectDir, "Справочник.Товары.Форма.ФормаЭлемента")).toMatchObject({
      ok: true,
      displayPath: "Справочник.Товары.Форма.ФормаЭлемента",
      requiresMigration: false,
      currentName: "ФормаЭлемента",
    })
  })

  it("distinguishes unsupported target and missing node", () => {
    const projectDir = createProject()

    expect(resolve(projectDir, "Справочник.Товары.Реквизит.НетТакого")).toMatchObject({
      ok: false,
      code: "target_not_found",
    })
    expect(resolve(projectDir, "Справочник.Товары.ПредопределенныйЭлемент.БезНДС")).toMatchObject({
      ok: false,
      code: "unsupported_target",
    })
  })
})
```

- [ ] **Step 2: Run the failing resolver tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/targetResolver.test.ts --no-isolate
```

Expected: FAIL because resolver still accepts structured targets and rejects `parent`.

- [ ] **Step 3: Add file item segment to operationTarget declaration**

Modify `packages/core/metadata/orchestration/property/operationTargets.ts`:

```ts
export interface FileItemCollectionOperationTargetDeclaration {
  kind: "fileItemCollectionTarget"
  role: MetadataFileItemRole
  migrationSegment: string
  folderName: string
  yamlFileName: string
  requiresMigration: false
}

export function fileItemCollectionTarget(params: {
  role: MetadataFileItemRole
  migrationSegment: string
  folderName: string
  yamlFileName: string
}): FileItemCollectionOperationTargetDeclaration {
  return {
    kind: "fileItemCollectionTarget",
    role: params.role,
    migrationSegment: params.migrationSegment,
    folderName: params.folderName,
    yamlFileName: params.yamlFileName,
    requiresMigration: false,
  }
}
```

Update all compile errors from `fileItemCollectionTarget(...)` calls by passing the existing display segment:

```ts
fileItemCollectionTarget({
  role: "form",
  migrationSegment: "Форма",
  folderName: "Формы",
  yamlFileName: "Форма.yaml",
})
```

For templates use `migrationSegment: "Макет"`. For commands use `migrationSegment: "Команда"`.

- [ ] **Step 4: Replace resolver with chain traversal**

Modify `packages/core/metadata/operations/targetResolver.ts` so `resolveMetadataOperationTarget` accepts `ParsedMetadataOperationPath`. Keep helper names local to the file:

```ts
export function resolveMetadataOperationTarget(
  snapshot: MetadataOperationSnapshot,
  path: ParsedMetadataOperationPath,
): ResolvedMetadataOperationTarget | ResolveMetadataOperationTargetFailure {
  if (path.chain.length === 0) return resolveObjectTarget(snapshot, path)
  return resolveChainedTarget(snapshot, path)
}
```

The resolved result must expose at least:

```ts
export interface ResolvedMetadataOperationTarget {
  ok: true
  displayPath: string
  item: OperationSnapshotItem
  modelNode: Record<string, unknown>
  currentName: string
  collectionProperty?: string
  collectionOwnerNode?: Record<string, unknown>
  collectionNames: string[]
  projectPath: string
  absolutePath: string
  resources: string[]
  requiresMigration: boolean
  migrationPath?: string
  targetPrefix: string
  targetKind: "object" | "namedCollection" | "fileItem"
}
```

For each path pair `{ collectionSegment, name }`:

```ts
const descriptor = describeMetadataRuleOperationTargets(currentRule).find((candidate) => {
  const declaration = candidate.declaration
  if (declaration.kind === "namedCollectionTarget") return declaration.migrationSegment === segment.collectionSegment
  if (declaration.kind === "fileItemCollectionTarget") return declaration.migrationSegment === segment.collectionSegment
  return false
})
```

If descriptor is missing, return `unsupported_target`. If descriptor exists but item name is absent, return `target_not_found`. For named collections, move `currentRule` to the collection item rule using the existing `collectionItemRule` type-rule or inline `itemRule`. Do not branch on `"ТабличнаяЧасть"`.

- [ ] **Step 5: Remove hardcoded file item display mapping**

In `targetResolver.ts`, delete `roleDisplaySegment`. Build file-item display path from `descriptor.declaration.migrationSegment`, not from role.

- [ ] **Step 6: Verify resolver and operation target declaration tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/property/operationTargets.test.ts packages/core/metadata/operations/targetResolver.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/core/metadata/orchestration/property/operationTargets.ts packages/core/metadata/operations/targetResolver.ts packages/core/metadata/operations/targetResolver.test.ts
git add packages/core/metadata
git commit -m "refactor: :recycle: разрешать metadata path через operationTarget"
```

## Task 3: Operation Snapshot Uses Validation Project Files

**Files:**
- Modify: `packages/core/metadata/operations/projectSnapshot.ts`
- Modify: `packages/core/metadata/operations/yamlModelIO.ts`
- Modify: `packages/core/metadata/operations/projectSnapshot.test.ts`

- [ ] **Step 1: Write failing snapshot test**

Append to `packages/core/metadata/operations/projectSnapshot.test.ts`:

```ts
it("includes the same YAML file kinds as validation discovery", () => {
  const projectDir = mkdtempSync(join(tmpdir(), "nkdk-operation-snapshot-"))
  tempDirs.push(projectDir)
  mkdirSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента"), { recursive: true })
  writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "{}\n")
  writeFileSync(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Форма.yaml"), "Элементы: {}\n")

  const result = buildMetadataOperationSnapshot({ projectDir, requireValidProject: false })

  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.items.map((item) => item.projectPath).sort()).toEqual([
    "Справочник/Товары/Свойства.yaml",
    "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
  ])
})
```

- [ ] **Step 2: Run the failing snapshot test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/projectSnapshot.test.ts --no-isolate
```

Expected: FAIL because current snapshot filters out forms.

- [ ] **Step 3: Use validation discovery in snapshot**

Modify imports in `projectSnapshot.ts`:

```ts
import { ClientApplicationFormRules } from "~/metadata/forms/clientApplicationForm/rules"
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
import { discoverValidationProjectFiles, type ValidationProjectFile } from "~/metadata/validation/projectFiles"
```

Change `OperationSnapshotItem`:

```ts
export interface OperationSnapshotItem {
  resource: ValidationProjectFile
  filePath: string
  projectPath: string
  ownerDirPath: string
  parsed: ParsedYaml
  model: Record<string, unknown>
  rule: MetadataItemRule
  kind: ValidationProjectFile["kind"]
}
```

In `buildMetadataOperationSnapshot`, replace the `discoverMetadataProjectResources` loop with:

```ts
for (const resource of discoverValidationProjectFiles(projectDir)) {
  const item = importSnapshotItem({ resource, context, requireValidProject: params.requireValidProject })
  if (item.ok) {
    items.push(item.item)
    continue
  }
  if (params.requireValidProject) return item.failure
}
```

- [ ] **Step 4: Import properties and forms by rule**

In `importSnapshotItem`, choose rule and model by `resource.kind`:

```ts
const parsed = parseMetadataYaml(readFileSync(params.resource.absolutePath, "utf-8"))
const rule = params.resource.kind === "form" ? ClientApplicationFormRules : params.resource.owner.spec.rule
const model =
  params.resource.kind === "form"
    ? importClientApplicationFormFromYAML(params.context, parsed.data as never) as Record<string, unknown>
    : importMetadataItemFromYAML({
        context: params.context,
        yaml: parsed.data,
        rule: params.resource.owner.spec.rule,
        name: params.resource.owner.name,
      }) as Record<string, unknown> | undefined
```

Keep `model.name ??= params.resource.owner.name` only for `properties`; do not invent a form name field.

- [ ] **Step 5: Export touched forms by form rules**

Modify `packages/core/metadata/operations/yamlModelIO.ts`:

```ts
import { exportClientApplicationFormToYAML } from "~/metadata/forms/clientApplicationForm/toYAML"

export function exportOperationItemToYamlText(item: OperationSnapshotItem, context: ConfigurationContext): string {
  if (item.kind === "form") {
    return exportToYAML(exportClientApplicationFormToYAML(context, item.model as never).yaml)
  }

  const yaml = exportMetadataItemToYAML({
    context,
    data: item.model as never,
    rule: item.rule as never,
  })
  return exportToYAML(yaml)
}
```

- [ ] **Step 6: Verify snapshot**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/projectSnapshot.test.ts packages/core/metadata/operations/yamlModelIO.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/core/metadata/operations/projectSnapshot.ts packages/core/metadata/operations/projectSnapshot.test.ts packages/core/metadata/operations/yamlModelIO.ts packages/core/metadata/operations/yamlModelIO.test.ts
git commit -m "refactor: :recycle: читать operation snapshot через validation files"
```

## Task 4: Rename/Delete Use Path And Full Snapshot References

**Files:**
- Modify: `packages/core/metadata/operations/references.ts`
- Modify: `packages/core/metadata/operations/renameItem.ts`
- Modify: `packages/core/metadata/operations/deleteItem.ts`
- Modify: `packages/core/metadata/operations/renameItem.test.ts`
- Modify: `packages/core/metadata/operations/deleteItem.test.ts`

- [ ] **Step 1: Update rename/delete tests to `path`**

In `renameItem.test.ts` and `deleteItem.test.ts`, replace inputs like:

```ts
target: { kind: "object", itemTypePrefix: "Справочник", name: "Товары" }
```

with:

```ts
path: "Справочник.Товары"
```

Replace attribute inputs with:

```ts
path: "Справочник.Товары.Реквизит.Артикул"
```

Replace file-item inputs with:

```ts
path: "Справочник.Товары.Форма.ФормаЭлемента"
```

Add a rename test for nested attributes:

```ts
it("renames nested tabular section attribute through operation path", () => {
  const projectDir = createProject()
  const propertiesPath = writeProjectFile(projectDir, "Документ/Заказ/Свойства.yaml", [
    "ТабличныеЧасти:",
    "  Товары:",
    "    Реквизиты:",
    "      Количество:",
    "        Тип: Число",
  ])

  const result = renameMetadataItem({
    projectDir,
    path: "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество",
    newName: "Цена",
    allowWrite: true,
    now: new Date("2026-07-01T08:00:00.000Z"),
  })

  expect(result).toMatchObject({
    ok: true,
    createdMigration: {
      from: "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество",
      to: "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Цена",
    },
  })
  expect(readFileSync(propertiesPath, "utf-8")).toContain("Цена:")
})
```

- [ ] **Step 2: Add full snapshot form reference tests**

Append to `renameItem.test.ts`:

```ts
it("rewrites form structural references when a referenced object is renamed", () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "ОбщаяКартинка/Состояния/Свойства.yaml", "{}")
  writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}")
  const formPath = writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
    "Реквизиты:",
    "  ИндексКартинки:",
    "    Тип: Число",
    "Элементы:",
    "  Картинка:",
    "    Вид: ПолеРисунка",
    "    КартинкаЗначений: ОбщаяКартинка.Состояния",
    "    ПутьКДанным: ИндексКартинки",
  ])

  const result = renameMetadataItem({
    projectDir,
    path: "ОбщаяКартинка.Состояния",
    newName: "Статусы",
    allowWrite: true,
  })

  expect(result.ok).toBe(true)
  expect(readFileSync(formPath, "utf-8")).toContain("КартинкаЗначений: ОбщаяКартинка.Статусы")
})
```

Append to `deleteItem.test.ts`:

```ts
it("blocks delete when a form contains a structural reference", () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "ОбщаяКартинка/Состояния/Свойства.yaml", "{}")
  writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}")
  writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
    "Реквизиты:",
    "  ИндексКартинки:",
    "    Тип: Число",
    "Элементы:",
    "  Картинка:",
    "    Вид: ПолеРисунка",
    "    КартинкаЗначений: ОбщаяКартинка.Состояния",
    "    ПутьКДанным: ИндексКартинки",
  ])

  const result = deleteMetadataItem({
    projectDir,
    path: "ОбщаяКартинка.Состояния",
  })

  expect(result).toMatchObject({
    ok: false,
    code: "references_found",
    blockedReferences: [expect.objectContaining({ value: "CommonPicture.Состояния" })],
  })
})
```

- [ ] **Step 3: Run failing operation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/renameItem.test.ts packages/core/metadata/operations/deleteItem.test.ts --no-isolate
```

Expected: FAIL because operations still require `target`.

- [ ] **Step 4: Parse path in operations**

In `renameItem.ts`, change params to import `RenameMetadataItemParams` from `types.ts`, call parser before resolver:

```ts
const parsedPath = parseMetadataOperationPath(params.path)
if (!parsedPath.ok) return failure(parsedPath.code, parsedPath.message)

const resolved = resolveMetadataOperationTarget(snapshot, parsedPath)
if (!resolved.ok) return failure(resolved.code, resolved.message)
```

Use `resolved.currentName` in `hasCaseInsensitiveConflict`:

```ts
currentName: resolved.currentName,
```

In `deleteItem.ts`, do the same parser/resolver flow with `params.path`.

- [ ] **Step 5: Update rename plan for resolved target kinds**

In `renameItem.ts`, replace checks of `params.resolved.target.kind` with `resolved.targetKind`:

```ts
if (params.resolved.targetKind === "object") {
  params.resolved.item.model.name = params.newName
} else if (params.resolved.targetKind === "namedCollection") {
  params.resolved.modelNode.name = params.newName
  touchedItems.add(params.resolved.item)
}
```

For file items, rename the directory when `targetKind === "fileItem"`.

- [ ] **Step 6: Update delete plan for resolved target kinds**

In `deleteItem.ts`, use `resolved.targetKind`:

```ts
if (params.resolved.targetKind === "object") {
  steps.push({ kind: "removePath", path: params.resolved.item.ownerDirPath })
} else if (params.resolved.targetKind === "fileItem") {
  steps.push({ kind: "removePath", path: dirname(params.resolved.absolutePath) })
} else {
  removeNamedNode(params.resolved)
  steps.push({
    kind: "writeFile",
    path: params.resolved.item.filePath,
    content: exportOperationItemToYamlText(params.resolved.item, params.snapshot.context),
  })
}
```

In `removeNamedNode`, delete from `resolved.collectionOwnerNode?.[resolved.collectionProperty]` rather than always from `resolved.item.model`, because nested collections live under the parent node.

- [ ] **Step 7: Guard structural reference setter contract**

In `references.ts`, add a result type for collection:

```ts
export type StructuralReferenceCollectionResult =
  | { ok: true; references: StructuralReferenceInput[] }
  | { ok: false; code: "rule_contract_violation"; message: string }
```

When a type-rule handler returns a candidate with missing or non-function `setCanonical`, return:

```ts
{
  ok: false,
  code: "rule_contract_violation",
  message: `Правило ${propRule.type} распознало ссылку без setter в ${params.filePath}`,
}
```

Update rename/delete to abort before file writes when reference collection returns this error.

- [ ] **Step 8: Verify operations**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/renameItem.test.ts packages/core/metadata/operations/deleteItem.test.ts packages/core/metadata/operations/references.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 9: Commit**

Run:

```bash
git add packages/core/metadata/operations/renameItem.ts packages/core/metadata/operations/deleteItem.ts packages/core/metadata/operations/references.ts packages/core/metadata/operations/renameItem.test.ts packages/core/metadata/operations/deleteItem.test.ts packages/core/metadata/operations/references.test.ts
git commit -m "refactor: :recycle: выполнять rename delete по metadata path"
```

## Task 5: DataPath References In Forms

**Files:**
- Modify: `packages/core/metadata/operations/dataPathReferences.ts`
- Modify: `packages/core/metadata/operations/renameItem.ts`
- Modify: `packages/core/metadata/operations/deleteItem.ts`
- Modify: `packages/core/metadata/operations/dataPathReferences.test.ts`
- Modify: `packages/core/metadata/operations/renameItem.test.ts`
- Modify: `packages/core/metadata/operations/deleteItem.test.ts`

- [ ] **Step 1: Add DataPath operation tests**

Append to `dataPathReferences.test.ts`:

```ts
import type { ResolvedDataPathTarget } from "~/metadata/validation/dataPath/resolver"
import { dataPathTargetMatchesCanonicalPrefix } from "./dataPathReferences"

it("matches object field DataPath targets by canonical prefix", () => {
  const target: ResolvedDataPathTarget = {
    value: "Объект.Артикул",
    segments: ["Объект", "Артикул"],
    typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "string" },
    source: { kind: "objectField", owner: { root: "Catalog", objectName: "Товары" }, name: "Артикул" },
  }

  expect(dataPathTargetMatchesCanonicalPrefix(target, "Catalog.Товары.Attribute.Артикул")).toEqual({
    segmentIndex: 1,
  })
})
```

Append to `renameItem.test.ts`:

```ts
it("rewrites resolvable form DataPath when an attribute is renamed", () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
    "Реквизиты:",
    "  Артикул:",
    "    Тип: Строка",
  ])
  const formPath = writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
    "Реквизиты:",
    "  Объект:",
    "    Тип: СправочникСсылка.Товары",
    "Элементы:",
    "  Артикул:",
    "    Вид: ПолеВвода",
    "    ПутьКДанным: Объект.Артикул",
  ])

  const result = renameMetadataItem({
    projectDir,
    path: "Справочник.Товары.Реквизит.Артикул",
    newName: "Код",
    allowWrite: true,
  })

  expect(result.ok).toBe(true)
  expect(readFileSync(formPath, "utf-8")).toContain("ПутьКДанным: Объект.Код")
})
```

Append to `deleteItem.test.ts`:

```ts
it("blocks delete when a form DataPath points to the target", () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
    "Реквизиты:",
    "  Артикул:",
    "    Тип: Строка",
  ])
  writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
    "Реквизиты:",
    "  Объект:",
    "    Тип: СправочникСсылка.Товары",
    "Элементы:",
    "  Артикул:",
    "    Вид: ПолеВвода",
    "    ПутьКДанным: Объект.Артикул",
  ])

  const result = deleteMetadataItem({
    projectDir,
    path: "Справочник.Товары.Реквизит.Артикул",
  })

  expect(result).toMatchObject({ ok: false, code: "references_found" })
})
```

- [ ] **Step 2: Run failing DataPath tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/dataPathReferences.test.ts packages/core/metadata/operations/renameItem.test.ts packages/core/metadata/operations/deleteItem.test.ts --no-isolate
```

Expected: FAIL because operations do not collect DataPath references.

- [ ] **Step 3: Implement DataPath matching helpers**

In `dataPathReferences.ts`, keep `rewriteDataPathSegments` and add:

```ts
import type { ResolvedDataPathTarget } from "~/metadata/validation/dataPath/resolver"

export function dataPathTargetMatchesCanonicalPrefix(
  target: ResolvedDataPathTarget,
  canonicalPrefix: string,
): { segmentIndex: number } | undefined {
  if (target.source.kind !== "objectField") return undefined
  const canonical = `${target.source.owner.root}.${target.source.owner.objectName}.Attribute.${target.source.name}`
  if (canonical === canonicalPrefix || canonical.startsWith(`${canonicalPrefix}.`)) {
    return { segmentIndex: target.segments.length - 1 }
  }
  return undefined
}
```

- [ ] **Step 4: Collect form DataPath occurrences through validation helpers**

In `dataPathReferences.ts`, add a collector that:

```ts
import { buildFormDataPathIndex } from "~/metadata/validation/dataPath/formIndex"
import { collectFormDataPathOccurrences } from "~/metadata/validation/dataPath/formTraversal"
import { createOwnerMetadataCache } from "~/metadata/validation/dataPath/ownerCache"
import { resolveDataPath } from "~/metadata/validation/dataPath/resolver"
```

For `OperationSnapshotItem` where `item.kind === "form"`, build the index from `item.model`, resolve each occurrence, ignore warning-only unresolved platform sources, and return candidates only when `result.status !== "error"` and `result.target !== undefined`. Do not scan arbitrary strings.

- [ ] **Step 5: Wire DataPath into rename/delete**

In `renameItem.ts`, after structural references, run the DataPath collector for each form item. When matched, set the model property that owns the DataPath to:

```ts
rewriteDataPathSegments(occurrence.value, result.target.segments, match.segmentIndex, params.newName)
```

Add the form item to `touchedItems` and append `rewrittenReferences` with `filePath`, `yamlPath`, `from`, `to`.

In `deleteItem.ts`, collect DataPath matches and append them to `blockedReferences` unless the file is inside the deleted tree.

- [ ] **Step 6: Verify DataPath**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/dataPathReferences.test.ts packages/core/metadata/operations/renameItem.test.ts packages/core/metadata/operations/deleteItem.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/core/metadata/operations/dataPathReferences.ts packages/core/metadata/operations/dataPathReferences.test.ts packages/core/metadata/operations/renameItem.ts packages/core/metadata/operations/deleteItem.ts packages/core/metadata/operations/renameItem.test.ts packages/core/metadata/operations/deleteItem.test.ts
git commit -m "feat: :sparkles: учитывать DataPath в metadata операциях"
```

## Task 6: Migration Chain Uses The Same Path Semantics

**Files:**
- Modify: `packages/core/metadata/operations/migrationChain.ts`
- Modify: `packages/core/metadata/operations/migrationChain.test.ts`

- [ ] **Step 1: Add migration conflict tests**

Append to `migrationChain.test.ts`:

```ts
it("allows case-only rename and blocks case-insensitive sibling conflict", () => {
  const { yamlDir, xmlDir } = createDirs()
  writeFileSync(join(yamlDir, "Миграции", "2026-06-30-120000.yaml"), '"Справочник.Товары.Реквизит.Артикул": артикул\n')

  const caseOnly = prepareMetadataMigrationChain({
    yamlDir,
    xmlDir,
    referencePaths: ["Справочник.Товары.Реквизит.Артикул"],
    yamlPaths: ["Справочник.Товары.Реквизит.артикул"],
    xmlAreaByMigrationPath: () => ({
      kind: "owner",
      itemType: "MetadataCatalog",
      itemTypePrefix: "Справочник",
      itemName: "Товары",
      xmlDir: "Catalogs",
    }),
  })
  expect(caseOnly.ok).toBe(true)

  writeFileSync(join(yamlDir, "Миграции", "2026-06-30-120001.yaml"), '"Справочник.Товары.Реквизит.артикул": код\n')
  const conflict = prepareMetadataMigrationChain({
    yamlDir,
    xmlDir,
    referencePaths: ["Справочник.Товары.Реквизит.Артикул", "Справочник.Товары.Реквизит.Код"],
    yamlPaths: ["Справочник.Товары.Реквизит.код", "Справочник.Товары.Реквизит.Код"],
    xmlAreaByMigrationPath: () => ({
      kind: "owner",
      itemType: "MetadataCatalog",
      itemTypePrefix: "Справочник",
      itemName: "Товары",
      xmlDir: "Catalogs",
    }),
  })
  expect(conflict).toMatchObject({
    ok: false,
    migrationErrors: [expect.objectContaining({ code: "name_conflict" })],
  })
})

it("rejects syntactically invalid migration paths", () => {
  const { yamlDir, xmlDir } = createDirs()
  writeFileSync(join(yamlDir, "Миграции", "2026-06-30-120000.yaml"), '"Справочник.Товары.Реквизит": Код\n')

  const result = prepareMetadataMigrationChain({
    yamlDir,
    xmlDir,
    referencePaths: [],
    yamlPaths: [],
    xmlAreaByMigrationPath: () => undefined,
  })

  expect(result).toMatchObject({
    ok: false,
    migrationErrors: [expect.objectContaining({ code: "invalid_migration_file" })],
  })
})
```

- [ ] **Step 2: Run failing migration tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/migrationChain.test.ts --no-isolate
```

Expected: FAIL because current chain uses exact path conflict checks.

- [ ] **Step 3: Validate migration paths through operation parser**

In `readPendingMigrationFileStrict`, after reading `[path, value]`, call:

```ts
const parsedPath = parseMetadataOperationPath(path)
if (!parsedPath.ok) throw new Error(parsedPath.message)
```

Keep value validation through `validateMetadataLocalName(value)` instead of local regex:

```ts
const validName = validateMetadataLocalName(value)
if (!validName.ok) throw new Error(validName.message)
```

- [ ] **Step 4: Use parser helper to build target path**

Replace `buildRenameTargetPathStrict` internals with:

```ts
return buildRenameTargetPathFromOperationPath(file.path, file.value)
```

- [ ] **Step 5: Make namespace conflict case-insensitive**

Add helper in `migrationChain.ts`:

```ts
function hasCaseInsensitivePathConflict(params: {
  currentPaths: Iterable<string>
  fromPath: string
  targetPath: string
}): boolean {
  const targetParent = parentPath(params.targetPath)
  const targetName = localName(params.targetPath).toLocaleLowerCase("ru")
  const fromLower = params.fromPath.toLocaleLowerCase("ru")

  for (const path of params.currentPaths) {
    if (path.toLocaleLowerCase("ru") === fromLower) continue
    if (parentPath(path) !== targetParent) continue
    if (localName(path).toLocaleLowerCase("ru") === targetName) return true
  }
  return false
}

function parentPath(path: string): string {
  const dot = path.lastIndexOf(".")
  return dot < 0 ? "" : path.slice(0, dot)
}

function localName(path: string): string {
  const dot = path.lastIndexOf(".")
  return dot < 0 ? path : path.slice(dot + 1)
}
```

Use this helper instead of exact `current.has(targetPath)` for name conflict. Keep descendant conflict check for moved subtrees, but compare prefixes through parsed path semantics.

- [ ] **Step 6: Verify migration chain**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/migrationChain.test.ts packages/core/metadata/appliedObjects/configuration/migrations --no-isolate
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/core/metadata/operations/migrationChain.ts packages/core/metadata/operations/migrationChain.test.ts packages/core/metadata/appliedObjects/configuration/migrations
git commit -m "fix: :bug: проверять миграции через metadata path"
```

## Task 7: Remove list_operation_targets And Thin CLI/MCP

**Files:**
- Modify: `packages/cli/src/commands/migration.ts`
- Modify: `packages/cli/src/commands/migration.test.ts`
- Modify: `packages/mcp/src/contracts/operations.ts`
- Modify: `packages/mcp/src/coreApi.ts`
- Modify: `packages/mcp/src/services/renameItem.ts`
- Modify: `packages/mcp/src/services/renameItem.test.ts`
- Modify: `packages/mcp/src/services/deleteItem.ts`
- Modify: `packages/mcp/src/services/deleteItem.test.ts`
- Delete: `packages/mcp/src/services/listOperationTargets.ts`
- Delete: `packages/mcp/src/services/listOperationTargets.test.ts`
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`
- Delete: `packages/core/metadata/operations/listOperationTargets.ts`
- Delete: `packages/core/metadata/operations/listOperationTargets.test.ts`
- Delete: `packages/core/metadata/operations/targetSchema.ts`
- Delete: `packages/core/metadata/operations/targetSchema.test.ts`

- [ ] **Step 1: Update CLI tests**

In `packages/cli/src/commands/migration.test.ts`, remove `parseOperationTargetPath` import and its parser test. Keep `renameMigration` and `deleteMigration` tests, but assert path behavior by observing results:

```ts
renameMigration(yamlDir, "Справочник.Товары", "Номенклатура")
```

Expected result stays:

```ts
expect(result).toMatchObject({
  ok: true,
  mode: "plan",
  createdMigration: { from: "Справочник.Товары", to: "Справочник.Номенклатура" },
})
```

- [ ] **Step 2: Update CLI command implementation**

In `packages/cli/src/commands/migration.ts`, remove `parseOperationTargetPath` and `MetadataOperationTarget` import. Change wrappers:

```ts
export function renameMigration(yamlDir: string, path: string, newName: string, allowWrite = false): void {
  printOperationResult(renameMetadataItem({
    projectDir: yamlDir,
    path,
    newName,
    allowWrite,
  }))
}

export function deleteMigration(yamlDir: string, path: string, allowWrite = false): void {
  printOperationResult(deleteMetadataItem({
    projectDir: yamlDir,
    path,
    allowWrite,
  }))
}
```

- [ ] **Step 3: Update MCP contract tests and shapes**

In `packages/mcp/src/contracts/operations.ts`, replace target shapes with:

```ts
const operationPath = z.string().min(1)

export const renameItemInputShape = {
  projectDir: z.string().min(1),
  path: operationPath,
  newName: localName,
  allowWrite: z.boolean().optional(),
}

export const deleteItemInputShape = {
  projectDir: z.string().min(1),
  path: operationPath,
  allowWrite: z.boolean().optional(),
}
```

Delete `metadataOperationTargetShape`, `listOperationTargetsInputShape`, `ListOperationTargetsInput`.

- [ ] **Step 4: Update MCP services tests**

In `renameItem.test.ts`, replace the input and assertion:

```ts
const result = await renameItem(
  {
    projectDir: "/project",
    path: "Справочник.Товары",
    newName: "Номенклатура",
    allowWrite: true,
  },
  { renameMetadataItem },
)

expect(renameMetadataItem).toHaveBeenCalledWith({
  projectDir: "/project",
  path: "Справочник.Товары",
  newName: "Номенклатура",
  allowWrite: true,
})
```

Do the same in `deleteItem.test.ts` with `path: "Справочник.Товары"`.

- [ ] **Step 5: Remove list tool registration**

In `packages/mcp/src/tools/registerTools.ts`, remove:

```ts
listOperationTargetsInputShape
listOperationTargets
server.registerTool("nkdk.list_operation_targets", ...)
```

Update `registerTools.test.ts` expected tools:

```ts
expect(calls.tools).toEqual([
  "nkdk.get_schema",
  "nkdk.describe_project_structure",
  "nkdk.validate_project",
  "nkdk.import_from_xml",
  "nkdk.sync_to_xml",
  "nkdk.init_sync_state",
  "nkdk.rename_item",
  "nkdk.delete_item",
])
```

- [ ] **Step 6: Delete obsolete files**

Run:

```bash
git rm packages/core/metadata/operations/listOperationTargets.ts packages/core/metadata/operations/listOperationTargets.test.ts packages/mcp/src/services/listOperationTargets.ts packages/mcp/src/services/listOperationTargets.test.ts
```

Delete the old structured target schema:

```bash
git rm packages/core/metadata/operations/targetSchema.ts packages/core/metadata/operations/targetSchema.test.ts
```

- [ ] **Step 7: Verify CLI/MCP**

Run:

```bash
pnpm --filter @nakidka/cli test
pnpm --filter @nakidka/mcp test
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations --no-isolate
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add packages/cli/src/commands/migration.ts packages/cli/src/commands/migration.test.ts packages/mcp/src/contracts/operations.ts packages/mcp/src/coreApi.ts packages/mcp/src/services/renameItem.ts packages/mcp/src/services/renameItem.test.ts packages/mcp/src/services/deleteItem.ts packages/mcp/src/services/deleteItem.test.ts packages/mcp/src/tools/registerTools.ts packages/mcp/src/tools/registerTools.test.ts packages/core/metadata/operations/index.ts
git add packages/core/metadata/operations packages/mcp/src/services
git commit -m "refactor: :recycle: оставить в MCP CLI только metadata path"
```

## Task 8: MCP Guides And Prompts

**Files:**
- Modify: `packages/mcp/src/guides/index.ts`
- Modify: `packages/mcp/src/guides/index.test.ts`
- Modify: `packages/mcp/src/prompts/index.ts`
- Modify: `packages/mcp/src/prompts/index.test.ts`

- [ ] **Step 1: Update guide tests**

In `packages/mcp/src/guides/index.test.ts`, replace the expectation for `nkdk.list_operation_targets` with:

```ts
expect(editGuide?.text).not.toContain("nkdk.list_operation_targets")
expect(editGuide?.text).toContain("nkdk.rename_item")
expect(editGuide?.text).toContain("nkdk.delete_item")
expect(editGuide?.text).toContain("Справочник.Товары.Реквизит.Артикул")
expect(editGuide?.text).toContain("Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество")
```

Do the same in `packages/mcp/src/prompts/index.test.ts`.

- [ ] **Step 2: Run failing guide/prompt tests**

Run:

```bash
pnpm --filter @nakidka/mcp exec vitest run src/guides/index.test.ts src/prompts/index.test.ts
```

Expected: FAIL because current guide and prompt still mention `list_operation_targets`.

- [ ] **Step 3: Update guide text**

In `packages/mcp/src/guides/index.ts`, replace the rename/delete paragraph with:

```ts
"Если пользователь хочет переименовать или удалить metadata-объект, реквизит, табличную часть, форму или макет, не правь YAML руками. Для переименования вызови `nkdk.rename_item`, для удаления — `nkdk.delete_item`; эти tools проверяют validation, структурные ссылки и сохраняют XML/reference identity там, где нужны миграции.",
"Цель передавай строкой `path`: русские сегменты через точку. Примеры: `Справочник.Товары`, `Справочник.Товары.Реквизит.Артикул`, `Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество`, `Справочник.Товары.Форма.ФормаЭлемента`, `Справочник.Товары.Макет.Печать`.",
```

- [ ] **Step 4: Update prompt text**

In `packages/mcp/src/prompts/index.ts`, replace the edit prompt rename/delete sentence with:

```ts
"Если пользователь просит переименовать или удалить metadata-цель, не правь YAML руками. Вызови `nkdk.rename_item` или `nkdk.delete_item` и передай `path` строкой через точку, например `Справочник.Товары.Реквизит.Артикул` или `Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество`.",
```

- [ ] **Step 5: Verify MCP docs**

Run:

```bash
pnpm --filter @nakidka/mcp exec vitest run src/guides/index.test.ts src/prompts/index.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add packages/mcp/src/guides/index.ts packages/mcp/src/guides/index.test.ts packages/mcp/src/prompts/index.ts packages/mcp/src/prompts/index.test.ts
git commit -m "docs: :memo: описать metadata path в MCP подсказках"
```

## Task 9: Final Verification

**Files:**
- Review: `docs/superpowers/specs/2026-07-01-metadata-rename-delete-review-gaps-design.md`
- Review: changed files from `git diff --stat develop...HEAD`

- [ ] **Step 1: Search for obsolete public target/list references**

Run:

```bash
rg "list_operation_targets|listMetadataOperationTargets|ListMetadataOperationTargets|metadataOperationTargetShape|parseOperationTargetPath|MetadataOperationTarget|target: metadataOperationTargetShape|target: \\{ kind" packages/core/metadata/operations packages/mcp/src packages/cli/src/commands/migration.ts
```

Expected: no obsolete public API references. Internal resolver types may use words like `targetKind`, but public operation inputs must be `path`.

- [ ] **Step 2: Run focused test suite**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/operations metadata/validation/dataPath metadata/validation/validateProject.test.ts metadata/appliedObjects/configuration/migrations --no-isolate
pnpm --filter @nakidka/mcp test
pnpm --filter @nakidka/cli test
```

Expected: PASS.

- [ ] **Step 3: Run full project tests**

Run from repo root:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Self-review against spec**

Check these spec points explicitly:

- `rename_item` and `delete_item` public input is `path`, not structured target.
- MCP and CLI do not parse operation path.
- `list_operation_targets` is absent from MCP registration and core public exports.
- Resolver supports nested operationTarget chains without hardcoded `ТабличнаяЧасть`.
- Operations use the same YAML files as validation, including forms.
- DataPath handling uses validation helpers and does not scan arbitrary strings.
- Migration chain validates path syntax through core parser and checks conflicts without case sensitivity.
- Case-only rename is allowed.
- Any validation/read error blocks the whole operation before writes.

- [ ] **Step 5: Commit final cleanup if needed**

If final verification required only small import or test expectation fixes, commit them:

```bash
git add packages docs
git commit -m "fix: :bug: довести metadata path договор"
```

If no files changed after the previous commits, skip this step.
