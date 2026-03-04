import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertiesToYAML } from "~/metadata/orchestration"
import { ConfigurationRules } from "./rules"
import { Configuration, ConfigurationYAML } from "./types"

export const exportConfigurationToYAML = (
  context: ConfigurationContext,
  data: Configuration | undefined
): ConfigurationYAML | undefined => {
  if (!data) return undefined

  const result = exportPropertiesToYAML({
    context,
    data,
    rules: ConfigurationRules,
  })

  return result
}
