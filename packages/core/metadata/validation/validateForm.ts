import { existsSync } from "fs"
import { join } from "path"
import { Diagnostic } from "./types"

export interface ValidateFormParams {
  formDir: string
  formName: string
}

export function validateForm({ formDir, formName: _formName }: ValidateFormParams): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const yamlPath = join(formDir, "Форма.yaml")
  const nkdkPath = join(formDir, "Форма.nkdk")

  const yamlExists = existsSync(yamlPath)
  const nkdkExists = existsSync(nkdkPath)

  if (nkdkExists && !yamlExists) {
    diagnostics.push({
      filePath: nkdkPath,
      line: 1,
      col: 1,
      message: `Устаревший файл структуры формы: Форма.nkdk`,
      severity: "error",
      source: "external-file",
    })
  }

  return diagnostics
}
