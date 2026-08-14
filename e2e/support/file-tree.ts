import { spawnSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, extname, join, relative, resolve, sep } from "node:path"
import { importContentFromXML } from "@nkdk/runtime"

export interface FileTreeComparison {
  readonly equal: boolean
  readonly added: readonly string[]
  readonly removed: readonly string[]
  readonly changed: readonly string[]
  readonly reportDir?: string
}

interface FileTreeDifference {
  readonly expectedDir: string
  readonly actualDir: string
  readonly reportDir: string
  readonly added: readonly string[]
  readonly removed: readonly string[]
  readonly changed: readonly string[]
}

export async function compareFileTrees(params: {
  readonly expectedDir: string
  readonly actualDir: string
  readonly reportDir: string
  readonly xmlComparison?: "bytes" | "semantic"
  readonly yamlComparison?: "bytes" | "ignore-final-line-ending"
  readonly textComparison?: "bytes" | "ignore-utf8-bom"
  readonly ignoredPaths?: readonly string[]
}): Promise<FileTreeComparison> {
  const ignoredPaths = new Set(params.ignoredPaths ?? [])
  const expected = await fileMap(params.expectedDir, ignoredPaths)
  const actual = await fileMap(params.actualDir, ignoredPaths)
  const added = [...actual.keys()].filter((path) => !expected.has(path)).sort()
  const removed = [...expected.keys()].filter((path) => !actual.has(path)).sort()
  const shared = [...expected.keys()].filter((path) => actual.has(path)).sort()
  const changed: string[] = []
  for (const path of shared) {
    const expectedContent = expected.get(path)!
    const actualContent = actual.get(path)!
    if (expectedContent.equals(actualContent)) continue
    if (
      params.xmlComparison === "semantic" &&
      extname(path).toLowerCase() === ".xml" &&
      semanticXML(expectedContent) === semanticXML(actualContent)
    ) continue
    if (
      params.yamlComparison === "ignore-final-line-ending" &&
      [".yaml", ".yml"].includes(extname(path).toLowerCase()) &&
      withoutFinalLineEnding(expectedContent).equals(withoutFinalLineEnding(actualContent))
    ) continue
    if (
      params.textComparison === "ignore-utf8-bom" &&
      isTextPath(path) &&
      withoutUtf8Bom(expectedContent).equals(withoutUtf8Bom(actualContent))
    ) continue
    changed.push(path)
  }
  if (added.length === 0 && removed.length === 0 && changed.length === 0) {
    return { equal: true, added, removed, changed }
  }
  await writeReport({ ...params, added, removed, changed })
  return { equal: false, added, removed, changed, reportDir: params.reportDir }
}

function withoutFinalLineEnding(content: Buffer): Buffer {
  const end = content.length
  if (end > 0 && content[end - 1] === 0x0a) {
    return content.subarray(0, end > 1 && content[end - 2] === 0x0d ? end - 2 : end - 1)
  }
  return content
}

function withoutUtf8Bom(content: Buffer): Buffer {
  return content.length >= 3 && content[0] === 0xef && content[1] === 0xbb && content[2] === 0xbf
    ? content.subarray(3)
    : content
}

function isTextPath(path: string): boolean {
  return new Set([".bsl", ".css", ".html", ".js", ".json", ".os", ".txt", ".xml", ".yaml", ".yml"])
    .has(extname(path).toLowerCase())
}

async function fileMap(root: string, ignoredPaths: ReadonlySet<string>): Promise<Map<string, Buffer>> {
  const files = new Map<string, Buffer>()
  await collectFiles(resolve(root), resolve(root), files, ignoredPaths)
  return files
}

async function collectFiles(
  root: string,
  directory: string,
  files: Map<string, Buffer>,
  ignoredPaths: ReadonlySet<string>,
): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true })
  entries.sort((left, right) => left.name.localeCompare(right.name, "ru"))
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      await collectFiles(root, path, files, ignoredPaths)
    } else if (entry.isFile()) {
      const projectPath = toPortablePath(relative(root, path))
      if (!ignoredPaths.has(projectPath)) files.set(projectPath, await readFile(path))
    }
  }
}

async function writeReport(difference: FileTreeDifference): Promise<void> {
  await rm(difference.reportDir, { recursive: true, force: true })
  await mkdir(difference.reportDir, { recursive: true })
  await writeFile(join(difference.reportDir, "summary.txt"), summary(difference))
  for (const path of difference.changed) {
    await writeFileDiffs(difference, path)
  }
}

function summary(difference: FileTreeDifference): string {
  return [
    `Добавлены: ${difference.added.length}`,
    `Удалены: ${difference.removed.length}`,
    `Изменены: ${difference.changed.length}`,
    "",
    "[added]",
    ...difference.added,
    "[removed]",
    ...difference.removed,
    "[changed]",
    ...difference.changed,
    "",
  ].join("\n")
}

async function writeFileDiffs(difference: FileTreeDifference, path: string): Promise<void> {
  const expectedPath = resolve(difference.expectedDir, path)
  const actualPath = resolve(difference.actualDir, path)
  const diffPath = resolve(difference.reportDir, `${path}.diff`)
  const normalizedDiffPath = resolve(difference.reportDir, `${path}.normalized.diff`)
  await mkdir(dirname(diffPath), { recursive: true })
  await writeFile(diffPath, await isBinaryFile(path, expectedPath, actualPath)
    ? "Текстовый diff недоступен для двоичного файла.\n"
    : gitDiff(expectedPath, actualPath))
  await writeFile(normalizedDiffPath, await normalizedDiff(expectedPath, actualPath))
}

async function isBinaryFile(path: string, expectedPath: string, actualPath: string): Promise<boolean> {
  const binaryExtension = new Set([".bin", ".zip", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".pdf"])
    .has(extname(path).toLowerCase())
  if (binaryExtension) return true
  const [expected, actual] = await Promise.all([readFile(expectedPath), readFile(actualPath)])
  return expected.includes(0) || actual.includes(0)
}

function gitDiff(expectedPath: string, actualPath: string): string {
  const result = spawnSync("git", [
    "diff",
    "--no-index",
    "--no-ext-diff",
    "--text",
    "--",
    expectedPath,
    actualPath,
  ], { encoding: "utf8" })
  if (result.error !== undefined) throw result.error
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(result.stderr || `git diff завершился с кодом ${result.status}`)
  }
  return result.stdout
}

async function normalizedDiff(expectedPath: string, actualPath: string): Promise<string> {
  if (extname(expectedPath).toLowerCase() !== ".xml") {
    return "Нормализация доступна только для XML.\n"
  }
  try {
    const expected = stableJson(importContentFromXML<unknown>(await readFile(expectedPath, "utf8")))
    const actual = stableJson(importContentFromXML<unknown>(await readFile(actualPath, "utf8")))
    if (expected === actual) {
      return "Смысловое XML-содержимое совпадает; различаются только исходные байты.\n"
    }
    const temporaryRoot = await mkdtemp(join(tmpdir(), "nkdk-normalized-diff-"))
    const expectedNormalizedPath = join(temporaryRoot, "expected.json")
    const actualNormalizedPath = join(temporaryRoot, "actual.json")
    try {
      await Promise.all([
        writeFile(expectedNormalizedPath, expected),
        writeFile(actualNormalizedPath, actual),
      ])
      return gitDiff(expectedNormalizedPath, actualNormalizedPath)
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true })
    }
  } catch (error) {
    return `Не удалось нормализовать XML: ${error instanceof Error ? error.message : String(error)}\n`
  }
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(sortValue(value), undefined, 2)}\n`
}

function semanticXML(content: Buffer): string {
  return stableJson(importContentFromXML<unknown>(content.toString("utf8")))
}

function sortValue(value: unknown, parentKey?: string): unknown {
  if (Array.isArray(value)) {
    const values = value.map((child) => sortValue(child, parentKey))
    return parentKey === "xr:PropertyState"
      ? values.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right), "en"))
      : values
  }
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, child]) => !(key === "#text" && typeof child === "string" && child.trim() === ""))
      .sort(([left], [right]) => left.localeCompare(right, "en"))
      .map(([key, child]) => [key, sortValue(child, key)])
  )
}

function toPortablePath(path: string): string {
  return sep === "/" ? path : path.split(sep).join("/")
}
