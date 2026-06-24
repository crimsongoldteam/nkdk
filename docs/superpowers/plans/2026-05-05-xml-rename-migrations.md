# XML Rename Migrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить миграции структурных изменений XML/YAML, чтобы переименования объектов, табличных частей, реквизитов и измерений сохраняли XML `uuid`, а неоднозначные изменения блокировали `sync` до явного решения.

**Architecture:** Миграции живут в `Миграции/YYYY-MM-DD-HHmmss.yaml` как упорядоченный словарь `путь -> действие`, применяются виртуально от reference XML к текущему YAML и дают remap `currentPath -> referencePath`. `syncConfigurationToXML` становится дирижёром: читает состояние применённых миграций из `outputDir/.nakidka-migrations.yaml`, применяет неприменённые миграции, проверяет остаточные конфликты, экспортирует XML с remap reference-данных, чистит лишние файлы внутри известных `xmlDir`, затем отмечает миграции применёнными.

**Tech Stack:** TypeScript, Vitest, pnpm, `yaml`, `@inquirer/prompts`, существующие `TopLevelMetadataItemRules`, `importMetadataItemFromXML`, `importMetadataItemFromYAML`, `exportMetadataItemToXML`.

---

## Scope

Первая версия покрывает:

- верхнеуровневые объекты из `TopLevelMetadataItemRules`: `Справочник`, `Документ`, `Нумератор`, `Последовательность`;
- дочерние коллекции: `Реквизит`, `ТабличнаяЧасть`, реквизиты табличной части, `Измерение`;
- ручные команды `nkdk rename` и `nkdk delete`;
- генератор `nkdk generate-migration` с `--dry-run`;
- `.nakidka-migrations.yaml` в корне XML-каталога;
- финальную очистку XML-файлов внутри известных `xmlDir`.

Первая версия не покрывает самостоятельные миграции `Перечисление`, `Команда`, `Форма`, `Макет`.

## File Structure

- Create: `packages/core/metadata/appliedObjects/configuration/migrations/types.ts`
  - Типы путей, операций, состояния, конфликтов и remap.
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/fileNames.ts`
  - Чтение корректных файлов `YYYY-MM-DD-HHmmss.yaml`, вычисление следующего имени по UTC.
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/stateFile.ts`
  - Чтение/запись `outputDir/.nakidka-migrations.yaml`.
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/paths.ts`
  - Разбор полного пути, построение пути назначения для `rename`, проверка поддерживаемых сегментов.
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/collectState.ts`
  - Сбор структурного состояния из reference XML и текущего YAML.
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/applyMigrations.ts`
  - Последовательное применение миграций к виртуальному состоянию, построение `referencePathByCurrentPath`.
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/detectConflicts.ts`
  - Поиск остаточных конфликтов `deleted + added` на одном уровне после миграций.
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/writeMigration.ts`
  - Запись нового файла миграции для ручных команд и генератора.
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/referenceRemap.ts`
  - Подготовка `referenceData` под текущие имена перед `exportMetadataItemToXML`.
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/xmlManifest.ts`
  - Сбор ожидаемых XML-файлов и очистка лишних файлов внутри известных `xmlDir`.
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/index.ts`
  - Публичный экспорт подмодуля.
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
  - Интеграция миграций, remap и финальной очистки.
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
  - Поддержка `referenceName`, `referenceModel`, `referencePathByCurrentPath`, XML manifest.
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
  - Расширить `SyncExternalToXMLFunction` полями `referenceName?: string` и `xmlManifest?: XmlSyncManifest`.
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`
  - Читать формы из старой папки объекта при переименовании владельца; передавать manifest.
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
  - Добавить записанные файлы формы в manifest.
- Modify: `packages/core/metadata/commonObjects/module/toXML.ts`
  - Добавить скопированные `.bsl`/template-файлы в manifest.
- Modify: `packages/core/metadata/commonObjects/help/toXML.ts`
  - Добавить `Help.xml` и html-файлы в manifest.
- Modify: `packages/core/index.ts`
  - Экспортировать функции миграций, нужные CLI.
- Modify: `packages/cli/package.json`
  - Добавить `@inquirer/prompts`.
- Create: `packages/cli/src/commands/migration.ts`
  - Ручные команды `rename/delete` и интерактивный `generate-migration`.
- Modify: `packages/cli/src/cli.ts`
  - Зарегистрировать `rename`, `delete`, `generate-migration`.
- Create/Modify tests рядом с владельцами: `packages/core/metadata/appliedObjects/configuration/migrations/*.test.ts`, `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`, `packages/cli/src/commands/migration.test.ts`.
- Modify: `.agents/architecture-orchestration.md`
  - В конце реализации привести архитектурный раздел миграций к финальным решениям интервью.

## Task 1: Migration File Names And Applied State

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/types.ts`
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/fileNames.ts`
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/stateFile.ts`
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/index.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/migrations/fileNames.test.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/migrations/stateFile.test.ts`

- [ ] **Step 1: Write filename tests**

Create `packages/core/metadata/appliedObjects/configuration/migrations/fileNames.test.ts`:

```ts
import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { listMigrationFileNames, nextMigrationFileName } from "./fileNames"

describe("migration file names", () => {
  it("lists only exact UTC timestamp yaml names in sorted order", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-migrations-"))
    fs.mkdirSync(join(dir, "Миграции"))
    fs.writeFileSync(join(dir, "Миграции", "2026-05-05-143000.yaml"), "")
    fs.writeFileSync(join(dir, "Миграции", "2026-05-05-142959.yaml"), "")
    fs.writeFileSync(join(dir, "Миграции", "2026-05-05-143000-note.yaml"), "")
    fs.writeFileSync(join(dir, "Миграции", "2026-05-05-143001.YAML"), "")

    expect(listMigrationFileNames(dir)).toEqual([
      "2026-05-05-142959.yaml",
      "2026-05-05-143000.yaml",
    ])
  })

  it("uses max(now utc, latest migration + one second)", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-migrations-"))
    fs.mkdirSync(join(dir, "Миграции"))
    fs.writeFileSync(join(dir, "Миграции", "2026-05-05-143000.yaml"), "")

    expect(nextMigrationFileName(dir, new Date("2026-05-05T09:00:00.000Z"))).toBe("2026-05-05-143001.yaml")
    expect(nextMigrationFileName(dir, new Date("2026-05-05T15:00:00.000Z"))).toBe("2026-05-05-150000.yaml")
  })
})
```

- [ ] **Step 2: Run filename tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/appliedObjects/configuration/migrations/fileNames.test.ts
```

Expected: FAIL with module not found for `./fileNames`.

- [ ] **Step 3: Add shared types**

Create `packages/core/metadata/appliedObjects/configuration/migrations/types.ts`:

```ts
export const MIGRATIONS_DIR = "Миграции" as const
export const APPLIED_MIGRATIONS_FILE = ".nakidka-migrations.yaml" as const
export const DELETE_ACTION = "Удалить" as const
export const ADD_ACTION = "Добавить" as const

export type MigrationAction = typeof DELETE_ACTION | typeof ADD_ACTION | string

export interface MigrationEntry {
  path: string
  value: MigrationAction
}

export interface AppliedMigrationsState {
  applied: string[]
}

export type StructuralKind = "object" | "attribute" | "tabularSection" | "dimension"

export interface StructuralNode {
  path: string
  kind: StructuralKind
  name: string
  referencePath?: string
}

export interface StructuralState {
  nodes: Map<string, StructuralNode>
}

export interface MigrationConflict {
  levelPath: string
  deleted: string[]
  added: string[]
}

export interface AppliedMigrationResult {
  state: StructuralState
  referencePathByCurrentPath: Map<string, string>
  appliedFileNames: string[]
}
```

- [ ] **Step 4: Add filename implementation**

Create `packages/core/metadata/appliedObjects/configuration/migrations/fileNames.ts`:

```ts
import fs from "fs"
import { join } from "path"
import { MIGRATIONS_DIR } from "./types"

const FILE_RE = /^\d{4}-\d{2}-\d{2}-\d{6}\.yaml$/

export function isMigrationFileName(name: string): boolean {
  return FILE_RE.test(name)
}

export function listMigrationFileNames(yamlDir: string): string[] {
  const dir = join(yamlDir, MIGRATIONS_DIR)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter(isMigrationFileName)
    .sort((a, b) => a.localeCompare(b))
}

export function migrationFileNameToDate(name: string): Date {
  if (!isMigrationFileName(name)) throw new Error(`Некорректное имя миграции: ${name}`)
  const yyyy = name.slice(0, 4)
  const mm = name.slice(5, 7)
  const dd = name.slice(8, 10)
  const hh = name.slice(11, 13)
  const min = name.slice(13, 15)
  const ss = name.slice(15, 17)
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.000Z`)
}

export function formatMigrationFileName(date: Date): string {
  const iso = date.toISOString()
  return `${iso.slice(0, 10)}-${iso.slice(11, 13)}${iso.slice(14, 16)}${iso.slice(17, 19)}.yaml`
}

export function nextMigrationFileName(yamlDir: string, now = new Date()): string {
  const latest = listMigrationFileNames(yamlDir).at(-1)
  if (!latest) return formatMigrationFileName(now)

  const latestPlusOne = new Date(migrationFileNameToDate(latest).getTime() + 1000)
  return formatMigrationFileName(now.getTime() > latestPlusOne.getTime() ? now : latestPlusOne)
}
```

- [ ] **Step 5: Run filename tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/appliedObjects/configuration/migrations/fileNames.test.ts
```

Expected: PASS.

- [ ] **Step 6: Write applied state tests**

Create `packages/core/metadata/appliedObjects/configuration/migrations/stateFile.test.ts`:

```ts
import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { readAppliedMigrationsState, writeAppliedMigrationsState } from "./stateFile"

describe("applied migrations state", () => {
  it("returns empty state when file does not exist", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    expect(readAppliedMigrationsState(dir)).toEqual({ applied: [] })
  })

  it("writes and reads applied names in application order", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    writeAppliedMigrationsState(dir, {
      applied: ["2026-05-05-143000.yaml", "2026-05-05-143001.yaml"],
    })

    expect(fs.readFileSync(join(dir, ".nakidka-migrations.yaml"), "utf-8")).toBe(
      "applied:\n  - 2026-05-05-143000.yaml\n  - 2026-05-05-143001.yaml\n",
    )
    expect(readAppliedMigrationsState(dir)).toEqual({
      applied: ["2026-05-05-143000.yaml", "2026-05-05-143001.yaml"],
    })
  })

  it("rejects malformed state", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    fs.writeFileSync(join(dir, ".nakidka-migrations.yaml"), "applied:\n  - bad-name.yaml\n")

    expect(() => readAppliedMigrationsState(dir)).toThrow('Некорректное имя применённой миграции "bad-name.yaml"')
  })

  it("rejects duplicate applied names", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    fs.writeFileSync(
      join(dir, ".nakidka-migrations.yaml"),
      "applied:\n  - 2026-05-05-143000.yaml\n  - 2026-05-05-143000.yaml\n",
    )

    expect(() => readAppliedMigrationsState(dir)).toThrow('Дубликат применённой миграции "2026-05-05-143000.yaml"')
  })
})
```

- [ ] **Step 7: Run state tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/appliedObjects/configuration/migrations/stateFile.test.ts
```

Expected: FAIL with module not found for `./stateFile`.

- [ ] **Step 8: Add applied state implementation**

Create `packages/core/metadata/appliedObjects/configuration/migrations/stateFile.ts`:

```ts
import fs from "fs"
import { join } from "path"
import { parse, stringify } from "yaml"
import { APPLIED_MIGRATIONS_FILE, type AppliedMigrationsState } from "./types"
import { isMigrationFileName } from "./fileNames"

export function readAppliedMigrationsState(xmlDir: string): AppliedMigrationsState {
  const path = join(xmlDir, APPLIED_MIGRATIONS_FILE)
  if (!fs.existsSync(path)) return { applied: [] }

  const parsed = parse(fs.readFileSync(path, "utf-8")) as unknown
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${APPLIED_MIGRATIONS_FILE}: ожидается YAML-словарь`)
  }
  const applied = (parsed as { applied?: unknown }).applied
  if (!Array.isArray(applied)) {
    throw new Error(`${APPLIED_MIGRATIONS_FILE}: поле applied должно быть списком`)
  }

  const seen = new Set<string>()
  for (const name of applied) {
    if (typeof name !== "string" || !isMigrationFileName(name)) {
      throw new Error(`Некорректное имя применённой миграции "${String(name)}"`)
    }
    if (seen.has(name)) throw new Error(`Дубликат применённой миграции "${name}"`)
    seen.add(name)
  }

  return { applied: [...applied] }
}

export function writeAppliedMigrationsState(xmlDir: string, state: AppliedMigrationsState): void {
  fs.mkdirSync(xmlDir, { recursive: true })
  fs.writeFileSync(join(xmlDir, APPLIED_MIGRATIONS_FILE), stringify({ applied: state.applied }), "utf-8")
}
```

Create `packages/core/metadata/appliedObjects/configuration/migrations/index.ts`:

```ts
export * from "./fileNames"
export * from "./stateFile"
export * from "./types"
```

- [ ] **Step 9: Run task tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  packages/core/metadata/appliedObjects/configuration/migrations/fileNames.test.ts \
  packages/core/metadata/appliedObjects/configuration/migrations/stateFile.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit Task 1**

```bash
git add packages/core/metadata/appliedObjects/configuration/migrations
git commit -m "feat: :sparkles: добавить файлы состояния миграций"
```

## Task 2: Migration Paths And Virtual State Application

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/paths.ts`
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/applyMigrations.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/index.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/migrations/paths.test.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/migrations/applyMigrations.test.ts`

- [ ] **Step 1: Write path parsing tests**

Create `packages/core/metadata/appliedObjects/configuration/migrations/paths.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { buildRenameTargetPath, parseMigrationPath } from "./paths"

describe("migration paths", () => {
  it("parses top level object paths", () => {
    expect(parseMigrationPath("Справочник.Товары")).toEqual({
      kind: "object",
      segments: ["Справочник", "Товары"],
      localName: "Товары",
      ownerPath: "Справочник",
      levelPath: "Справочник",
    })
  })

  it("parses tabular section attribute paths", () => {
    expect(parseMigrationPath("Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество")).toMatchObject({
      kind: "attribute",
      localName: "Количество",
      ownerPath: "Документ.Заказ.ТабличнаяЧасть.Товары",
      levelPath: "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит",
    })
  })

  it("builds rename target from local name", () => {
    expect(buildRenameTargetPath("Справочник.Товары.Реквизит.Артикул", "НовыйАртикул")).toBe(
      "Справочник.Товары.Реквизит.НовыйАртикул",
    )
    expect(buildRenameTargetPath("Справочник.Товары", "Номенклатура")).toBe("Справочник.Номенклатура")
  })

  it("rejects unsupported segments", () => {
    expect(() => parseMigrationPath("Справочник.Товары.Команда.Открыть")).toThrow("Неподдерживаемый путь миграции")
  })
})
```

- [ ] **Step 2: Add path implementation**

Create `packages/core/metadata/appliedObjects/configuration/migrations/paths.ts`:

```ts
import type { StructuralKind } from "./types"

export interface ParsedMigrationPath {
  kind: StructuralKind
  segments: string[]
  localName: string
  ownerPath: string
  levelPath: string
}

const TOP_LEVEL_PREFIXES = new Set(["Справочник", "Документ", "Нумератор", "Последовательность"])

export function parseMigrationPath(path: string): ParsedMigrationPath {
  const segments = path.split(".")
  if (segments.length === 2 && TOP_LEVEL_PREFIXES.has(segments[0]!)) {
    return {
      kind: "object",
      segments,
      localName: segments[1]!,
      ownerPath: segments[0]!,
      levelPath: segments[0]!,
    }
  }

  if (segments.length === 4 && TOP_LEVEL_PREFIXES.has(segments[0]!) && segments[2] === "Реквизит") {
    return {
      kind: "attribute",
      segments,
      localName: segments[3]!,
      ownerPath: `${segments[0]}.${segments[1]}`,
      levelPath: `${segments[0]}.${segments[1]}.Реквизит`,
    }
  }

  if (segments.length === 4 && TOP_LEVEL_PREFIXES.has(segments[0]!) && segments[2] === "ТабличнаяЧасть") {
    return {
      kind: "tabularSection",
      segments,
      localName: segments[3]!,
      ownerPath: `${segments[0]}.${segments[1]}`,
      levelPath: `${segments[0]}.${segments[1]}.ТабличнаяЧасть`,
    }
  }

  if (
    segments.length === 6 &&
    TOP_LEVEL_PREFIXES.has(segments[0]!) &&
    segments[2] === "ТабличнаяЧасть" &&
    segments[4] === "Реквизит"
  ) {
    return {
      kind: "attribute",
      segments,
      localName: segments[5]!,
      ownerPath: `${segments[0]}.${segments[1]}.ТабличнаяЧасть.${segments[3]}`,
      levelPath: `${segments[0]}.${segments[1]}.ТабличнаяЧасть.${segments[3]}.Реквизит`,
    }
  }

  if (segments.length === 4 && segments[0] === "Последовательность" && segments[2] === "Измерение") {
    return {
      kind: "dimension",
      segments,
      localName: segments[3]!,
      ownerPath: `${segments[0]}.${segments[1]}`,
      levelPath: `${segments[0]}.${segments[1]}.Измерение`,
    }
  }

  throw new Error(`Неподдерживаемый путь миграции "${path}"`)
}

export function buildRenameTargetPath(path: string, newLocalName: string): string {
  if (newLocalName.length === 0) throw new Error("Новое имя не должно быть пустым")
  if (newLocalName.includes(".")) throw new Error("Новое имя не должно содержать точку")
  const parsed = parseMigrationPath(path)
  if (parsed.localName === newLocalName) throw new Error("Переименование в то же имя запрещено")
  return [...parsed.segments.slice(0, -1), newLocalName].join(".")
}
```

- [ ] **Step 3: Run path tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/appliedObjects/configuration/migrations/paths.test.ts
```

Expected: PASS.

- [ ] **Step 4: Write virtual apply tests**

Create `packages/core/metadata/appliedObjects/configuration/migrations/applyMigrations.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { applyMigrationEntries } from "./applyMigrations"
import type { StructuralState } from "./types"

function state(paths: string[]): StructuralState {
  return {
    nodes: new Map(paths.map((path) => [path, {
      path,
      kind: path.includes("ТабличнаяЧасть") ? "tabularSection" : path.includes("Реквизит") ? "attribute" : "object",
      name: path.split(".").at(-1)!,
      referencePath: path,
    }])),
  }
}

describe("applyMigrationEntries", () => {
  it("renames parent and descendants while preserving original reference paths", () => {
    const result = applyMigrationEntries(state([
      "Справочник.Товары",
      "Справочник.Товары.Реквизит.Артикул",
    ]), [
      { path: "Справочник.Товары", value: "Номенклатура" },
      { path: "Справочник.Номенклатура.Реквизит.Артикул", value: "НовыйАртикул" },
    ])

    expect([...result.state.nodes.keys()].sort()).toEqual([
      "Справочник.Номенклатура",
      "Справочник.Номенклатура.Реквизит.НовыйАртикул",
    ])
    expect(result.referencePathByCurrentPath.get("Справочник.Номенклатура")).toBe("Справочник.Товары")
    expect(result.referencePathByCurrentPath.get("Справочник.Номенклатура.Реквизит.НовыйАртикул")).toBe(
      "Справочник.Товары.Реквизит.Артикул",
    )
  })

  it("supports delete then add of the same path as recreation", () => {
    const result = applyMigrationEntries(state(["Справочник.Товары.Реквизит.Артикул"]), [
      { path: "Справочник.Товары.Реквизит.Артикул", value: "Удалить" },
      { path: "Справочник.Товары.Реквизит.Артикул", value: "Добавить" },
    ])

    expect(result.state.nodes.has("Справочник.Товары.Реквизит.Артикул")).toBe(true)
    expect(result.referencePathByCurrentPath.has("Справочник.Товары.Реквизит.Артикул")).toBe(false)
  })

  it("rejects rename when target exists in intermediate state", () => {
    expect(() => applyMigrationEntries(state([
      "Справочник.Товары.Реквизит.Старый",
      "Справочник.Товары.Реквизит.Новый",
    ]), [
      { path: "Справочник.Товары.Реквизит.Старый", value: "Новый" },
    ])).toThrow('Целевой путь уже существует "Справочник.Товары.Реквизит.Новый"')
  })

  it("rejects delete of missing path", () => {
    expect(() => applyMigrationEntries(state([]), [
      { path: "Справочник.Товары.Реквизит.Артикул", value: "Удалить" },
    ])).toThrow('Путь для удаления не найден "Справочник.Товары.Реквизит.Артикул"')
  })
})
```

- [ ] **Step 5: Add virtual apply implementation**

Create `packages/core/metadata/appliedObjects/configuration/migrations/applyMigrations.ts`:

```ts
import { ADD_ACTION, DELETE_ACTION, type MigrationEntry, type StructuralNode, type StructuralState } from "./types"
import { buildRenameTargetPath, parseMigrationPath } from "./paths"

export function applyMigrationEntries(initial: StructuralState, entries: MigrationEntry[]): {
  state: StructuralState
  referencePathByCurrentPath: Map<string, string>
} {
  const nodes = cloneNodes(initial.nodes)

  for (const entry of entries) {
    if (entry.value === DELETE_ACTION) {
      deletePath(nodes, entry.path)
      continue
    }
    if (entry.value === ADD_ACTION) {
      addPath(nodes, entry.path)
      continue
    }
    if (typeof entry.value !== "string" || entry.value.length === 0) {
      throw new Error(`Некорректное значение миграции для "${entry.path}"`)
    }
    renamePath(nodes, entry.path, buildRenameTargetPath(entry.path, entry.value))
  }

  return {
    state: { nodes },
    referencePathByCurrentPath: new Map([...nodes].flatMap(([path, node]) => node.referencePath ? [[path, node.referencePath] as const] : [])),
  }
}

function cloneNodes(nodes: Map<string, StructuralNode>): Map<string, StructuralNode> {
  return new Map([...nodes].map(([path, node]) => [path, { ...node }]))
}

function addPath(nodes: Map<string, StructuralNode>, path: string): void {
  if (nodes.has(path)) throw new Error(`Путь для добавления уже существует "${path}"`)
  const parsed = parseMigrationPath(path)
  nodes.set(path, { path, kind: parsed.kind, name: parsed.localName })
}

function deletePath(nodes: Map<string, StructuralNode>, path: string): void {
  if (!nodes.has(path)) throw new Error(`Путь для удаления не найден "${path}"`)
  for (const key of [...nodes.keys()]) {
    if (key === path || key.startsWith(`${path}.`)) nodes.delete(key)
  }
}

function renamePath(nodes: Map<string, StructuralNode>, from: string, to: string): void {
  if (!nodes.has(from)) throw new Error(`Путь для переименования не найден "${from}"`)
  if (nodes.has(to)) throw new Error(`Целевой путь уже существует "${to}"`)

  const moving = [...nodes.entries()].filter(([path]) => path === from || path.startsWith(`${from}.`))
  for (const [path] of moving) nodes.delete(path)
  for (const [path, node] of moving) {
    const nextPath = path === from ? to : `${to}${path.slice(from.length)}`
    const parsed = parseMigrationPath(nextPath)
    nodes.set(nextPath, { ...node, path: nextPath, name: parsed.localName })
  }
}
```

- [ ] **Step 6: Export migration helpers**

Update `packages/core/metadata/appliedObjects/configuration/migrations/index.ts`:

```ts
export * from "./applyMigrations"
export * from "./fileNames"
export * from "./paths"
export * from "./stateFile"
export * from "./types"
```

- [ ] **Step 7: Run task tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  packages/core/metadata/appliedObjects/configuration/migrations/paths.test.ts \
  packages/core/metadata/appliedObjects/configuration/migrations/applyMigrations.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 2**

```bash
git add packages/core/metadata/appliedObjects/configuration/migrations
git commit -m "feat: :sparkles: добавить виртуальное применение миграций"
```

## Task 3: Collect Structural State And Detect Conflicts

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/collectState.ts`
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/detectConflicts.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/index.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/migrations/collectState.test.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/migrations/detectConflicts.test.ts`

- [ ] **Step 1: Write conflict detection tests**

Create `packages/core/metadata/appliedObjects/configuration/migrations/detectConflicts.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { detectMigrationConflicts } from "./detectConflicts"
import type { StructuralState } from "./types"

function state(paths: string[]): StructuralState {
  return {
    nodes: new Map(paths.map((path) => [path, {
      path,
      kind: path.includes("Реквизит") ? "attribute" : "object",
      name: path.split(".").at(-1)!,
      referencePath: path,
    }])),
  }
}

describe("detectMigrationConflicts", () => {
  it("allows pure additions and pure deletions", () => {
    expect(detectMigrationConflicts(state(["Справочник.Товары"]), state([]))).toEqual([])
    expect(detectMigrationConflicts(state([]), state(["Справочник.Товары"]))).toEqual([])
  })

  it("reports deleted plus added on same level", () => {
    expect(detectMigrationConflicts(
      state(["Справочник.Товары.Реквизит.Артикул"]),
      state(["Справочник.Товары.Реквизит.НовыйАртикул"]),
    )).toEqual([
      {
        levelPath: "Справочник.Товары.Реквизит",
        deleted: ["Артикул"],
        added: ["НовыйАртикул"],
      },
    ])
  })
})
```

- [ ] **Step 2: Add conflict detection**

Create `packages/core/metadata/appliedObjects/configuration/migrations/detectConflicts.ts`:

```ts
import { parseMigrationPath } from "./paths"
import type { MigrationConflict, StructuralState } from "./types"

export function detectMigrationConflicts(from: StructuralState, to: StructuralState): MigrationConflict[] {
  const levels = new Map<string, { from: Set<string>; to: Set<string> }>()
  for (const path of from.nodes.keys()) add(levels, path, "from")
  for (const path of to.nodes.keys()) add(levels, path, "to")

  const conflicts: MigrationConflict[] = []
  for (const [levelPath, sets] of [...levels.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const deleted = [...sets.from].filter((name) => !sets.to.has(name)).sort((a, b) => a.localeCompare(b))
    const added = [...sets.to].filter((name) => !sets.from.has(name)).sort((a, b) => a.localeCompare(b))
    if (deleted.length > 0 && added.length > 0) conflicts.push({ levelPath, deleted, added })
  }
  return conflicts
}

function add(levels: Map<string, { from: Set<string>; to: Set<string> }>, path: string, side: "from" | "to"): void {
  const parsed = parseMigrationPath(path)
  const level = levels.get(parsed.levelPath) ?? { from: new Set<string>(), to: new Set<string>() }
  level[side].add(parsed.localName)
  levels.set(parsed.levelPath, level)
}
```

- [ ] **Step 3: Run conflict tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/appliedObjects/configuration/migrations/detectConflicts.test.ts
```

Expected: PASS.

- [ ] **Step 4: Write structural state tests**

Create `packages/core/metadata/appliedObjects/configuration/migrations/collectState.test.ts`:

```ts
import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { collectStructuralStateFromXML, collectStructuralStateFromYAML } from "./collectState"

describe("collectStructuralState", () => {
  it("collects catalog object, attributes and tabular section attributes from YAML", async () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    fs.mkdirSync(join(dir, "Справочник", "Товары"), { recursive: true })
    fs.writeFileSync(join(dir, "Справочник", "Товары", "Свойства.yaml"), [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: string",
      "ТабличныеЧасти:",
      "  Состав:",
      "    Реквизиты:",
      "      Количество:",
      "        Тип: number",
      "",
    ].join("\n"))

    const state = await collectStructuralStateFromYAML({ yamlDir: dir, context: mockContextToXML() })
    expect([...state.nodes.keys()].sort()).toEqual([
      "Справочник.Товары",
      "Справочник.Товары.Реквизит.Артикул",
      "Справочник.Товары.ТабличнаяЧасть.Состав",
      "Справочник.Товары.ТабличнаяЧасть.Состав.Реквизит.Количество",
    ])
  })

  it("returns empty XML state when reference dir does not exist", async () => {
    const state = await collectStructuralStateFromXML({
      xmlDir: join(tmpdir(), "missing-reference-dir"),
      context: mockContextFromXML(),
    })
    expect([...state.nodes.keys()]).toEqual([])
  })
})
```

- [ ] **Step 5: Implement state collection**

Create `packages/core/metadata/appliedObjects/configuration/migrations/collectState.ts`:

```ts
import fs from "fs"
import { basename, join } from "path"
import type { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromXML, importMetadataItemFromYAML } from "~/metadata/orchestration"
import { TopLevelMetadataItemRules } from "../topLevelRules"
import { importContentFromXML } from "~/xml/import/importer"
import { importFromYAML } from "~/yaml/import"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { StructuralNode, StructuralState } from "./types"

export async function collectStructuralStateFromYAML(params: {
  yamlDir: string
  context: ConfigurationContext
}): Promise<StructuralState> {
  const nodes = new Map<string, StructuralNode>()
  if (!fs.existsSync(params.yamlDir)) throw new Error(`YAML-каталог не найден: ${params.yamlDir}`)

  for (const rule of TopLevelMetadataItemRules) {
    if (!rule.itemTypePrefix) continue
    const dir = join(params.yamlDir, rule.itemTypePrefix)
    if (!fs.existsSync(dir)) continue
    for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const yamlPath = join(dir, entry.name, "Свойства.yaml")
      if (!fs.existsSync(yamlPath)) continue
      const yaml = importFromYAML<Record<string, unknown>>(await fs.promises.readFile(yamlPath, "utf-8"))
      const model = importMetadataItemFromYAML({ context: params.context, yaml, rule, name: entry.name })
      if (model) addModel(nodes, rule, entry.name, model as Record<string, unknown>)
    }
  }

  return { nodes }
}

export async function collectStructuralStateFromXML(params: {
  xmlDir: string
  context: ConfigurationContextFromXML
}): Promise<StructuralState> {
  const nodes = new Map<string, StructuralNode>()
  if (!fs.existsSync(params.xmlDir)) return { nodes }

  for (const rule of TopLevelMetadataItemRules) {
    if (!rule.xmlDir || !rule.itemTypePrefix) continue
    const dir = join(params.xmlDir, rule.xmlDir)
    if (!fs.existsSync(dir)) continue
    for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".xml")) continue
      const name = basename(entry.name, ".xml")
      const content = await fs.promises.readFile(join(dir, entry.name), "utf-8")
      const parsed = importContentFromXML<{ MetaDataObject: unknown }>(content)
      const model = importMetadataItemFromXML({ context: params.context, xml: parsed.MetaDataObject, rule })
      if (model) addModel(nodes, rule, name, model as Record<string, unknown>)
    }
  }

  return { nodes }
}

function addModel(nodes: Map<string, StructuralNode>, rule: MetadataItemRule, name: string, model: Record<string, unknown>): void {
  const prefix = rule.itemTypePrefix!
  const objectPath = `${prefix}.${name}`
  nodes.set(objectPath, { path: objectPath, kind: "object", name, referencePath: objectPath })

  for (const attr of asItems(model["attributes"])) {
    const attrName = String(attr["name"])
    const path = `${objectPath}.Реквизит.${attrName}`
    nodes.set(path, { path, kind: "attribute", name: attrName, referencePath: path })
  }

  for (const section of asItems(model["tabularSections"])) {
    const sectionName = String(section["name"])
    const sectionPath = `${objectPath}.ТабличнаяЧасть.${sectionName}`
    nodes.set(sectionPath, { path: sectionPath, kind: "tabularSection", name: sectionName, referencePath: sectionPath })
    for (const attr of asItems(section["attributes"])) {
      const attrName = String(attr["name"])
      const attrPath = `${sectionPath}.Реквизит.${attrName}`
      nodes.set(attrPath, { path: attrPath, kind: "attribute", name: attrName, referencePath: attrPath })
    }
  }

  for (const dim of asItems(model["dimensions"])) {
    const dimName = String(dim["name"])
    const path = `${objectPath}.Измерение.${dimName}`
    nodes.set(path, { path, kind: "dimension", name: dimName, referencePath: path })
  }
}

function asItems(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
  return []
}
```

- [ ] **Step 6: Export collection and conflict helpers**

Update `packages/core/metadata/appliedObjects/configuration/migrations/index.ts`:

```ts
export * from "./applyMigrations"
export * from "./collectState"
export * from "./detectConflicts"
export * from "./fileNames"
export * from "./paths"
export * from "./stateFile"
export * from "./types"
```

- [ ] **Step 7: Run task tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  packages/core/metadata/appliedObjects/configuration/migrations/collectState.test.ts \
  packages/core/metadata/appliedObjects/configuration/migrations/detectConflicts.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 3**

```bash
git add packages/core/metadata/appliedObjects/configuration/migrations
git commit -m "feat: :sparkles: находить структурные конфликты миграций"
```

## Task 4: Read Migration Files And Build A Migration Plan

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/applyMigrations.ts`
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/readMigration.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/index.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/migrations/readMigration.test.ts`

- [ ] **Step 1: Write migration reader tests**

Create `packages/core/metadata/appliedObjects/configuration/migrations/readMigration.test.ts`:

```ts
import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { readMigrationFile, readPendingMigrationEntries } from "./readMigration"

describe("readMigration", () => {
  it("reads a flat string map in object order", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-migrations-"))
    const path = join(dir, "2026-05-05-143000.yaml")
    fs.writeFileSync(path, '"Справочник.Товары": "Номенклатура"\n"Справочник.Номенклатура": Удалить\n')

    expect(readMigrationFile(path)).toEqual([
      { path: "Справочник.Товары", value: "Номенклатура" },
      { path: "Справочник.Номенклатура", value: "Удалить" },
    ])
  })

  it("rejects empty and non-string values", () => {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-migrations-"))
    const emptyPath = join(dir, "empty.yaml")
    const numericPath = join(dir, "numeric.yaml")
    fs.writeFileSync(emptyPath, '"Справочник.Товары":\n')
    fs.writeFileSync(numericPath, '"Справочник.Товары": 1\n')

    expect(() => readMigrationFile(emptyPath)).toThrow("Значение миграции должно быть непустой строкой")
    expect(() => readMigrationFile(numericPath)).toThrow("Значение миграции должно быть непустой строкой")
  })

  it("ignores applied migrations and absent applied files", () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    fs.mkdirSync(join(yamlDir, "Миграции"))
    fs.writeFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), '"Справочник.Товары": "Номенклатура"\n')
    fs.writeFileSync(join(yamlDir, "Миграции", "2026-05-05-143001.yaml"), '"Справочник.Номенклатура": Удалить\n')

    expect(readPendingMigrationEntries(yamlDir, {
      applied: ["2026-05-05-143000.yaml", "2026-05-05-142000.yaml"],
    })).toEqual([
      {
        fileName: "2026-05-05-143001.yaml",
        entries: [{ path: "Справочник.Номенклатура", value: "Удалить" }],
      },
    ])
  })
})
```

- [ ] **Step 2: Implement migration reader**

Create `packages/core/metadata/appliedObjects/configuration/migrations/readMigration.ts`:

```ts
import fs from "fs"
import { join } from "path"
import { parse } from "yaml"
import { listMigrationFileNames } from "./fileNames"
import { MIGRATIONS_DIR, type AppliedMigrationsState, type MigrationEntry } from "./types"

export interface PendingMigrationFile {
  fileName: string
  entries: MigrationEntry[]
}

export function readMigrationFile(path: string): MigrationEntry[] {
  const parsed = parse(fs.readFileSync(path, "utf-8")) as unknown
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Файл миграции должен быть YAML-словарём: ${path}`)
  }

  return Object.entries(parsed as Record<string, unknown>).map(([key, value]) => {
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(`Значение миграции должно быть непустой строкой: ${key}`)
    }
    return { path: key, value }
  })
}

export function readPendingMigrationEntries(yamlDir: string, appliedState: AppliedMigrationsState): PendingMigrationFile[] {
  const applied = new Set(appliedState.applied)
  return listMigrationFileNames(yamlDir)
    .filter((fileName) => !applied.has(fileName))
    .map((fileName) => ({
      fileName,
      entries: readMigrationFile(join(yamlDir, MIGRATIONS_DIR, fileName)),
    }))
}
```

- [ ] **Step 3: Add helper for applying pending files**

Append to `packages/core/metadata/appliedObjects/configuration/migrations/applyMigrations.ts`:

```ts
import type { PendingMigrationFile } from "./readMigration"

export function applyPendingMigrationFiles(initial: StructuralState, files: PendingMigrationFile[]): {
  state: StructuralState
  referencePathByCurrentPath: Map<string, string>
  appliedFileNames: string[]
} {
  let current = initial
  let referencePathByCurrentPath = new Map<string, string>()
  const appliedFileNames: string[] = []

  for (const file of files) {
    const result = applyMigrationEntries(current, file.entries)
    current = result.state
    referencePathByCurrentPath = result.referencePathByCurrentPath
    appliedFileNames.push(file.fileName)
  }

  return { state: current, referencePathByCurrentPath, appliedFileNames }
}
```

If this creates duplicate imports, move all imports to the top of the file and keep one import per module.

- [ ] **Step 4: Export reader**

Update `packages/core/metadata/appliedObjects/configuration/migrations/index.ts`:

```ts
export * from "./applyMigrations"
export * from "./collectState"
export * from "./detectConflicts"
export * from "./fileNames"
export * from "./paths"
export * from "./readMigration"
export * from "./stateFile"
export * from "./types"
```

- [ ] **Step 5: Run task tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/appliedObjects/configuration/migrations/readMigration.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add packages/core/metadata/appliedObjects/configuration/migrations
git commit -m "feat: :sparkles: читать файлы миграций"
```

## Task 5: Preserve Reference Data Through Rename Remap

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/referenceRemap.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/index.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 1: Add sync tests for renamed object and attribute uuid**

Append to `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`:

```ts
  it("сохраняет uuid при переименовании справочника и реквизита через remap reference", async () => {
    const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_migration_rename")
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
    fs.mkdirSync(join(yamlDir, "Миграции"), { recursive: true })
    fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })

    fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), [
      "Реквизиты:",
      "  НовыйАртикул:",
      "    Тип: string",
      "",
    ].join("\n"))
    fs.writeFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), [
      '"Справочник.Товары": "Номенклатура"',
      '"Справочник.Номенклатура.Реквизит.Артикул": "НовыйАртикул"',
      "",
    ].join("\n"))
    fs.writeFileSync(join(xmlDir, "Catalogs", "Товары.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
	<Catalog uuid="00000000-0000-0000-0000-000000000001">
		<Properties>
			<Name>Товары</Name>
			<Synonym/>
			<Comment/>
			<UseStandardCommands>true</UseStandardCommands>
			<CodeLength>9</CodeLength>
			<DescriptionLength>25</DescriptionLength>
			<Hierarchical>false</Hierarchical>
			<FoldersOnTop>true</FoldersOnTop>
			<Owners/>
			<SubordinationUse>ToItems</SubordinationUse>
			<PredefinedDataUpdate>Auto</PredefinedDataUpdate>
			<FullTextSearch>Use</FullTextSearch>
			<ChoiceMode>BothWays</ChoiceMode>
			<DefaultPresentation>AsDescription</DefaultPresentation>
			<EditType>InDialog</EditType>
			<QuickChoice>true</QuickChoice>
			<IncludeHelpInContents>true</IncludeHelpInContents>
			<InputByString/>
			<SearchStringModeOnInputByString>Begin</SearchStringModeOnInputByString>
			<CreateOnInput>Use</CreateOnInput>
			<DataLockControlMode>Managed</DataLockControlMode>
			<ModalChoiceMode>Both</ModalChoiceMode>
			<DefaultObjectForm/>
			<DefaultFolderForm/>
			<DefaultListForm/>
			<DefaultChoiceForm/>
			<DefaultFolderChoiceForm/>
			<AuxiliaryObjectForm/>
			<AuxiliaryFolderForm/>
			<AuxiliaryListForm/>
			<AuxiliaryChoiceForm/>
			<AuxiliaryFolderChoiceForm/>
		</Properties>
		<ChildObjects>
			<Attribute uuid="00000000-0000-0000-0000-000000000101">
				<Properties>
					<Name>Артикул</Name>
					<Synonym/>
					<Comment/>
					<Type>
						<v8:Type>xs:string</v8:Type>
						<v8:StringQualifiers>
							<v8:Length>0</v8:Length>
							<v8:AllowedLength>Variable</v8:AllowedLength>
						</v8:StringQualifiers>
					</Type>
					<PasswordMode>false</PasswordMode>
					<Format/>
					<EditFormat/>
					<ToolTip/>
					<MarkNegatives>false</MarkNegatives>
					<Mask/>
					<MultiLine>false</MultiLine>
					<ExtendedEdit>false</ExtendedEdit>
					<MinValue xsi:nil="true"/>
					<MaxValue xsi:nil="true"/>
					<FillChecking>DontCheck</FillChecking>
					<ChoiceFoldersAndItems>Items</ChoiceFoldersAndItems>
					<ChoiceParameterLinks/>
					<ChoiceParameters/>
					<QuickChoice>Auto</QuickChoice>
					<CreateOnInput>Use</CreateOnInput>
					<ChoiceHistoryOnInput>Auto</ChoiceHistoryOnInput>
					<FullTextSearch>Use</FullTextSearch>
					<Use>ForItem</Use>
				</Properties>
			</Attribute>
		</ChildObjects>
	</Catalog>
</MetaDataObject>`, "utf-8")

    await syncConfigurationToXML({
      context: mockContextToXML(),
      inputDir: yamlDir,
      outputDir: outDir,
      referenceDir: xmlDir,
    })

    const result = fs.readFileSync(join(outDir, "Catalogs", "Номенклатура.xml"), "utf-8")
    expect(result).toContain('<Catalog uuid="00000000-0000-0000-0000-000000000001">')
    expect(result).toContain('<Attribute uuid="00000000-0000-0000-0000-000000000101">')
    expect(result).toContain("<Name>НовыйАртикул</Name>")
  })
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts -t "remap reference"
```

Expected: FAIL because migrations are not read and `Номенклатура.xml` gets generated UUIDs or sync does not apply remap.

- [ ] **Step 3: Implement reference remap helper**

Create `packages/core/metadata/appliedObjects/configuration/migrations/referenceRemap.ts`:

```ts
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"

export function remapReferenceModel(params: {
  rule: MetadataItemRule
  currentObjectPath: string
  currentModel: Record<string, unknown>
  referenceModel: Record<string, unknown> | undefined
  referencePathByCurrentPath: Map<string, string>
}): Record<string, unknown> | undefined {
  const { currentObjectPath, currentModel, referenceModel, referencePathByCurrentPath } = params
  if (!referenceModel) return undefined
  const cloned = structuredClone(referenceModel)

  remapCollection({
    ownerPath: currentObjectPath,
    segment: "Реквизит",
    currentItems: currentModel["attributes"],
    referenceItems: cloned["attributes"],
    referencePathByCurrentPath,
  })
  remapCollection({
    ownerPath: currentObjectPath,
    segment: "Измерение",
    currentItems: currentModel["dimensions"],
    referenceItems: cloned["dimensions"],
    referencePathByCurrentPath,
  })
  remapCollection({
    ownerPath: currentObjectPath,
    segment: "ТабличнаяЧасть",
    currentItems: currentModel["tabularSections"],
    referenceItems: cloned["tabularSections"],
    referencePathByCurrentPath,
    nested: (sectionPath, currentSection, referenceSection) => {
      remapCollection({
        ownerPath: sectionPath,
        segment: "Реквизит",
        currentItems: currentSection["attributes"],
        referenceItems: referenceSection["attributes"],
        referencePathByCurrentPath,
      })
    },
  })

  return cloned
}

function remapCollection(params: {
  ownerPath: string
  segment: "Реквизит" | "ТабличнаяЧасть" | "Измерение"
  currentItems: unknown
  referenceItems: unknown
  referencePathByCurrentPath: Map<string, string>
  nested?: (
    sectionPath: string,
    currentItem: Record<string, unknown>,
    referenceItem: Record<string, unknown>,
  ) => void
}): void {
  const { ownerPath, segment, referencePathByCurrentPath, nested } = params
  if (!Array.isArray(params.currentItems) || !Array.isArray(params.referenceItems)) return

  for (const current of params.currentItems) {
    if (!current || typeof current !== "object") continue
    const currentRecord = current as Record<string, unknown>
    const currentName = typeof currentRecord["name"] === "string" ? currentRecord["name"] : undefined
    if (!currentName) continue

    const currentPath = `${ownerPath}.${segment}.${currentName}`
    const referencePath = referencePathByCurrentPath.get(currentPath) ?? currentPath
    const referenceName = referencePath.split(".").at(-1)!
    const referenceRecord = params.referenceItems.find((item): item is Record<string, unknown> => {
      return item !== null &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        (item as Record<string, unknown>)["name"] === referenceName
    })
    if (!referenceRecord) continue

    referenceRecord["name"] = currentName
    if (nested) nested(currentPath, currentRecord, referenceRecord)
  }
}
```

- [ ] **Step 4: Extend external sync function type**

Modify `packages/core/metadata/orchestration/property/fn.ts` inside `SyncExternalToXMLFunction` params:

```ts
  referenceDir?: string
  referenceName?: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
  itemName?: string
```

- [ ] **Step 5: Prepare `syncAppliedObjectToXML` for reference remap**

Modify `packages/core/metadata/orchestration/appliedObject/syncToXML.ts` params:

```ts
  referenceName?: string
  referenceModel?: Record<string, unknown>
  referencePathByCurrentPath?: Map<string, string>
  currentObjectPath?: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
```

Then change reference lookup:

```ts
  const referenceName = params.referenceName ?? name
  const referenceXmlPath = join(referenceDir, `${referenceName}.xml`)
  const loadedReferenceModel = params.referenceModel ?? readReferenceModel({ context: contextFromXML, xmlPath: referenceXmlPath, rule })
  const referenceModel = params.referencePathByCurrentPath && params.currentObjectPath
    ? remapReferenceModel({
        rule,
        currentObjectPath: params.currentObjectPath,
        currentModel: model as Record<string, unknown>,
        referenceModel: loadedReferenceModel as Record<string, unknown> | undefined,
        referencePathByCurrentPath: params.referencePathByCurrentPath,
      })
    : loadedReferenceModel
```

Add import:

```ts
import { remapReferenceModel } from "~/metadata/appliedObjects/configuration/migrations/referenceRemap"
```

When writing the main XML file, add it to manifest:

```ts
  const outputPath = join(outputDir, `${name}.xml`)
  await fs.promises.writeFile(outputPath, xmlExport(xmlObj), "utf-8")
  params.xmlManifest?.addFile(outputPath)
```

When calling `syncExternalToXML`, pass:

```ts
referenceName,
xmlManifest: params.xmlManifest,
```

- [ ] **Step 6: Update child form reference lookup**

Modify `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`:

```ts
  const { context, rule: rawRule, nkdkDir, xmlDir, name, referenceDir, referenceName, xmlManifest } = params
```

Replace reference dir construction:

```ts
  const formReferenceDir = referenceDir ? join(referenceDir, referenceName ?? name, "Forms") : undefined
```

Pass manifest:

```ts
      xmlManifest,
```

- [ ] **Step 7: Update form sync signature**

Modify `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts` params:

```ts
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
```

Pass it into `writeFormToXML`, then after each write:

```ts
  params.xmlManifest?.addFile(formMetadataPath)
  params.xmlManifest?.addFile(formXmlPath)
```

- [ ] **Step 8: Export reference remap**

Update `packages/core/metadata/appliedObjects/configuration/migrations/index.ts`:

```ts
export * from "./referenceRemap"
```

- [ ] **Step 9: Run focused sync test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts -t "remap reference"
```

Expected: still FAIL until Task 6 wires migration application into `syncConfigurationToXML`; no TypeScript compile errors from new signatures.

- [ ] **Step 10: Commit Task 5**

```bash
git add \
  packages/core/metadata/appliedObjects/configuration/migrations \
  packages/core/metadata/orchestration/appliedObject/syncToXML.ts \
  packages/core/metadata/orchestration/property/fn.ts \
  packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts \
  packages/core/metadata/forms/clientApplicationForm/syncToXML.ts \
  packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "feat: :sparkles: подготовить remap reference для миграций"
```

## Task 6: Integrate Migrations Into syncConfigurationToXML

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/xmlManifest.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
- Modify: `packages/core/metadata/commonObjects/module/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/help/toXML.ts`
- Modify: `packages/core/index.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 1: Add sync conflict and state-file tests**

Append to `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`:

```ts
  it("останавливает sync при конфликте без миграции", async () => {
    const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_migration_conflict")
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
    fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })

    fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), "")
    fs.writeFileSync(join(xmlDir, "Catalogs", "Товары.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
	<Catalog uuid="00000000-0000-0000-0000-000000000001">
		<Properties><Name>Товары</Name><Synonym/><Comment/></Properties>
	</Catalog>
</MetaDataObject>`, "utf-8")

    const result = await syncConfigurationToXML({
      context: mockContextToXML(),
      inputDir: yamlDir,
      outputDir: outDir,
      referenceDir: xmlDir,
    })

    expect(result.failed[0]?.error.message).toContain("Найдены возможные переименования")
    expect(result.failed[0]?.error.message).toContain("nkdk generate-migration")
  })

  it("пишет .nakidka-migrations.yaml после успешного sync", async () => {
    const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_migration_state")
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    fs.mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    fs.writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "")

    const result = await syncConfigurationToXML({
      context: mockContextToXML(),
      inputDir: yamlDir,
      outputDir: outDir,
      referenceDir: xmlDir,
    })

    expect(result.failed).toEqual([])
    expect(fs.readFileSync(join(outDir, ".nakidka-migrations.yaml"), "utf-8")).toBe("applied: []\n")
  })
```

- [ ] **Step 2: Create XML manifest helper**

Create `packages/core/metadata/appliedObjects/configuration/migrations/xmlManifest.ts`:

```ts
import fs from "fs"
import { dirname, relative, sep } from "path"

export class XmlSyncManifest {
  private readonly files = new Set<string>()

  constructor(private readonly xmlRoot: string) {}

  addFile(absPath: string): void {
    const rel = relative(this.xmlRoot, absPath).split(sep).join("/")
    if (!rel.startsWith("..")) this.files.add(rel)
  }

  expectedFiles(): Set<string> {
    return new Set(this.files)
  }
}

export async function pruneXmlByManifest(params: {
  xmlRoot: string
  xmlDirs: string[]
  expectedFiles: Set<string>
}): Promise<void> {
  const expectedDirs = new Set<string>()
  for (const file of params.expectedFiles) {
    let dir = dirname(file).split(sep).join("/")
    while (dir !== "." && dir !== "") {
      expectedDirs.add(dir)
      dir = dirname(dir).split(sep).join("/")
    }
  }

  for (const xmlDir of params.xmlDirs) {
    const absDir = `${params.xmlRoot}/${xmlDir}`
    if (!fs.existsSync(absDir)) continue
    await pruneDir(params.xmlRoot, absDir, params.expectedFiles, expectedDirs)
  }
}

async function pruneDir(root: string, absDir: string, expectedFiles: Set<string>, expectedDirs: Set<string>): Promise<void> {
  for (const entry of await fs.promises.readdir(absDir, { withFileTypes: true })) {
    const absPath = `${absDir}/${entry.name}`
    const rel = absPath.slice(root.length + 1).split(sep).join("/")
    if (entry.isDirectory()) {
      await pruneDir(root, absPath, expectedFiles, expectedDirs)
      if (!expectedDirs.has(rel)) await fs.promises.rm(absPath, { recursive: true, force: true })
    } else if (entry.isFile() && !expectedFiles.has(rel)) {
      await fs.promises.rm(absPath)
    }
  }
}
```

- [ ] **Step 3: Wire migration lifecycle in syncConfigurationToXML**

Modify `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`:

1. If `inputDir` does not exist, return one failed result:

```ts
  if (!fs.existsSync(inputDir)) {
    return { succeeded: 0, failed: [{ kind: "configuration", name: inputDir, error: new Error(`YAML-каталог не найден: ${inputDir}`) }] }
  }
```

2. Before building tasks, read states and pending migrations:

```ts
  const appliedState = readAppliedMigrationsState(outputDir)
  const pendingMigrations = readPendingMigrationEntries(inputDir, appliedState)
  const contextFromXML: ConfigurationContextFromXML = {
    fromXML: { forReference: true },
    defaultLanguage: context.defaultLanguage,
    version: context.version,
  }
  const referenceState = await collectStructuralStateFromXML({ xmlDir: referenceDir, context: contextFromXML })
  const yamlState = await collectStructuralStateFromYAML({ yamlDir: inputDir, context })
  const migrationResult = applyPendingMigrationFiles(referenceState, pendingMigrations)
  const conflicts = detectMigrationConflicts(migrationResult.state, yamlState)
  if (conflicts.length > 0) {
    const details = conflicts.map((c) => `${c.levelPath}: удалено [${c.deleted.join(", ")}], добавлено [${c.added.join(", ")}]`).join("\n")
    return {
      succeeded: 0,
      failed: [{
        kind: "migration",
        name: "Миграции",
        error: new Error(`Найдены возможные переименования:\n${details}\nЗапустите: nkdk generate-migration ${inputDir} ${referenceDir}`),
      }],
    }
  }
  const xmlManifest = new XmlSyncManifest(outputDir)
```

3. When pushing each object task, compute current object path and reference name:

```ts
      const currentObjectPath = `${rule.itemTypePrefix}.${name}`
      const referencePath = migrationResult.referencePathByCurrentPath.get(currentObjectPath) ?? currentObjectPath
      const referenceName = referencePath.split(".").at(-1)!
```

Pass to `syncAppliedObjectToXML`:

```ts
            referenceName,
            currentObjectPath,
            referencePathByCurrentPath: migrationResult.referencePathByCurrentPath,
            xmlManifest,
```

4. After `runBatch`, always write state only if no failed tasks and prune succeeded:

```ts
  if (batchResult.failed.length === 0) {
    await pruneXmlByManifest({
      xmlRoot: outputDir,
      xmlDirs: TopLevelMetadataItemRules.flatMap((rule) => rule.xmlDir ? [rule.xmlDir] : []),
      expectedFiles: xmlManifest.expectedFiles(),
    })
    writeAppliedMigrationsState(outputDir, {
      applied: [...appliedState.applied, ...migrationResult.appliedFileNames],
    })
  }
```

- [ ] **Step 4: Add manifest writes to module/help hooks**

In `packages/core/metadata/commonObjects/module/toXML.ts`, after copying the file:

```ts
  params.xmlManifest?.addFile(dstPath)
```

In `packages/core/metadata/commonObjects/help/toXML.ts`, after writing/copying each XML/HTML file:

```ts
  params.xmlManifest?.addFile(helpXmlPath)
  params.xmlManifest?.addFile(dstHtmlPath)
```

- [ ] **Step 5: Export migrations from core**

Update `packages/core/index.ts`:

```ts
export {
  listMigrationFileNames,
  nextMigrationFileName,
  readAppliedMigrationsState,
  readPendingMigrationEntries,
  writeAppliedMigrationsState,
  writeMigrationFile,
} from "./metadata/appliedObjects/configuration/migrations"
export type { MigrationConflict, MigrationEntry } from "./metadata/appliedObjects/configuration/migrations"
```

If `writeMigrationFile` does not exist yet, add the export in Task 7 instead.

- [ ] **Step 6: Run focused sync tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS for the existing tests plus the three migration tests.

- [ ] **Step 7: Commit Task 6**

```bash
git add \
  packages/core/metadata/appliedObjects/configuration/migrations \
  packages/core/metadata/appliedObjects/configuration/syncToXML.ts \
  packages/core/metadata/orchestration/appliedObject/syncToXML.ts \
  packages/core/metadata/commonObjects/module/toXML.ts \
  packages/core/metadata/commonObjects/help/toXML.ts \
  packages/core/index.ts
git commit -m "feat: :sparkles: применять миграции при sync"
```

## Task 7: Manual CLI Commands rename/delete

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/migrations/writeMigration.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/index.ts`
- Modify: `packages/core/index.ts`
- Create: `packages/cli/src/commands/migration.ts`
- Modify: `packages/cli/src/cli.ts`
- Test: `packages/cli/src/commands/migration.test.ts`

- [ ] **Step 1: Add core writer**

Create `packages/core/metadata/appliedObjects/configuration/migrations/writeMigration.ts`:

```ts
import fs from "fs"
import { join } from "path"
import { stringify } from "yaml"
import { nextMigrationFileName } from "./fileNames"
import { MIGRATIONS_DIR, type MigrationEntry } from "./types"

export function writeMigrationFile(params: {
  yamlDir: string
  entries: MigrationEntry[]
  now?: Date
}): string {
  if (!fs.existsSync(params.yamlDir)) throw new Error(`YAML-каталог не найден: ${params.yamlDir}`)
  const migrationsDir = join(params.yamlDir, MIGRATIONS_DIR)
  fs.mkdirSync(migrationsDir, { recursive: true })
  const fileName = nextMigrationFileName(params.yamlDir, params.now)
  const filePath = join(migrationsDir, fileName)
  const data = Object.fromEntries(params.entries.map((entry) => [entry.path, entry.value]))
  fs.writeFileSync(filePath, stringify(data), "utf-8")
  return filePath
}
```

Export it from `migrations/index.ts` and `packages/core/index.ts`.

- [ ] **Step 2: Write CLI tests**

Create `packages/cli/src/commands/migration.test.ts`:

```ts
import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it, vi } from "vitest"
import { deleteMigration, renameMigration } from "./migration"

describe("migration commands", () => {
  it("creates rename migration with local new name", () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    const log = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    renameMigration(yamlDir, "Справочник.Товары.Реквизит.Артикул", "НовыйАртикул", new Date("2026-05-05T14:30:00.000Z"))

    const filePath = join(yamlDir, "Миграции", "2026-05-05-143000.yaml")
    expect(fs.readFileSync(filePath, "utf-8")).toBe('"Справочник.Товары.Реквизит.Артикул": НовыйАртикул\n')
    expect(log).toHaveBeenCalledWith(filePath + "\n")
    log.mockRestore()
  })

  it("rejects rename no-op and names with dot", () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    expect(() => renameMigration(yamlDir, "Справочник.Товары", "Товары")).toThrow("Переименование в то же имя запрещено")
    expect(() => renameMigration(yamlDir, "Справочник.Товары", "Новые.Товары")).toThrow("Новое имя не должно содержать точку")
  })

  it("creates delete migration", () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    deleteMigration(yamlDir, "Справочник.Товары.Реквизит.СтароеПоле", new Date("2026-05-05T14:30:00.000Z"))

    expect(fs.readFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), "utf-8")).toBe(
      '"Справочник.Товары.Реквизит.СтароеПоле": Удалить\n',
    )
  })
})
```

- [ ] **Step 3: Implement CLI command functions**

Create `packages/cli/src/commands/migration.ts`:

```ts
import { ADD_ACTION, DELETE_ACTION, buildRenameTargetPath, writeMigrationFile } from "@nakidka/core"

export function renameMigration(yamlDir: string, path: string, newName: string, now = new Date()): void {
  if (path.length === 0) throw new Error("Путь не должен быть пустым")
  if (newName.length === 0) throw new Error("Новое имя не должно быть пустым")
  buildRenameTargetPath(path, newName)
  const filePath = writeMigrationFile({ yamlDir, now, entries: [{ path, value: newName }] })
  process.stdout.write(filePath + "\n")
}

export function deleteMigration(yamlDir: string, path: string, now = new Date()): void {
  if (path.length === 0) throw new Error("Путь не должен быть пустым")
  const filePath = writeMigrationFile({ yamlDir, now, entries: [{ path, value: DELETE_ACTION }] })
  process.stdout.write(filePath + "\n")
}

export { ADD_ACTION }
```

- [ ] **Step 4: Export path helper from core**

Update `packages/core/index.ts` to include:

```ts
export { ADD_ACTION, DELETE_ACTION, buildRenameTargetPath, writeMigrationFile } from "./metadata/appliedObjects/configuration/migrations"
```

- [ ] **Step 5: Register CLI commands**

Modify `packages/cli/src/cli.ts` imports:

```ts
import { deleteMigration, renameMigration } from "./commands/migration"
```

Add commands before `program.parse()`:

```ts
program
  .command("rename")
  .description("Создать миграцию переименования")
  .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
  .argument("<path>", "полный путь элемента")
  .argument("<new-name>", "новое локальное имя")
  .action((yamlDir: string, path: string, newName: string) => {
    run(() => Promise.resolve(renameMigration(yamlDir, path, newName)))
  })

program
  .command("delete")
  .description("Создать миграцию удаления")
  .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
  .argument("<path>", "полный путь элемента")
  .action((yamlDir: string, path: string) => {
    run(() => Promise.resolve(deleteMigration(yamlDir, path)))
  })
```

- [ ] **Step 6: Run CLI tests**

Run:

```bash
pnpm --filter '@nakidka/cli' exec vitest run packages/cli/src/commands/migration.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 7**

```bash
git add \
  packages/core/metadata/appliedObjects/configuration/migrations \
  packages/core/index.ts \
  packages/cli/src/commands/migration.ts \
  packages/cli/src/commands/migration.test.ts \
  packages/cli/src/cli.ts
git commit -m "feat: :sparkles: добавить команды rename и delete"
```

## Task 8: generate-migration And dry-run

**Files:**
- Modify: `packages/cli/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `packages/core/index.ts`
- Modify: `packages/cli/src/commands/migration.ts`
- Modify: `packages/cli/src/cli.ts`
- Test: `packages/cli/src/commands/migration.test.ts`

- [ ] **Step 1: Add dependency**

Run:

```bash
pnpm --filter '@nakidka/cli' add @inquirer/prompts
```

Expected: `packages/cli/package.json` and `pnpm-lock.yaml` change.

- [ ] **Step 2: Export core helpers needed by CLI**

Update `packages/core/index.ts` exports:

```ts
export {
  applyPendingMigrationFiles,
  collectStructuralStateFromXML,
  collectStructuralStateFromYAML,
  detectMigrationConflicts,
  readPendingMigrationEntries,
} from "./metadata/appliedObjects/configuration/migrations"
```

- [ ] **Step 3: Add dry-run tests**

Append to `packages/cli/src/commands/migration.test.ts`:

```ts
import { generateMigration } from "./migration"

describe("generateMigration", () => {
  it("dry-run exits with code 1 when conflicts remain", async () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    const xmlDir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
    fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })
    fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), "")
    fs.writeFileSync(join(xmlDir, "Catalogs", "Товары.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20"><Catalog uuid="00000000-0000-0000-0000-000000000001"><Properties><Name>Товары</Name><Synonym/><Comment/></Properties></Catalog></MetaDataObject>`)

    const result = await generateMigration({ yamlDir, xmlDir, dryRun: true })
    expect(result.exitCode).toBe(1)
    expect(result.filePath).toBeUndefined()
    expect(result.conflicts[0]?.levelPath).toBe("Справочник")
  })

  it("does not create a file when no migration is needed", async () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-"))
    const xmlDir = mkdtempSync(join(tmpdir(), "nkdk-xml-"))
    fs.mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    fs.writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "")

    const result = await generateMigration({ yamlDir, xmlDir, dryRun: false })
    expect(result.exitCode).toBe(0)
    expect(result.filePath).toBeUndefined()
  })
})
```

- [ ] **Step 4: Implement generateMigration core CLI function**

Modify `packages/cli/src/commands/migration.ts`:

```ts
import { select } from "@inquirer/prompts"
import {
  applyPendingMigrationFiles,
  collectStructuralStateFromXML,
  collectStructuralStateFromYAML,
  detectMigrationConflicts,
  readAppliedMigrationsState,
  readPendingMigrationEntries,
  writeMigrationFile,
  type MigrationConflict,
  type MigrationEntry,
} from "@nakidka/core"

export interface GenerateMigrationResult {
  exitCode: number
  conflicts: MigrationConflict[]
  filePath?: string
}

export async function generateMigration(params: {
  yamlDir: string
  xmlDir: string
  dryRun: boolean
  now?: Date
}): Promise<GenerateMigrationResult> {
  if (!fs.existsSync(params.yamlDir)) throw new Error(`YAML-каталог не найден: ${params.yamlDir}`)
  if (!fs.existsSync(params.xmlDir)) throw new Error(`XML-каталог не найден: ${params.xmlDir}`)

  const appliedState = readAppliedMigrationsState(params.xmlDir)
  const pending = readPendingMigrationEntries(params.yamlDir, appliedState)
  const referenceState = await collectStructuralStateFromXML({ xmlDir: params.xmlDir, context: makeFromXMLContext() })
  const yamlState = await collectStructuralStateFromYAML({ yamlDir: params.yamlDir, context: makeToXMLContext() })
  const migrated = applyPendingMigrationFiles(referenceState, pending)
  const conflicts = detectMigrationConflicts(migrated.state, yamlState)

  if (conflicts.length === 0) return { exitCode: 0, conflicts: [] }
  if (params.dryRun) return { exitCode: 1, conflicts }

  const entries: MigrationEntry[] = []
  for (const conflict of conflicts) {
    const availableAdded = [...conflict.added]
    for (const deleted of conflict.deleted) {
      const choice = await select<string>({
        message: `${conflict.levelPath}.${deleted}`,
        choices: [
          ...availableAdded.map((name) => ({ name, value: name })),
          { name: "Удалить", value: "Удалить" },
        ],
      })
      const fullPath = `${conflict.levelPath}.${deleted}`
      entries.push({ path: fullPath, value: choice })
      if (choice !== "Удалить") availableAdded.splice(availableAdded.indexOf(choice), 1)
    }
    for (const added of availableAdded) {
      entries.push({ path: `${conflict.levelPath}.${added}`, value: "Добавить" })
    }
  }

  const filePath = writeMigrationFile({ yamlDir: params.yamlDir, entries, now: params.now })
  process.stdout.write(filePath + "\n")
  return { exitCode: 0, conflicts, filePath }
}
```

Add imports for `fs` and context builders. Use local context builders matching `sync.ts`:

```ts
function makeFromXMLContext() {
  return { defaultLanguage: "ru", version: "2.20", fromXML: { forReference: true } }
}

function makeToXMLContext() {
  return {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false },
    exportToXML: {
      itemsTree: [],
      configDumpInfo: new Map(),
      version: "2.20",
      context: { forms: [], templates: [], parentName: "", metadataForNumbering: [] },
    },
  }
}
```

- [ ] **Step 5: Register generate-migration command**

Modify `packages/cli/src/cli.ts` import:

```ts
import { deleteMigration, generateMigration, renameMigration } from "./commands/migration"
```

Add command:

```ts
program
  .command("generate-migration")
  .description("Создать миграцию для неоднозначных структурных изменений")
  .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
  .argument("<xml-dir>", "путь к каталогу XML-выгрузки")
  .option("--dry-run", "показать конфликты без записи файла")
  .action((yamlDir: string, xmlDir: string, opts: { dryRun?: boolean }) => {
    run(async () => {
      const result = await generateMigration({ yamlDir, xmlDir, dryRun: opts.dryRun === true })
      if (result.conflicts.length > 0) {
        for (const conflict of result.conflicts) {
          process.stdout.write(`${conflict.levelPath}: удалено [${conflict.deleted.join(", ")}], добавлено [${conflict.added.join(", ")}]\n`)
        }
      }
      if (result.exitCode !== 0) process.exitCode = result.exitCode
    })
  })
```

- [ ] **Step 6: Run CLI tests**

Run:

```bash
pnpm --filter '@nakidka/cli' exec vitest run packages/cli/src/commands/migration.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 8**

```bash
git add \
  package.json \
  pnpm-lock.yaml \
  packages/core/index.ts \
  packages/cli/package.json \
  packages/cli/src/commands/migration.ts \
  packages/cli/src/commands/migration.test.ts \
  packages/cli/src/cli.ts
git commit -m "feat: :sparkles: добавить generate-migration"
```

## Task 9: Architecture Document And Full Verification

**Files:**
- Modify: `.agents/architecture-orchestration.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Update architecture document from final decisions**

Edit `.agents/architecture-orchestration.md` section `Миграции структурных изменений` so it contains these final decisions:

```md
- имена файлов миграций: `YYYY-MM-DD-HHmmss.yaml` в UTC, без текстового хвоста;
- при создании файла берётся `max(nowUtc, latestMigrationTimestamp + 1s)`;
- файлы с неправильным именем в `Миграции/` молча игнорируются;
- `.nakidka-migrations.yaml` хранит только корректные имена, дубликаты в `applied` — ошибка;
- строки внутри файла применяются в порядке YAML-словаря;
- дубликаты ключей не ловятся отдельно, парсер оставляет последнее значение;
- каждая строка миграции должна быть применима к текущему промежуточному состоянию, любые несоответствия — ошибка;
- предупреждений применения нет;
- применённые миграции по имени не читаются и не валидируются;
- `.nakidka-migrations.yaml` обновляется только после успешного экспорта и очистки;
- генератор создаёт один файл за сессию, без финального подтверждения, при прерывании ничего не пишет;
- ручные `rename/delete` не валидируют путь, но `rename` проверяет непустое новое имя, отсутствие точки и запрет no-op;
- очистка XML удаляет всё, чего нет в manifest ожидаемых файлов, только внутри известных `xmlDir`.
```

- [ ] **Step 2: Run all focused tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  packages/core/metadata/appliedObjects/configuration/migrations/fileNames.test.ts \
  packages/core/metadata/appliedObjects/configuration/migrations/stateFile.test.ts \
  packages/core/metadata/appliedObjects/configuration/migrations/paths.test.ts \
  packages/core/metadata/appliedObjects/configuration/migrations/applyMigrations.test.ts \
  packages/core/metadata/appliedObjects/configuration/migrations/collectState.test.ts \
  packages/core/metadata/appliedObjects/configuration/migrations/detectConflicts.test.ts \
  packages/core/metadata/appliedObjects/configuration/migrations/readMigration.test.ts \
  packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
pnpm --filter '@nakidka/cli' exec vitest run packages/cli/src/commands/migration.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run type-check**

Run:

```bash
pnpm type-check
```

Expected: PASS.

- [ ] **Step 4: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 5: Commit Task 9**

```bash
git add .agents/architecture-orchestration.md AGENTS.md
git commit -m "docs: :memo: описать архитектуру миграций XML"
```

## Self-Review

Spec coverage:

- Формат файлов миграций, UTC-имена, игнор неправильных имён, `applied` state: Tasks 1, 4, 9.
- Последовательное виртуальное применение, remap сверху вниз, строгие ошибки: Tasks 2, 4, 6.
- Сравнение XML → YAML, конфликт только `deleted + added`: Task 3 and Task 6.
- Сохранение `uuid` и `forReferenceOnly` через `referenceData`: Task 5 and Task 6.
- Объектные reference-пути, формы и внешние файлы при переименовании объекта: Task 5 and Task 6.
- CLI `rename/delete/generate-migration`, `--dry-run`, интерактивный выбор: Task 7 and Task 8.
- Финальная очистка XML через manifest: Task 6.
- Документация архитектурных решений: Task 9.

Placeholder scan:

- План не содержит незаполненных маркеров, пустых секций или указаний без конкретного файла/команды.

Type consistency:

- Основные типы живут в `migrations/types.ts`.
- `MigrationEntry`, `StructuralState`, `MigrationConflict`, `AppliedMigrationsState` используются одинаково во всех задачах.
- `referencePathByCurrentPath` — единое имя remap-таблицы от текущего пути к reference-пути.
