import { registerCoreMetadata } from "../coreMetadata"

registerCoreMetadata()

export default (await import("../../fullSyncToXml/worker")).default
