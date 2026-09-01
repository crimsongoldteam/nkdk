import type { SerializedYAMLDocument } from "@nkdk/runtime"
import { parseMetadataYaml } from "@nkdk/runtime"
import type { ConfigurationContext, ConfigurationContextFromXML } from "@nkdk/runtime"
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
    parsed: parseMetadataYaml(params.document.text),
  }
  return validateProjectFileFirstPass({
    projectDir: params.projectDir,
    file: params.file,
    cache: createProjectYamlCacheFromEntries([entry]),
    context: params.context,
    schemaCache: params.schemaCache,
    rulesSnapshot: params.rulesSnapshot,
    propertyStateCompatibilityMode: propertyStateCompatibilityMode(params.context),
  })
}

function propertyStateCompatibilityMode(context: ConfigurationContext): string | undefined {
  if (!hasFromXMLContext(context)) return undefined
  return context.fromXML.propertyStateCompatibilityMode
}

function hasFromXMLContext(context: ConfigurationContext): context is ConfigurationContextFromXML {
  return "fromXML" in context && typeof context.fromXML === "object" && context.fromXML !== null
}
