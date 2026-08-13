import { allPropertyStateModes, definePropertyStateItemCapabilities } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataExternalDataSourceFieldRules } from "./rules"

export const metadataExternalDataSourceFieldPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataExternalDataSourceFieldRules, {
  profiles: ["borrowed-base", "register-field"],
  properties: allPropertyStateModes("nameInDataSource", "readOnly", "allowNull"),
})
