import { Configuration, ConfigurationXML } from "~/metadata/appliedObjects/configuration/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { importPropertiesFromXML } from "~/metadata/metadataFactory"
import { ConfigurationRules } from "./rules"

export const importConfigurationFromXML = (
  context: ConfigurationContext,
  xml: ConfigurationXML
): Configuration => {
  const result = importPropertiesFromXML<Configuration>({
    context,
    xml,
    rule: ConfigurationRules,
  })!

  return {
    ...result,
    itemType: "Configuration",
  }
}
