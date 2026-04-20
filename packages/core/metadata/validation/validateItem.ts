import { TSchema } from "@sinclair/typebox"
import { TypeCheck } from "@sinclair/typebox/compiler"
import { existsSync, readdirSync, readFileSync } from "fs"
import { join } from "path"
import { Diagnostic } from "./types"
import { validateFile } from "./validateFile"
import { validateForm } from "./validateForm"

export interface ValidateItemParams {
  itemDir: string
  schema: TypeCheck<TSchema>
}

export function validateItem({ itemDir, schema }: ValidateItemParams): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  // Валидация основного файла свойств
  const propertiesPath = join(itemDir, "Свойства.yaml")
  if (existsSync(propertiesPath)) {
    const text = readFileSync(propertiesPath, "utf-8")
    diagnostics.push(...validateFile({ filePath: propertiesPath, text, schema }))
  }

  // Валидация форм
  const formsDir = join(itemDir, "Формы")
  if (existsSync(formsDir)) {
    const entries = readdirSync(formsDir, { withFileTypes: true })
    for (const entry of entries.filter((e) => e.isDirectory())) {
      const formDir = join(formsDir, entry.name)
      diagnostics.push(...validateForm({ formDir, formName: entry.name }))
    }
  }

  return diagnostics
}
