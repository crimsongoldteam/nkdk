import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../metadataExecutionContext"
import { metadataRules } from "../metadataRules"

const registries = createMetadataExecutionRegistrySets(metadataRules)
const { createImportWorkerCommandRunner } = await import("../../importFromXml/worker")
const worker = createImportWorkerCommandRunner().entryPoint

export default (command: Parameters<typeof worker>[0]) =>
  withMetadataExecutionRegistrySets(registries, () => worker(command))
