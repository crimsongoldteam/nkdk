import { parsedYamlFromKnownData } from "../../yaml/parseMetadataYaml"
import type { ConfigurationContext } from "../context/types"
import type { ValidationProjectFile } from "./projectFiles"
import { createProjectYamlCacheFromEntries } from "./projectYamlCache"
import {
  validateProjectFileFirstPass,
  type ProjectValidationFirstPassResult,
  type ValidationSchemaCache,
} from "./projectValidationPasses"
import type { ValidationRulesSnapshot } from "./rulesSnapshot"

export function validateKnownProjectYaml(params: {
  readonly projectDir: string
  readonly file: ValidationProjectFile
  readonly text: string
  readonly yaml: unknown
  readonly context: ConfigurationContext
  readonly schemaCache: ValidationSchemaCache
  readonly rulesSnapshot: ValidationRulesSnapshot
}): ProjectValidationFirstPassResult {
  const entry = {
    filePath: params.file.absolutePath,
    text: params.text,
    parsed: parsedYamlFromKnownData(params.text, params.yaml),
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
