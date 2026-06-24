import { existsSync, statSync } from "fs"
import { isAbsolute, relative, resolve, sep } from "path"
import { ProjectFileSchemaError, validateProject, type Diagnostic } from "@nakidka/core"

export interface ValidateCommandOptions {
  file?: string
}

export async function validateYamlProject(yamlDir: string, options: ValidateCommandOptions = {}): Promise<void> {
  const projectDir = resolve(yamlDir)
  if (!yamlDir) {
    writeUsageError("Не указан путь к YAML-проекту")
    return
  }

  if (!existsSync(projectDir)) {
    writeUsageError(`YAML-проект не найден: ${yamlDir}`)
    return
  }

  if (!statSync(projectDir).isDirectory()) {
    writeUsageError(`Путь не является каталогом YAML-проекта: ${yamlDir}`)
    return
  }

  let diagnostics: Diagnostic[]
  try {
    diagnostics = validateProject({
      projectDir,
      ...(options.file !== undefined ? { filePath: options.file } : {}),
    }).diagnostics
  } catch (caught) {
    if (isCommandUsageError(caught)) {
      writeUsageError(caught.message)
      return
    }
    throw caught
  }

  const visibleDiagnostics = diagnostics.filter(isVisibleDiagnostic)
  const diagnosticsText = formatDiagnostics(visibleDiagnostics, projectDir)
  if (diagnosticsText.length > 0) {
    process.stdout.write(`${diagnosticsText}\n`)
  }

  const errorCount = visibleDiagnostics.filter((diagnostic) => diagnostic.severity === "error").length
  const warningCount = visibleDiagnostics.filter((diagnostic) => diagnostic.severity === "warning").length
  process.stdout.write(`summary: ${errorCount} error, ${warningCount} warning\n`)

  if (errorCount > 0) process.exitCode = 1
}

export function formatDiagnostics(diagnostics: Diagnostic[], projectDir: string): string {
  return diagnostics
    .map((diagnostic) => {
      const filePath = toProjectRelativePath(projectDir, diagnostic.filePath)
      return `${filePath}:${diagnostic.line}:${diagnostic.col} ${diagnostic.severity}: ${diagnostic.message}`
    })
    .join("\n")
}

function writeUsageError(message: string): void {
  process.stderr.write(`${message}\n`)
  process.exitCode = 2
}

function isCommandUsageError(caught: unknown): caught is Error {
  return (
    caught instanceof ProjectFileSchemaError ||
    (caught instanceof Error && caught.message === "Файл находится вне указанного YAML-проекта")
  )
}

function isVisibleDiagnostic(diagnostic: Diagnostic): boolean {
  return diagnostic.severity !== "warning"
}

function toProjectRelativePath(projectDir: string, filePath: string): string {
  const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(projectDir, filePath)
  const relativePath = relative(resolve(projectDir), absolutePath)
  return relativePath.split(sep).join("/")
}
