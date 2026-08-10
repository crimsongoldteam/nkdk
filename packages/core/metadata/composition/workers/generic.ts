import { createMetadataWorkerCommandHandler } from "../../workerPool/worker"
import { createMetadataWorkerOperations } from "../workerOperations"

export default createMetadataWorkerCommandHandler({
  operations: createMetadataWorkerOperations(),
})
