import { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataItemFromYAML, importPropertyFromYAML, PropertyRule } from "~/metadata/orchestration"
import { ClientApplicationFormRules } from "./rules"
import { ClientApplicationForm, ClientApplicationFormYAML } from "./types"

export const importClientApplicationFormFromYAML = (
  context: ConfigurationContext,
  data: ClientApplicationFormYAML,
  source: ClientApplicationForm
): ClientApplicationForm => {
  const itemsContext: ConfigurationContext = {
    ...context,
    allElements: data.Элементы,
  }

  const autoCommandBar = importPropertyFromYAML({
    context: itemsContext,
    rule: ClientApplicationFormRules.properties.autoCommandBar as PropertyRule,
    value: data.КоманднаяПанель,
    sourceValue: source.autoCommandBar,
  })

  const properties = importMetadataItemFromYAML({
    context: itemsContext,
    yaml: data,
    rule: ClientApplicationFormRules,
    source: source,
  })

  if (properties == undefined) throw new Error("Properties are required")

  const result: ClientApplicationForm = {
    ...(autoCommandBar ? { autoCommandBar } : {}),
    ...properties,
  }

  return result
}
