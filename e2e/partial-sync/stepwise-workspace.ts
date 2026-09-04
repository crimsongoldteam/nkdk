import { lstat, mkdir, readdir, realpath } from "node:fs/promises"
import { homedir } from "node:os"
import { isAbsolute, join, resolve } from "node:path"
import type { PlatformMode } from "./concurrency"

type PathKind = "missing" | "directory" | "symlink" | "file" | "other"

export type StepwiseWorkspaceDependencies = {
  readonly repositoryRoot: string
  readonly homeDir: string
  pathKind(path: string): Promise<PathKind>
  canonicalize(path: string): Promise<string>
  listEntries(path: string): Promise<readonly string[]>
  mkdir(path: string): Promise<void>
}

export type ScenarioRunWorkspace = {
  readonly root: string
  readonly baseDir: string
  readonly dataDir: string
  readonly projectDir: string
  readonly checkpointDir: string
  readonly verificationDir: string
  readonly logsDir: string
  readonly statePath: string
}

export type StepwiseRunWorkspace = {
  readonly root: string
  readonly baselineDir: string
  readonly reportsDir: string
  readonly runStatePath: string
  scenario(mode: PlatformMode): ScenarioRunWorkspace
}

const allowedEntries = new Set(["baseline", "scenarios", "reports", "run-state.json", "run-state.json.tmp"])

export async function openStepwiseRunWorkspace(
  root: string,
  dependencies: StepwiseWorkspaceDependencies = nodeDependencies,
): Promise<StepwiseRunWorkspace> {
  if (!isAbsolute(root)) throw new Error("Корень пошагового e2e должен быть абсолютным путём")
  const requested = resolve(root)
  const kind = await dependencies.pathKind(requested)
  if (kind === "symlink") throw new Error(`Корень не может быть символической ссылкой: ${requested}`)
  if (kind !== "missing" && kind !== "directory") {
    throw new Error(`Корень не является каталогом: ${requested}`)
  }
  if (kind === "missing") await dependencies.mkdir(requested)

  const canonical = await dependencies.canonicalize(requested)
  const repository = await dependencies.canonicalize(dependencies.repositoryRoot)
  const home = await dependencies.canonicalize(dependencies.homeDir)
  if (canonical === repository || canonical === home) {
    throw new Error(`Этот каталог нельзя использовать для пошагового e2e: ${canonical}`)
  }
  const foreign = (await dependencies.listEntries(canonical))
    .find((entry) => !allowedEntries.has(entry))
  if (foreign !== undefined) throw new Error(`Каталог содержит неизвестный путь ${foreign}: ${canonical}`)

  const baselineDir = join(canonical, "baseline")
  const scenariosDir = join(canonical, "scenarios")
  const reportsDir = join(canonical, "reports")
  await Promise.all([baselineDir, scenariosDir, reportsDir].map(dependencies.mkdir))

  return {
    root: canonical,
    baselineDir,
    reportsDir,
    runStatePath: join(canonical, "run-state.json"),
    scenario(mode) {
      const scenarioRoot = join(scenariosDir, mode, "existing-partial-sync")
      return {
        root: scenarioRoot,
        baseDir: join(scenarioRoot, "base"),
        dataDir: join(scenarioRoot, "data"),
        projectDir: join(scenarioRoot, "project"),
        checkpointDir: join(scenarioRoot, "checkpoint"),
        verificationDir: join(scenarioRoot, "verification"),
        logsDir: join(scenarioRoot, "logs"),
        statePath: join(scenarioRoot, "state.json"),
      }
    },
  }
}

const nodeDependencies: StepwiseWorkspaceDependencies = {
  repositoryRoot: resolve(import.meta.dirname, "../.."),
  homeDir: homedir(),
  async pathKind(path) {
    try {
      const stats = await lstat(path)
      if (stats.isSymbolicLink()) return "symlink"
      if (stats.isDirectory()) return "directory"
      if (stats.isFile()) return "file"
      return "other"
    } catch (caught) {
      if (caught instanceof Error && "code" in caught && caught.code === "ENOENT") return "missing"
      throw caught
    }
  },
  canonicalize: realpath,
  listEntries: readdir,
  async mkdir(path) { await mkdir(path, { recursive: true }) },
}
