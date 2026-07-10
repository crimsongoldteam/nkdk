import type { ValidationSchemaValidator } from "./compileValidationSchema"
import type { TSchema } from "typebox"
import { existsSync, readdirSync, readFileSync } from "fs"
import { basename, dirname, join, resolve } from "path"
import { Diagnostic } from "./types"
import { validateFile } from "./validateFile"
import { validateForm } from "./validateForm"
import { createProjectYamlCache } from "./projectYamlCache"
import { createOwnerMetadataCache } from "./dataPath/ownerCache"

export interface ValidateItemParams {
  itemDir: string
  schema: ValidationSchemaValidator<TSchema>
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
    const resolvedItemDir = resolve(itemDir)
    const owner = { dir: basename(dirname(resolvedItemDir)), name: basename(resolvedItemDir) }
    const projectDir = dirname(dirname(resolvedItemDir))
    const cache = createProjectYamlCache()
    const context = {
      version: "2.20",
      defaultLanguage: "ru",
      exportToYAML: { toTyped: false },
    }
    const ownerCache = createOwnerMetadataCache({ projectDir, yamlCache: cache, context })
    const entries = readdirSync(formsDir, { withFileTypes: true })
    for (const entry of entries.filter((e) => e.isDirectory())) {
      const formDir = join(formsDir, entry.name)
      diagnostics.push(
        ...validateForm({ projectDir, formDir, formName: entry.name, owner, cache, context, ownerCache })
      )
    }
  }

  return diagnostics
}
