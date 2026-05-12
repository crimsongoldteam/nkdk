import { access, copyFile, mkdir, readFile, readdir } from "node:fs/promises"
import { dirname, join, relative } from "node:path"
import type {
  CopyOperation,
  CopyPlan,
  CopyReport,
  FixtureSelection,
  MetadataTarget,
} from "./types"

type BuildCopyPlanOptions = {
  target: MetadataTarget
  sourceXmlDir: string
  selection: FixtureSelection
}

const relatedDirs = ["Ext", "Forms", "Templates", "Commands"] as const

export async function buildCopyPlan({
  target,
  sourceXmlDir,
  selection,
}: BuildCopyPlanOptions): Promise<CopyPlan> {
  const operations: CopyOperation[] = [
    {
      source: selection.full.path,
      target: join(target.fixturesDir, "full.xml"),
      kind: "full",
    },
  ]

  if (selection.minimal !== undefined) {
    operations.push({
      source: selection.minimal.path,
      target: join(target.fixturesDir, "minimal.xml"),
      kind: "minimal",
    })
  }

  operations.push({
    source: selection.full.path,
    target: join(target.syncXmlDir, selection.full.fileName),
    kind: "sync-root",
  })

  operations.push(
    ...(await listRelatedOperations({
      sourceXmlDir,
      syncXmlDir: target.syncXmlDir,
      fullName: selection.full.name,
    })),
  )

  const overwrites = await filterExistingTargets(operations)

  return {
    metadataItem: target.metadataItem,
    sourceXmlDir,
    fixturesDir: target.fixturesDir,
    syncXmlDir: target.syncXmlDir,
    fullName: selection.full.name,
    operations,
    overwrites,
  }
}

export async function copyFixtures(plan: CopyPlan): Promise<CopyReport> {
  const created: string[] = []
  const updated: string[] = []

  for (const operation of plan.operations) {
    const exists = await pathExists(operation.target)
    await mkdir(dirname(operation.target), { recursive: true })
    await copyFile(operation.source, operation.target)

    if (exists) {
      updated.push(operation.target)
    } else {
      created.push(operation.target)
    }
  }

  const verified = await verifyCopyPlan(plan)

  return { created, updated, verified }
}

export async function verifyCopyPlan(plan: CopyPlan): Promise<string[]> {
  const verified: string[] = []

  for (const operation of plan.operations) {
    const [source, target] = await Promise.all([
      readFile(operation.source),
      readFile(operation.target),
    ])

    if (!source.equals(target)) {
      throw new Error(`Скопированный файл отличается от источника: ${operation.target}`)
    }

    verified.push(operation.target)
  }

  return verified
}

export function formatTestCommands(metadataItem: string): string[] {
  const testDir = `packages/core/metadata/appliedObjects/${metadataItem}`

  return [
    `pnpm --filter @nakidka/core exec vitest run ${testDir}/fromXML.test.ts`,
    `pnpm --filter @nakidka/core exec vitest run ${testDir}/toXML.test.ts`,
    `pnpm --filter @nakidka/core exec vitest run ${testDir}/convertFromXML.test.ts`,
    `pnpm --filter @nakidka/core exec vitest run ${testDir}/syncToXML.test.ts`,
  ]
}

export function formatCopyPlan(plan: CopyPlan): string {
  const lines = [
    `metadataItem: ${plan.metadataItem}`,
    `sourceXmlDir: ${plan.sourceXmlDir}`,
    `fixturesDir: ${plan.fixturesDir}`,
    `syncXmlDir: ${plan.syncXmlDir}`,
    `fullName: ${plan.fullName}`,
    "Операции:",
    ...plan.operations.map(
      (operation) => `[${operation.kind}] ${operation.source} -> ${operation.target}`,
    ),
  ]

  if (plan.overwrites.length > 0) {
    lines.push(
      "Перезаписи:",
      ...plan.overwrites.map(
        (operation) => `[${operation.kind}] ${operation.source} -> ${operation.target}`,
      ),
    )
  }

  return lines.join("\n")
}

async function listRelatedOperations({
  sourceXmlDir,
  syncXmlDir,
  fullName,
}: {
  sourceXmlDir: string
  syncXmlDir: string
  fullName: string
}): Promise<CopyOperation[]> {
  const operations: CopyOperation[] = []
  const fullRelatedDir = join(sourceXmlDir, fullName)

  for (const relatedDir of relatedDirs) {
    const relatedSourceDir = join(fullRelatedDir, relatedDir)

    if (!(await pathExists(relatedSourceDir))) {
      continue
    }

    const files = await listFilesRecursively(relatedSourceDir)
    operations.push(
      ...files.map((source): CopyOperation => ({
        source,
        target: join(syncXmlDir, relatedDir, relative(relatedSourceDir, source)),
        kind: "related",
      })),
    )
  }

  return operations
}

async function listFilesRecursively(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true })
  const files = await Promise.all(
    entries
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(async (entry) => {
        const path = join(root, entry.name)

        if (entry.isDirectory()) {
          return listFilesRecursively(path)
        }

        return entry.isFile() ? [path] : []
      }),
  )

  return files.flat()
}

async function filterExistingTargets(operations: CopyOperation[]): Promise<CopyOperation[]> {
  const checks = await Promise.all(
    operations.map(async (operation) => ({
      operation,
      exists: await pathExists(operation.target),
    })),
  )

  return checks.filter((check) => check.exists).map((check) => check.operation)
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch (error) {
    if (isErrorWithCode(error) && error.code === "ENOENT") {
      return false
    }

    throw error
  }
}

function isErrorWithCode(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  )
}
