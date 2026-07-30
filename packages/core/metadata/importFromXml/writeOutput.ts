import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join, posix } from "node:path"
import { exportToYAML } from "../../yaml/export"
import type { ExternalFileEntry } from "../context/types"
import type { ValidationProfiler } from "../validation/profile"
import type { ImportAssignment, ImportResultFile } from "./types"

export async function writeMainImportYaml(params: {
  outputDir: string
  targetProjectPath: string
  yaml: unknown
  profiler: ValidationProfiler
}): Promise<{ file: ImportResultFile; bytes: number }> {
  const exported = params.profiler.measure(
    "Подготовка импорта конфигурации",
    "Сериализация YAML",
    { items: 1 },
    () => (params.yaml === undefined ? "" : exportToYAML(params.yaml))
  )
  const sourcePath = join(params.outputDir, params.targetProjectPath)
  await params.profiler.measureAsync(
    "Подготовка импорта конфигурации",
    "Запись основного YAML-файла",
    { items: 1 },
    async () => {
      await mkdir(dirname(sourcePath), { recursive: true })
      await writeFile(sourcePath, exported, "utf-8")
    }
  )
  return {
    file: {
      sourceKind: "worker",
      sourcePath,
      targetProjectPath: params.targetProjectPath,
    },
    bytes: Buffer.byteLength(exported, "utf-8"),
  }
}

export async function writeGeneratedImportFiles(params: {
  outputDir: string
  targetProjectPath: string
  generatedFiles: readonly ExternalFileEntry[]
  profiler: ValidationProfiler
}): Promise<ImportResultFile[]> {
  const files: ImportResultFile[] = []
  for (const generatedFile of params.generatedFiles) {
    const targetProjectPath = posix.join(posix.dirname(params.targetProjectPath), generatedFile.relativePath)
    const sourcePath = join(params.outputDir, targetProjectPath)
    await params.profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Запись связанного файла",
      { items: 1, bytes: Buffer.byteLength(generatedFile.content, "utf-8") },
      async () => {
        await mkdir(dirname(sourcePath), { recursive: true })
        await writeFile(sourcePath, generatedFile.content, "utf-8")
      }
    )
    files.push({ sourceKind: "worker", sourcePath, targetProjectPath })
  }
  return files
}

export function xmlExternalImportFiles(assignment: ImportAssignment): ImportResultFile[] {
  return assignment.externalFiles.map((file) => ({
    sourceKind: "xml",
    sourcePath: file.sourcePath,
    targetProjectPath: file.targetProjectPath,
  }))
}
