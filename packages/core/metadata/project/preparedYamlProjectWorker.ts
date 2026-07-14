import { readFileSync } from "node:fs"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import type { Diagnostic } from "../validation/types"
import type { PreparedYamlFile, PreparedYamlProjectFileDescriptor } from "./preparedYamlProject"

export type PreparedYamlProjectWorkerTask = {
  kind: "prepare"
  files: PreparedYamlProjectFileDescriptor[]
}

export type PreparedYamlProjectWorkerTaskResult = {
  kind: "prepareResult"
  yamlFiles: PreparedYamlFile[]
  diagnostics: Diagnostic[]
}

export default async function runPreparedYamlProjectWorkerTask(
  message: PreparedYamlProjectWorkerTask
): Promise<PreparedYamlProjectWorkerTaskResult> {
  const yamlFiles: PreparedYamlFile[] = []
  const diagnostics: Diagnostic[] = []

  for (const file of message.files) {
    try {
      const text = readFileSync(file.filePath, "utf8")
      const parsed = parseMetadataYaml(text)
      yamlFiles.push({
        projectPath: file.projectPath,
        filePath: file.filePath,
        role: file.role,
        owner: file.owner,
        data: parsed.data,
        syntaxDiagnostics: parsed.syntaxErrors.map((error) => ({
          filePath: file.filePath,
          line: error.line,
          col: error.col,
          severity: "error",
          source: "syntax",
          message: error.message,
        })),
      })
    } catch (caught) {
      diagnostics.push({
        filePath: file.filePath,
        line: 1,
        col: 1,
        severity: "error",
        source: "external-file",
        message: `Не удалось прочитать YAML-файл: ${caught instanceof Error ? caught.message : String(caught)}`,
      })
    }
  }

  return { kind: "prepareResult", yamlFiles, diagnostics }
}
