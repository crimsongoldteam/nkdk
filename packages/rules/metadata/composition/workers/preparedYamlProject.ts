import { registerCoreMetadata } from "../coreMetadata"

registerCoreMetadata()

export default (await import("../../project/preparedYamlProjectWorker")).default
