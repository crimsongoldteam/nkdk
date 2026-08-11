import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../metadataExecutionContext"
import { metadataRules } from "../metadataRules"

const registries = createMetadataExecutionRegistrySets(metadataRules)
const { createFullXmlSyncWorkerCommandRunner } = await import("../../fullSyncToXml/worker")
const worker = createFullXmlSyncWorkerCommandRunner().entryPoint

export default (command: Parameters<typeof worker>[0]) =>
  withMetadataExecutionRegistrySets(registries, () => worker(command))
