import type { MetadataWorkerManifest } from "@nkdk/runtime"
import { join } from "node:path"
import {
  withPropertyRuleRegistrySet,
  withRuleRegistrySet,
} from "@nkdk/runtime/rule-kit"
import { loadConfigurationLanguagesFromYAML } from "../appliedObjects/configuration/languageRegistry"
import { withConfigurationValidationContextVersions } from "../context/validationContextVersions"
import { metadataRules } from "./metadataRules"
import { createMetadataRuntime } from "../runtime/createMetadataRuntime"
import { createDefaultProjectStateService } from "./projectState"
import type { ProjectStateService } from "../projectState/service"

export { createValidationProfileResult } from "../validation/profile"

export interface ValidationProfileDependencies {
  readonly loadLanguages: typeof loadConfigurationLanguagesFromYAML
}

const defaultDependencies: ValidationProfileDependencies = {
  loadLanguages: loadConfigurationLanguagesFromYAML,
}

export function createValidationProfileRuntime(
  dependencies: ValidationProfileDependencies = defaultDependencies,
) {
  const runtime = createMetadataRuntime({
    rules: metadataRules,
    workers: createCompiledWorkerManifest(),
    createProjectStateService: (options, rules) =>
      createDefaultProjectStateService(options, rules),
  })
  const rules = runtime.metadata.rules
  return Object.assign(runtime, {
    async refreshAndValidate(
      service: ProjectStateService,
      params: Parameters<ProjectStateService["refreshAndValidate"]>[0],
    ) {
      const languages = await dependencies.loadLanguages(join(params.projectDir, "cf"))
      const refreshParams = withConfigurationValidationContextVersions({
        ...params,
        context: { ...(params.context ?? { version: "2.20" }), languages },
      })
      return withRuleRegistrySet(rules, () =>
        withPropertyRuleRegistrySet(rules.property, () =>
          service.refreshAndValidate(refreshParams)))
    },
  })
}

function createCompiledWorkerManifest(): MetadataWorkerManifest {
  return {
    preparedYamlProject: new URL("./preparedYamlProjectWorker.js", import.meta.url),
    importFromXml: new URL("./importFromXmlWorker.js", import.meta.url),
    fullSyncToXml: new URL("./fullSyncToXmlWorker.js", import.meta.url),
    generic: new URL("./worker.js", import.meta.url),
  }
}
