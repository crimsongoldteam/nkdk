import { allPropertyStateModes, definePropertyStateItemCapabilities, externalProperty } from "../configurationExtension/propertyStateCapabilities"
import { MetadataBusinessProcessRules } from "./rules"

export const metadataBusinessProcessPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataBusinessProcessRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...allPropertyStateModes("numberType", "numberLength", "numberAllowedLength", "task"),
    ...externalProperty("flowchart", "КартаМаршрута", ["extend"]),
  },
})
