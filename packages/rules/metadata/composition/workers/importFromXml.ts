import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../metadataExecutionContext"

const registries = createMetadataExecutionRegistrySets()
const worker = (await import("../../importFromXml/worker")).default

export default (command: Parameters<typeof worker>[0]) =>
  withMetadataExecutionRegistrySets(registries, () => worker(command))
