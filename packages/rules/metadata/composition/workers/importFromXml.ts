import { registerCoreMetadata } from "../coreMetadata"

registerCoreMetadata()

export default (await import("../../importFromXml/worker")).default
