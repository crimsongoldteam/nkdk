import { registerCoreMetadata } from "../coreMetadata"

registerCoreMetadata()

const [{ createMetadataWorkerCommandHandler }, { createMetadataWorkerOperations }] = await Promise.all([
  import("../../workerPool/worker"),
  import("../workerOperations"),
])

export default createMetadataWorkerCommandHandler({
  operations: createMetadataWorkerOperations(),
})
