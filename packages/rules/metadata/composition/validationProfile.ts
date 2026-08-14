import type { MetadataWorkerManifest } from "@nkdk/runtime"
import {
  withPropertyRuleRegistrySet,
  withRuleRegistrySet,
} from "@nkdk/runtime/rule-kit"
import { metadataRules } from "./metadataRules"
import { createMetadataRuntime } from "../runtime/createMetadataRuntime"
import { createDefaultProjectStateService } from "./projectState"
import type { ProjectStateService } from "../projectState/service"

export { createValidationProfileResult } from "../validation/profile"

export function createValidationProfileRuntime() {
  const runtime = createMetadataRuntime({
    rules: metadataRules,
    workers: createCompiledWorkerManifest(),
    createProjectStateService: (options, rules) =>
      createDefaultProjectStateService(options, rules),
  })
  const rules = runtime.metadata.rules
  return Object.assign(runtime, {
    refreshAndValidate(
      service: ProjectStateService,
      params: Parameters<ProjectStateService["refreshAndValidate"]>[0],
    ) {
      return withRuleRegistrySet(rules, () =>
        withPropertyRuleRegistrySet(rules.property, () =>
          service.refreshAndValidate(params)))
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
