import { controlled, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataAccumulationRegisterRules } from "./rules"

export const metadataAccumulationRegisterPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataAccumulationRegisterRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: controlled("registerType"),
})
