import { randomUUID } from "node:crypto"
import {
  lstat,
  mkdir,
  readFile,
  rename,
  rm,
  rmdir,
  writeFile,
} from "node:fs/promises"
import { dirname, isAbsolute, join, resolve, sep } from "node:path"
import type {
  ScenarioFileChange,
  ScenarioFileContents,
  ScenarioBlock,
  ScenarioComponentPath,
  ScenarioOperation,
} from "./matrix/types"

export type OperationDependencies = {
  writeAtomic(path: string, contents: ScenarioFileContents): Promise<void>
}

export function createOperationDependencies(): OperationDependencies {
  return { writeAtomic }
}

export async function applyScenarioOperation(
  projectDir: string,
  operation: ScenarioOperation,
  dependencies: OperationDependencies = createOperationDependencies(),
): Promise<readonly string[]> {
  return applyOperationToComponent(projectDir, "cf", operation, dependencies)
}

export async function applyScenarioBlock(
  projectDir: string,
  block: ScenarioBlock,
  dependencies: OperationDependencies = createOperationDependencies(),
): Promise<readonly string[]> {
  const changedPaths = new Set<string>()
  for (const operation of block.operations) {
    try {
      const operationPaths = await applyOperationToComponent(
        projectDir,
        block.componentPath,
        operation,
        dependencies,
      )
      for (const path of operationPaths) changedPaths.add(path)
    } catch (caught) {
      const detail = caught instanceof Error ? `: ${caught.message}` : ""
      throw new Error(`Не удалось применить блок ${block.key}, операция ${operation.key}${detail}`, { cause: caught })
    }
  }
  return [...changedPaths].toSorted()
}

async function applyOperationToComponent(
  projectDir: string,
  componentPath: ScenarioComponentPath,
  operation: ScenarioOperation,
  dependencies: OperationDependencies,
): Promise<readonly string[]> {
  const componentDir = join(projectDir, ...componentPath.split("/"))
  const resolvedChanges = operation.changes.map((change) => ({
    change,
    target: resolveScenarioPath(componentDir, change.path),
  }))
  assertUniquePaths(operation)

  for (const { change, target } of resolvedChanges) {
    await assertSafeFilesystemPath(componentDir, target)
    await assertBeforeMatches(change, target)
  }

  const applied: typeof resolvedChanges = []
  try {
    for (const entry of resolvedChanges) {
      await applyChange(componentDir, entry.target, entry.change.after, dependencies)
      applied.push(entry)
    }
  } catch (caught) {
    try {
      for (const entry of applied.toReversed()) {
        await applyChange(componentDir, entry.target, entry.change.before, dependencies)
      }
    } catch (rollbackError) {
      throw new AggregateError(
        [caught, rollbackError],
        `Не удалось применить и откатить операцию ${operation.key}`,
      )
    }
    throw caught
  }

  return operation.changes.map(({ path }) => path).toSorted()
}

async function applyChange(
  cfDir: string,
  target: string,
  contents: ScenarioFileContents | null,
  dependencies: OperationDependencies,
): Promise<void> {
  if (contents !== null) {
    await dependencies.writeAtomic(target, contents)
    return
  }
  await rm(target)
  await removeEmptyParents(dirname(target), cfDir)
}

function resolveScenarioPath(cfDir: string, path: string): string {
  if (path === "" || isAbsolute(path) || path.includes("\\")) {
    throw new Error(`Недопустимый путь операции: ${path}`)
  }
  const segments = path.split("/")
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error(`Недопустимый путь операции: ${path}`)
  }
  const target = resolve(cfDir, ...segments)
  const root = resolve(cfDir)
  if (!target.startsWith(`${root}${sep}`)) throw new Error(`Путь выходит за пределы cf: ${path}`)
  return target
}

async function assertSafeFilesystemPath(cfDir: string, target: string): Promise<void> {
  const root = resolve(cfDir)
  const relativeSegments = target.slice(root.length + 1).split(sep)
  let current = root
  for (let index = -1; index < relativeSegments.length; index += 1) {
    if (index >= 0) current = join(current, relativeSegments[index])
    const kind = await pathKind(current)
    if (kind === "symlink") {
      throw new Error(`Символическая ссылка запрещена в пути операции: ${current}`)
    }
    if (kind === "missing") return
    if (index < relativeSegments.length - 1 && kind !== "directory") {
      throw new Error(`Родитель пути операции не является каталогом: ${current}`)
    }
  }
}

async function assertBeforeMatches(change: ScenarioFileChange, target: string): Promise<void> {
  const kind = await pathKind(target)
  if (change.before === null) {
    if (kind !== "missing") throw new Error(`Исходное состояние before не совпадает: ${change.path}`)
    return
  }
  if (kind !== "file") throw new Error(`Исходное состояние before не совпадает: ${change.path}`)
  const actual = await readFile(target)
  const matches = typeof change.before === "string"
    ? normalizeTextLineEndings(actual.toString("utf8")) === normalizeTextLineEndings(change.before)
    : actual.equals(asBuffer(change.before))
  if (!matches) {
    throw new Error(`Исходное состояние before не совпадает: ${change.path}`)
  }
}

function normalizeTextLineEndings(value: string): string {
  return value.replaceAll(/\r\n?/gu, "\n")
}

async function writeAtomic(path: string, contents: ScenarioFileContents): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  const temporaryPath = `${path}.${randomUUID()}.tmp`
  try {
    await writeFile(temporaryPath, asBuffer(contents), { flag: "wx" })
    await rename(temporaryPath, path)
  } finally {
    await rm(temporaryPath, { force: true })
  }
}

async function removeEmptyParents(start: string, cfDir: string): Promise<void> {
  const root = resolve(cfDir)
  let current = resolve(start)
  while (current !== root) {
    try {
      await rmdir(current)
    } catch (caught) {
      if (isNodeError(caught) && (caught.code === "ENOTEMPTY" || caught.code === "ENOENT")) return
      throw caught
    }
    current = dirname(current)
  }
}

function assertUniquePaths(operation: ScenarioOperation): void {
  const paths = operation.changes.map(({ path }) => path)
  if (new Set(paths).size !== paths.length) {
    throw new Error(`Операция ${operation.key} содержит повторяющийся путь`)
  }
}

function asBuffer(contents: ScenarioFileContents): Buffer {
  return typeof contents === "string" ? Buffer.from(contents) : Buffer.from(contents)
}

async function pathKind(path: string): Promise<"missing" | "directory" | "file" | "symlink" | "other"> {
  try {
    const stats = await lstat(path)
    if (stats.isSymbolicLink()) return "symlink"
    if (stats.isDirectory()) return "directory"
    if (stats.isFile()) return "file"
    return "other"
  } catch (caught) {
    if (isNodeError(caught) && caught.code === "ENOENT") return "missing"
    throw caught
  }
}

function isNodeError(value: unknown): value is NodeJS.ErrnoException {
  return value instanceof Error && "code" in value
}
