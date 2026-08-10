import type { SerializedYAMLDocument } from "@nkdk/runtime"
import { parsedYamlFromKnownData } from "@nkdk/runtime"
import type { ConfigurationContext } from "@nkdk/runtime"
import type { ValidationProjectFile } from "../validation/projectFiles"
import { createProjectYamlCacheFromEntries } from "../validation/projectYamlCache"
import {
  validateProjectFileFirstPass,
  type ProjectValidationFirstPassResult,
  type ValidationSchemaCache,
} from "../validation/projectValidationPasses"
import type { ValidationRulesSnapshot } from "../validation/rulesSnapshot"

export function validateSerializedProjectYaml(params: {
  readonly projectDir: string
  readonly file: ValidationProjectFile
  readonly document: SerializedYAMLDocument
  readonly context: ConfigurationContext
  readonly schemaCache: ValidationSchemaCache
  readonly rulesSnapshot: ValidationRulesSnapshot
}): ProjectValidationFirstPassResult {
  const entry = {
    filePath: params.file.absolutePath,
    text: params.document.text,
    parsed: parsedYamlFromKnownData(params.document.text, params.document.data),
  }
  return validateProjectFileFirstPass({
    projectDir: params.projectDir,
    file: params.file,
    cache: createProjectYamlCacheFromEntries([entry]),
    context: params.context,
    schemaCache: params.schemaCache,
    rulesSnapshot: params.rulesSnapshot,
  })
}
