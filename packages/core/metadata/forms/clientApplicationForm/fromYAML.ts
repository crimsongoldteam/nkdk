import { ConfigurationContext } from "../../context/types"
import { importMetadataItemFromYAML } from "../../orchestration"
import { ClientApplicationFormRules } from "./rules"
import { ClientApplicationForm, ClientApplicationFormYAML } from "./types"

export const importClientApplicationFormFromYAML = (
  context: ConfigurationContext,
  data: ClientApplicationFormYAML,
  source?: ClientApplicationForm,
  name?: string
): ClientApplicationForm => {
  const properties = importMetadataItemFromYAML({
    context,
    yaml: data,
    rule: ClientApplicationFormRules,
    source,
    name,
  })

  if (properties == undefined) throw new Error("Properties are required")

  return properties
}
