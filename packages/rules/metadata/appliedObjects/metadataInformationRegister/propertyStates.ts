import { controlled, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataInformationRegisterRules } from "./rules"

export const metadataInformationRegisterPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataInformationRegisterRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: controlled("informationRegisterPeriodicity", "writeMode"),
})
