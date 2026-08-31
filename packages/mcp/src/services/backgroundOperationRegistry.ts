import type { BackgroundOperationRunners } from "./backgroundOperationManager"
import type { BackgroundOperationKind, BackgroundOperationResult } from "../contracts/backgroundOperations"
import { importFromInfobase } from "./importFromInfobase"
import { importFromXml } from "./importFromXml"
import { rebuildProjectCache } from "./projectCache"
import { syncToInfobase } from "./syncToInfobase"
import { syncToXml } from "./syncToXml"
import { validateYamlProject } from "./validateProject"

export interface BackgroundOperationServices {
  readonly importFromInfobase: typeof importFromInfobase
  readonly importFromXml: typeof importFromXml
  readonly syncToInfobase: typeof syncToInfobase
  readonly syncToXml: typeof syncToXml
  readonly rebuildProjectCache: typeof rebuildProjectCache
  readonly validateProject: typeof validateYamlProject
}

const defaultServices: BackgroundOperationServices = {
  importFromInfobase,
  importFromXml,
  syncToInfobase,
  syncToXml,
  rebuildProjectCache,
  validateProject: validateYamlProject,
}

export function createBackgroundOperationRegistry(
  services: BackgroundOperationServices = defaultServices,
): BackgroundOperationRunners {
  return {
    import_from_infobase: {
      async run(input, context) {
        await context.report({ stage: "import-from-infobase" })
        return operationResult("import_from_infobase", await services.importFromInfobase(input, undefined, context.signal))
      },
    },
    import_from_xml: {
      async run(input, context) {
        await context.report({ stage: "import-from-xml" })
        return operationResult("import_from_xml", await services.importFromXml(input, undefined, context.signal))
      },
    },
    sync_to_infobase: {
      async run(input, context) {
        await context.report({ stage: "sync-to-infobase" })
        return operationResult("sync_to_infobase", await services.syncToInfobase(input, undefined, context.signal))
      },
    },
    sync_to_xml: {
      async run(input, context) {
        await context.report({ stage: "sync-to-xml" })
        return operationResult("sync_to_xml", await services.syncToXml(input, undefined, context.signal))
      },
    },
    rebuild_project_cache: {
      async run(input, context) {
        await context.report({ stage: "rebuild-project-cache" })
        return operationResult(
          "rebuild_project_cache",
          await services.rebuildProjectCache(input, undefined, context.signal),
        )
      },
    },
    validate_project: {
      async run(input, context) {
        await context.report({ stage: "validate-project" })
        return operationResult("validate_project", await services.validateProject(input, undefined, context.signal))
      },
    },
  }
}

function operationResult<K extends BackgroundOperationKind>(
  _kind: K,
  value: unknown,
): BackgroundOperationResult<K> {
  return value as BackgroundOperationResult<K>
}
