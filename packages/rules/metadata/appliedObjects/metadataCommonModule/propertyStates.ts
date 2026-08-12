import { controlled, definePropertyStateItemCapabilities, externalProperty } from "../configurationExtension/propertyStateCapabilities"
import { MetadataCommonModuleRules } from "./rules"
export const metadataCommonModulePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataCommonModuleRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...controlled("global", "clientManagedApplication", "clientOrdinaryApplication", "server", "externalConnection", "privileged", "serverCall", "returnValuesReuse"),
    ...externalProperty("module", "Модуль", ["extend"]),
  },
})
