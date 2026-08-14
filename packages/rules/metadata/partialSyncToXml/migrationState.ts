import fs from "node:fs"
import { join, resolve } from "node:path"
import { exportToYAML } from "@nkdk/runtime"
import { importFromYAML } from "@nkdk/runtime"
import { parseComponentPath } from "@nkdk/runtime"
import {
  MIGRATIONS_DIR,
  isMigrationFileName,
  listMigrationFileNames,
  readMigrationFile,
} from "../appliedObjects/configuration/migrations"
import {
  evaluateMigrationChain,
  type MetadataMigration,
} from "../operations/migrationChain"
import { writeFileAtomic } from "./pendingStore"

export function partialXmlSyncAppliedMigrationsPath(projectDir: string, componentPath: string): string {
  parseComponentPath(componentPath)
  return join(
    resolve(projectDir),
    ".nkdk",
    "components",
    ...componentPath.split("/"),
    "applied-migrations.yaml",
  )
}

export async function readPartialXmlSyncAppliedMigrations(
  projectDir: string,
  componentPath: string,
): Promise<readonly string[]> {
  const path = partialXmlSyncAppliedMigrationsPath(projectDir, componentPath)
  let text: string
  try {
    text = await fs.promises.readFile(path, "utf8")
  } catch (caught) {
    if (hasCode(caught, "ENOENT")) return []
    throw caught
  }
  const parsed = importFromYAML<unknown>(text)
  if (!isPlainRecord(parsed) || !Array.isArray(parsed.applied)) {
    throw new Error("Некорректное component-local состояние migration")
  }
  const applied = parsed.applied
  if (applied.some((name) => typeof name !== "string" || !isMigrationFileName(name))) {
    throw new Error("Некорректное имя в component-local состоянии migration")
  }
  if (new Set(applied).size !== applied.length) throw new Error("Повтор в component-local состоянии migration")
  return applied as string[]
}

export async function evaluatePartialXmlSyncMigrationState(params: {
  readonly projectDir: string
  readonly componentPath: string
  readonly componentDir: string
  readonly hasFileChanges: boolean
}): Promise<ReturnType<typeof evaluateMigrationChain>> {
  const appliedNames = new Set(await readPartialXmlSyncAppliedMigrations(params.projectDir, params.componentPath))
  const migrations = listMigrationFileNames(params.componentDir).map((fileName): MetadataMigration => {
    const entries = readMigrationFile(join(params.componentDir, MIGRATIONS_DIR, fileName))
    const entry = entries[0]
    if (entry === undefined) throw new Error(`Пустая migration: ${fileName}`)
    return { fileName, path: entry.path, value: entry.value }
  })
  const result = evaluateMigrationChain({ migrations, appliedNames })
  if (!params.hasFileChanges && result.pending.length > 0) {
    throw new Error("Неприменённая migration не имеет файловой дельты")
  }
  return result
}

export async function publishPartialXmlSyncAppliedMigrations(params: {
  readonly projectDir: string
  readonly componentPath: string
  readonly applied: readonly string[]
}): Promise<void> {
  for (const name of params.applied) {
    if (!isMigrationFileName(name)) throw new Error(`Некорректное имя применённой migration: ${name}`)
  }
  if (new Set(params.applied).size !== params.applied.length) throw new Error("Повтор применённой migration")
  const path = partialXmlSyncAppliedMigrationsPath(params.projectDir, params.componentPath)
  await writeFileAtomic(path, new TextEncoder().encode(`${exportToYAML({ applied: [...params.applied] })}\n`))
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]"
}

function hasCode(caught: unknown, code: string): boolean {
  return caught instanceof Error && "code" in caught && caught.code === code
}
