import { posix } from "node:path"
import type {
  FullXmlSyncDiagnostic,
  FullXmlSyncPlan,
  FullXmlSyncWrittenFile,
} from "./types"

export function validateFullXmlSyncWrittenFiles(params: {
  readonly plan: FullXmlSyncPlan
  readonly writtenFiles: readonly FullXmlSyncWrittenFile[]
}): FullXmlSyncDiagnostic[] {
  const diagnostics: FullXmlSyncDiagnostic[] = []
  const assignmentById = new Map(params.plan.assignments.map((assignment) => [assignment.id, assignment]))
  const writtenByAssignment = new Map<string, Set<string>>()
  const ownerByTarget = new Map(
    params.plan.externalFiles.map((file) => [file.targetXmlPath, file.sourceProjectPath] as const)
  )
  ownerByTarget.set("ConfigDumpInfo.xml", "ConfigDumpInfo.xml")

  for (const written of params.writtenFiles) {
    const assignment = assignmentById.get(written.assignmentId)
    if (assignment === undefined) {
      diagnostics.push({
        severity: "error",
        code: "full_xml_sync_output_unknown_assignment",
        message: `Worker сообщил XML-файл неизвестного задания: ${written.assignmentId}`,
        assignmentId: written.assignmentId,
        targetXmlPath: written.targetXmlPath,
      })
      continue
    }

    if (!isSafeRelativeXmlPath(written.targetXmlPath)) {
      diagnostics.push(outputDiagnostic(
        assignment,
        written.targetXmlPath,
        "full_xml_sync_output_invalid_path",
        `Worker сообщил недопустимый XML-путь: ${written.targetXmlPath}`
      ))
      continue
    }

    const previousOwner = ownerByTarget.get(written.targetXmlPath)
    if (previousOwner !== undefined) {
      diagnostics.push(outputDiagnostic(
        assignment,
        written.targetXmlPath,
        "full_xml_sync_output_conflict",
        `Повторный XML-путь ${written.targetXmlPath}: ${previousOwner} и ${assignment.sourceProjectPath}`
      ))
      continue
    }
    ownerByTarget.set(written.targetXmlPath, assignment.sourceProjectPath)

    const paths = writtenByAssignment.get(assignment.id) ?? new Set<string>()
    paths.add(written.targetXmlPath)
    writtenByAssignment.set(assignment.id, paths)
  }

  for (const assignment of params.plan.assignments) {
    const writtenPaths = writtenByAssignment.get(assignment.id)
    for (const output of assignment.outputs) {
      if (writtenPaths?.has(output.targetXmlPath) === true) continue
      diagnostics.push(outputDiagnostic(
        assignment,
        output.targetXmlPath,
        "full_xml_sync_output_missing",
        `Worker не записал объявленный XML-файл: ${output.targetXmlPath}`
      ))
    }
  }

  return diagnostics
}

function isSafeRelativeXmlPath(path: string): boolean {
  if (path.length === 0 || path.includes("\0") || posix.isAbsolute(path)) return false
  const normalized = posix.normalize(path)
  return normalized === path && normalized !== ".." && !normalized.startsWith("../")
}

function outputDiagnostic(
  assignment: FullXmlSyncPlan["assignments"][number],
  targetXmlPath: string,
  code: string,
  message: string
): FullXmlSyncDiagnostic {
  return {
    severity: "error",
    code,
    message,
    assignmentId: assignment.id,
    sourceProjectPath: assignment.sourceProjectPath,
    sourcePath: assignment.sourcePath,
    targetXmlPath,
  }
}
