import { access, cp, mkdir, mkdtemp, rename, rm } from "node:fs/promises"
import { dirname, join } from "node:path"
import {
  NKDK_FIXTURES_ROOT,
  importMetadataProject,
  removeImportedProject,
  type ImportedMetadataProject,
} from "./metadata-project"

type ImportProject = () => Promise<ImportedMetadataProject>
type RemoveProject = (project: ImportedMetadataProject) => Promise<void>

export interface NkdkFixtureUpdateDependencies {
  readonly importProject?: ImportProject
  readonly removeProject?: RemoveProject
  readonly renamePath?: typeof rename
}

export async function updateNkdkFixture(params: {
  readonly targetDir?: string
  readonly dependencies?: NkdkFixtureUpdateDependencies
} = {}): Promise<void> {
  const targetDir = params.targetDir ?? NKDK_FIXTURES_ROOT
  const importProject = params.dependencies?.importProject ?? importMetadataProject
  const removeProject = params.dependencies?.removeProject ?? removeImportedProject
  const renamePath = params.dependencies?.renamePath ?? rename
  const imported = await importProject()
  try {
    assertSuccessfulImport(imported)
    await rm(join(imported.projectDir, ".nkdk", "cache"), { recursive: true, force: true })
    await replaceDirectoryWithRollback({ sourceDir: imported.projectDir, targetDir, renamePath })
  } finally {
    await removeProject(imported)
  }
}

export async function replaceDirectoryWithRollback(params: {
  readonly sourceDir: string
  readonly targetDir: string
  readonly renamePath?: typeof rename
}): Promise<void> {
  const renamePath = params.renamePath ?? rename
  const parentDir = dirname(params.targetDir)
  await mkdir(parentDir, { recursive: true })
  const stagingRoot = await mkdtemp(join(parentDir, ".nkdk-fixture-"))
  const nextDir = join(stagingRoot, "next")
  const previousDir = join(stagingRoot, "previous")
  let previousMoved = false
  try {
    await cp(params.sourceDir, nextDir, { recursive: true })
    if (await pathExists(params.targetDir)) {
      await renamePath(params.targetDir, previousDir)
      previousMoved = true
    }
    try {
      await renamePath(nextDir, params.targetDir)
    } catch (error) {
      if (previousMoved) await renamePath(previousDir, params.targetDir)
      throw error
    }
  } finally {
    await rm(stagingRoot, { recursive: true, force: true })
  }
}

function assertSuccessfulImport(imported: ImportedMetadataProject): void {
  const failures = imported.results.flatMap((result) =>
    result.failed.map(({ message }) => `${result.componentPath ?? "unknown"}: ${message}`)
  )
  if (failures.length > 0) throw new Error(failures.join("\n"))
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch (error) {
    if (isFileSystemError(error) && error.code === "ENOENT") return false
    throw error
  }
}

function isFileSystemError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error
}
