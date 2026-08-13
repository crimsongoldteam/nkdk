import { allPropertyStateModes, definePropertyStateItemCapabilities, externalProperty } from "../configurationExtension/propertyStateCapabilities"
import { MetadataBusinessProcessRules } from "./rules"

export const metadataBusinessProcessPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataBusinessProcessRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...externalProperty("objectModule", "МодульОбъекта", ["extend"]),
    ...externalProperty("managerModule", "МодульМенеджера", ["extend"]),
    ...externalProperty("flowchart", "КартаМаршрута", ["extend"]),
    ...allPropertyStateModes("numberType", "numberLength", "numberAllowedLength", "task"),
  },
})
