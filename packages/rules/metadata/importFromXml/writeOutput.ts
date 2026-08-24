import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join, posix } from "node:path"
import {
  createXmlAnomalyAnnotations,
  serializeYAMLDocument,
  type SerializedYAMLDocument,
  type XmlAnomalyAnnotations,
} from "@nkdk/runtime"
import { hashFileBytes } from "@nkdk/runtime"
import type { ExternalFileEntry } from "@nkdk/runtime"
import type { ValidationProfiler } from "../validation/profile"
import type { ImportAssignment, ImportResultFile } from "./types"

export interface PreparedImportYamlOutput {
  readonly output: ImportResultFile
  readonly yaml: unknown
  readonly annotations?: XmlAnomalyAnnotations
}

export interface SerializedImportYaml extends SerializedYAMLDocument {
  readonly file: ImportResultFile
  readonly bytes: Uint8Array<ArrayBuffer>
  readonly localHash: bigint
}

const textEncoder = new TextEncoder()

export function serializeImportYaml(file: PreparedImportYamlOutput): SerializedImportYaml {
  const document = file.yaml === undefined
    ? { text: "", data: undefined, annotations: createXmlAnomalyAnnotations() }
    : serializeYAMLDocument(file.yaml, file.annotations)
  const bytes = textEncoder.encode(document.text)
  return { file: file.output, ...document, bytes, localHash: hashFileBytes(bytes) }
}

export async function writeMainImportYaml(params: ({
  serialized: SerializedImportYaml
  profiler: ValidationProfiler
} | {
  outputDir: string
  targetProjectPath: string
  yaml: unknown
  profiler: ValidationProfiler
})): Promise<{ file: ImportResultFile; bytes: number; localHash: bigint }> {
  const serialized = "serialized" in params ? params.serialized : params.profiler.measure(
    "Подготовка импорта конфигурации",
    "Сериализация YAML",
    { items: 1 },
    () => {
      const sourcePath = join(params.outputDir, params.targetProjectPath)
      return serializeImportYaml({
        output: { sourceKind: "worker", sourcePath, targetProjectPath: params.targetProjectPath },
        yaml: params.yaml,
      })
    }
  )
  const sourcePath = serialized.file.sourcePath
  await params.profiler.measureAsync(
    "Подготовка импорта конфигурации",
    "Запись основного YAML-файла",
    { items: 1 },
    async () => {
      await mkdir(dirname(sourcePath), { recursive: true })
      await writeFile(sourcePath, serialized.bytes)
    }
  )
  return {
    file: serialized.file,
    bytes: serialized.bytes.byteLength,
    localHash: serialized.localHash,
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
