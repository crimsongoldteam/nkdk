import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../metadataExecutionContext"

const registries = createMetadataExecutionRegistrySets()
const { createFullXmlSyncWorkerCommandRunner } = await import("../../fullSyncToXml/worker")
const worker = createFullXmlSyncWorkerCommandRunner().entryPoint

export default (command: Parameters<typeof worker>[0]) =>
  withMetadataExecutionRegistrySets(registries, () => worker(command))
