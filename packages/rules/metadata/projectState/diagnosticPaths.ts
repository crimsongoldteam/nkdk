import type { Diagnostic } from "@nkdk/runtime"
import { parseProjectPath } from "../projectDefinition/path"

export function assertProjectDiagnosticPaths<T extends readonly Diagnostic[]>(
  diagnostics: T,
  boundary: string,
): T {
  for (const diagnostic of diagnostics) {
    try {
      if (parseProjectPath(diagnostic.filePath) !== diagnostic.filePath) throw new Error("not normalized")
    } catch {
      throw new Error(
        `${boundary} вернул недопустимый путь диагностики ${JSON.stringify(diagnostic.filePath)}`,
      )
    }
  }
  return diagnostics
}
