import { controlled, definePropertyStateItemCapabilities, externalProperty } from "../configurationExtension/propertyStateCapabilities"
import { MetadataAccumulationRegisterRules } from "./rules"

export const metadataAccumulationRegisterPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataAccumulationRegisterRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...externalProperty("recordSetModule", "МодульНабораЗаписей", ["extend"]),
    ...externalProperty("managerModule", "МодульМенеджера", ["extend"]),
    ...controlled("registerType"),
  },
})
