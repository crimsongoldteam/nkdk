import { allPropertyStateModes, definePropertyStateItemCapabilities, externalProperty } from "../configurationExtension/propertyStateCapabilities"
import { MetadataTaskRules } from "./rules"

export const metadataTaskPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataTaskRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...externalProperty("objectModule", "МодульОбъекта", ["extend"]),
    ...externalProperty("managerModule", "МодульМенеджера", ["extend"]),
    ...allPropertyStateModes("numberType", "numberLength", "numberAllowedLength", "checkUnique", "descriptionLength", "addressing", "mainAddressingAttribute", "currentPerformer"),
  },
})
