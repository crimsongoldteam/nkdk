import { ConfigurationContext } from "~/metadata/context/types"
import { importPropertiesFromYAML, importPropertyFromYAML, PropertyRule } from "~/metadata/orchestration"
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

  const properties = importPropertiesFromYAML({
    context: itemsContext,
    yaml: data,
    metadataRule: ClientApplicationFormRules,
    source: source,
  })

  const result: ClientApplicationForm = {
    ...(autoCommandBar ? { autoCommandBar } : {}),
    ...properties,
    itemType: "ClientApplicationForm",
  }

  return result
}
