import type { FullXmlSyncComponentProfile } from "../fullSyncToXml/componentProfile"
import type { OperationRegistrySet } from "../operations/operationRegistrySet"
import type { ValidateProjectParams, ValidateProjectResult } from "../project/validateProject"
import type { ProjectStateService } from "../projectState/service"
import type { MetadataRulesDefinition } from "../ruleRuntime/definition"
import type { RuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import type { ValidationRegistrySet } from "../validation/validationRegistrySet"

export interface MetadataWorkerManifest {
  readonly preparedYamlProject: URL
  readonly importFromXml: URL
  readonly fullSyncToXml: URL
  readonly generic: URL
}

export interface CreateMetadataRuntimeOptions {
  readonly rules: MetadataRulesDefinition<FullXmlSyncComponentProfile>
  readonly workers: MetadataWorkerManifest
}

export interface MetadataRuntime {
  readonly projects: {
    createState(): ProjectStateService
    readonly specs: RuleRegistrySet["projectSpecs"]
  }
  readonly schemas: RuleRegistrySet["schemas"]
  readonly validation: ValidationRegistrySet & {
    validateProject(
      params: Omit<ValidateProjectParams, "projectState"> & {
        readonly projectState: ProjectStateService
      },
    ): Promise<ValidateProjectResult>
  }
  readonly metadata: {
    readonly rules: RuleRegistrySet
    readonly operations: OperationRegistrySet
  }
  close(): Promise<void>
}
