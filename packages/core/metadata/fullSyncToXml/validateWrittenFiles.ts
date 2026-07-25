import { posix } from "node:path"
import type {
  FullXmlSyncCopiedFile,
  FullXmlSyncDiagnostic,
  FullXmlSyncExpectedOutput,
  FullXmlSyncWrittenFile,
} from "./types"

export function validateFullXmlSyncWrittenFiles(params: {
  readonly expectedOutputs: readonly FullXmlSyncExpectedOutput[]
  readonly writtenFiles: readonly FullXmlSyncWrittenFile[]
  readonly copiedFiles: readonly (FullXmlSyncCopiedFile & { readonly assignmentId: string })[]
}): FullXmlSyncDiagnostic[] {
  const diagnostics: FullXmlSyncDiagnostic[] = []
  const knownAssignments = new Set(params.expectedOutputs.map((output) => output.assignmentId))
  const actual = [
    ...params.writtenFiles.map((file) => ({ ...file, sourceProjectPath: undefined })),
    ...params.copiedFiles,
  ]
  const ownerByTarget = new Map<string, string>()
  const actualKeys = new Set<string>()

  for (const output of actual) {
    if (!knownAssignments.has(output.assignmentId)) {
      diagnostics.push({
        severity: "error",
        code: "full_xml_sync_output_unknown_assignment",
        message: `Получен XML-файл неизвестного задания: ${output.assignmentId}`,
        assignmentId: output.assignmentId,
        targetXmlPath: output.targetXmlPath,
      })
      continue
    }
    if (!isSafeRelativeXmlPath(output.targetXmlPath)) {
      diagnostics.push({
        severity: "error",
        code: "full_xml_sync_output_invalid_path",
        message: `Получен недопустимый XML-путь: ${output.targetXmlPath}`,
        assignmentId: output.assignmentId,
        targetXmlPath: output.targetXmlPath,
      })
      continue
    }
    const previous = ownerByTarget.get(output.targetXmlPath)
    if (previous !== undefined && previous !== output.assignmentId) {
      diagnostics.push({
        severity: "error",
        code: "full_xml_sync_output_conflict",
        message: `Повторный XML-путь ${output.targetXmlPath}: ${previous} и ${output.assignmentId}`,
        assignmentId: output.assignmentId,
        targetXmlPath: output.targetXmlPath,
      })
      continue
    }
    ownerByTarget.set(output.targetXmlPath, output.assignmentId)
    actualKeys.add(outputKey(output))
  }

  for (const expected of params.expectedOutputs) {
    if (actualKeys.has(outputKey(expected))) continue
    diagnostics.push({
      severity: "error",
      code: "full_xml_sync_output_missing",
      message: `Не записан объявленный XML-файл: ${expected.targetXmlPath}`,
      assignmentId: expected.assignmentId,
      targetXmlPath: expected.targetXmlPath,
    })
  }
  return diagnostics
}

function outputKey(output: { assignmentId: string; targetXmlPath: string }): string {
  return `${output.assignmentId}\0${output.targetXmlPath}`
}

function isSafeRelativeXmlPath(path: string): boolean {
  if (path.length === 0 || path.includes("\0") || posix.isAbsolute(path)) return false
  const normalized = posix.normalize(path)
  return normalized === path && normalized !== ".." && !normalized.startsWith("../")
}
