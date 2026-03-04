import { Configuration, ConfigurationYAML } from "~/metadata/appliedObjects/configuration/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { importPropertiesFromYAML } from "~/metadata/orchestration"
import { ConfigurationRules } from "./rules"

export const importConfigurationFromYAML = (
  context: ConfigurationContext,
  data: ConfigurationYAML | undefined,
  name?: string
): Configuration | undefined => {
  if (!data) return undefined

  const result = importPropertiesFromYAML({
    context,
    metadataType: "Configuration",
    yaml: data,
    rules: ConfigurationRules,
    name,
  })

  const config = result as Configuration
  return {
    ...config,
    itemType: "Configuration",
    name: config.name ?? name ?? "",
  }
}
